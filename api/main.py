"""
Course Co-Pilot API
FastAPI application for transfer credit evaluation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import time
import asyncio

import openai

from core.config import settings
from core.data_loader import CourseDataLoader
from core.matcher import SimilarityEngine
from core.catalog_cache import CatalogCache
from core.pipeline import TransferPipeline
from models.schemas import (
    Course, CourseSummary, CourseMatchResult,
    EvaluationRequest, EvaluationResponse, CustomSyllabusRequest,
    PipelineRequest, PipelineResponse, TranscriptPipelineResponse,
)


# Initialize FastAPI app
app = FastAPI(
    title="Course Co-Pilot API",
    description="In-house transfer credit evaluation system using local ML models",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (in production, use proper database)
data_loader: Optional[CourseDataLoader] = None
similarity_engine: Optional[SimilarityEngine] = None
evaluation_cache: Dict[str, Any] = {}
catalog_cache: CatalogCache = CatalogCache(ttl_seconds=settings.catalog_cache_ttl)
pipeline: Optional[TransferPipeline] = None


# ============== Request/Response Models ==============

class LoadDataRequest(BaseModel):
    csv_path: str


class CourseListResponse(BaseModel):
    courses: List[Dict[str, Any]]
    total: int
    university: Optional[str] = None


class MatchRequest(BaseModel):
    source_course_id: str  # file_name of source course
    target_university: str = "Duke"


class BatchMatchRequest(BaseModel):
    source_course_ids: List[str]
    target_university: str = "Duke"


class HealthResponse(BaseModel):
    status: str
    data_loaded: bool
    source_courses: int
    target_courses: int


# ============== Startup/Shutdown ==============

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global similarity_engine, data_loader, pipeline

    try:
        # Initialize OpenAI client (used for both scoring and research)
        openai_client = None
        if settings.openai_api_key:
            openai_client = openai.OpenAI(api_key=settings.openai_api_key)
            print(f"✓ OpenAI client initialized (scoring model: {settings.scoring_model})")
        else:
            print("  Warning: OPENAI_API_KEY not set. LLM scoring and transcript pipeline will not work.")

        # Initialize similarity engine (LLM-based scoring)
        similarity_engine = SimilarityEngine(openai_client)
        print("✓ LLM similarity engine initialized")

        # Initialize on-demand pipeline
        pipeline = TransferPipeline(similarity_engine, catalog_cache, openai_client)
        print("✓ On-demand evaluation pipeline ready")
        print("  POST /pipeline/evaluate — manual course input")
        print("  POST /pipeline/transcript-evaluate — transcript PDF upload")
    except Exception as e:
        print(f"Error: Could not initialize similarity engine: {e}")
        print("Ensure sentence-transformers and scikit-learn are installed")

    # Auto-load the default dataset (optional — legacy endpoints use this)
    try:
        csv_path = settings.default_csv_path
        data_loader = CourseDataLoader(csv_path)
        data_loader.load()
        stats = data_loader.get_statistics()
        print(f"✓ Dataset loaded: {stats['total_courses']} courses from {csv_path}")
        print(f"  Universities: {stats['by_university']}")
    except Exception as e:
        print(f"  Note: Static dataset not loaded ({e}). Legacy endpoints unavailable.")
        print("  The on-demand pipeline (/pipeline/evaluate) works without a dataset.")
        data_loader = None


# ============== Endpoints ==============

@app.get("/", tags=["General"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Course Co-Pilot API",
        "version": "2.0.0",
        "description": "In-house transfer credit evaluation (no external APIs)",
        "matching_method": "Local ML models (sentence-transformers + TF-IDF + rule-based)",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """Health check endpoint"""
    source_count = 0
    target_count = 0

    if data_loader:
        source_count = len(data_loader.get_source_courses(settings.source_university))
        target_count = len(data_loader.get_target_courses(settings.target_university))

    return HealthResponse(
        status="healthy",
        data_loaded=data_loader is not None,
        source_courses=source_count,
        target_courses=target_count,
    )


@app.post("/data/load", tags=["Data Management"])
async def load_data(request: LoadDataRequest):
    """Load course data from CSV file"""
    global data_loader
    
    try:
        data_loader = CourseDataLoader(request.csv_path)
        data_loader.load()
        
        stats = data_loader.get_statistics()
        
        return {
            "status": "success",
            "message": "Data loaded successfully",
            "statistics": stats,
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"CSV file not found: {request.csv_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses", response_model=CourseListResponse, tags=["Courses"])
async def list_courses(university: Optional[str] = None):
    """List all loaded courses, optionally filtered by university"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    if university:
        courses = data_loader.get_courses_by_university(university)
    else:
        courses = list(data_loader.courses.values())
    
    return CourseListResponse(
        courses=[c.model_dump() for c in courses],
        total=len(courses),
        university=university,
    )


@app.get("/courses/source", tags=["Courses"])
async def list_source_courses(university: Optional[str] = None):
    """List courses from source university"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")

    uni = university or settings.source_university
    courses = data_loader.get_source_courses(uni)
    return {
        "university": uni,
        "courses": [
            {
                "id": c.file_name,
                "title": c.course_title,
                "category": c.category,
                "code": c.course_code,
            }
            for c in courses
        ],
        "total": len(courses),
    }


@app.get("/courses/target", tags=["Courses"])
async def list_target_courses(university: Optional[str] = None):
    """List courses from target university"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")

    uni = university or settings.target_university
    courses = data_loader.get_target_courses(uni)
    return {
        "university": uni,
        "courses": [
            {
                "id": c.file_name,
                "title": c.course_title,
                "category": c.category,
                "code": c.course_code,
            }
            for c in courses
        ],
        "total": len(courses),
    }


@app.get("/courses/{course_id}", tags=["Courses"])
async def get_course(course_id: str):
    """Get details of a specific course by ID (file_name)"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    course = data_loader.get_course_by_filename(course_id)
    if not course:
        raise HTTPException(status_code=404, detail=f"Course not found: {course_id}")
    
    return course.model_dump()


@app.post("/match/single", tags=["Matching"])
async def match_single_course(request: MatchRequest):
    """Find matches for a single source course"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    if not similarity_engine:
        raise HTTPException(status_code=500, detail="Similarity engine not initialized")
    
    # Get source course
    source_course = data_loader.get_course_by_filename(request.source_course_id)
    if not source_course:
        raise HTTPException(status_code=404, detail=f"Source course not found: {request.source_course_id}")
    
    # Get target courses
    target_courses = data_loader.get_target_courses(request.target_university)
    if not target_courses:
        raise HTTPException(
            status_code=404, 
            detail=f"No target courses found for university: {request.target_university}"
        )
    
    try:
        result = await similarity_engine.evaluate_single_course(source_course, target_courses)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match/batch", tags=["Matching"])
async def match_batch_courses(request: BatchMatchRequest):
    """Find matches for multiple source courses"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    if not similarity_engine:
        raise HTTPException(status_code=500, detail="Similarity engine not initialized")
    
    # Get source courses
    source_courses = []
    not_found = []
    
    for course_id in request.source_course_ids:
        course = data_loader.get_course_by_filename(course_id)
        if course:
            source_courses.append(course)
        else:
            not_found.append(course_id)
    
    if not source_courses:
        raise HTTPException(status_code=404, detail="No valid source courses found")
    
    # Get target courses
    target_courses = data_loader.get_target_courses(request.target_university)
    if not target_courses:
        raise HTTPException(
            status_code=404,
            detail=f"No target courses found for university: {request.target_university}"
        )
    
    try:
        evaluation = await similarity_engine.evaluate_transfer(source_courses, target_courses)
        
        # Infer source university from the first course
        source_uni = source_courses[0].university if source_courses else "Unknown"

        # Build response
        response = {
            "request_id": str(uuid.uuid4()),
            "source_university": source_uni,
            "target_university": request.target_university,
            "results": [r.model_dump() for r in evaluation["results"]],
            "summary": evaluation["summary"],
            "warnings": evaluation["warnings"],
        }
        
        if not_found:
            response["not_found_courses"] = not_found
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate", response_model=EvaluationResponse, tags=["Matching"])
async def evaluate_transfer(request: EvaluationRequest):
    """
    Complete transfer credit evaluation
    Evaluates all specified source courses against target university
    """
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    if not similarity_engine:
        raise HTTPException(status_code=500, detail="Similarity engine not initialized")
    
    start_time = time.time()
    
    # Get source courses
    source_courses = []
    for course_id in request.source_courses:
        course = data_loader.get_course_by_filename(course_id)
        if course:
            source_courses.append(course)
    
    if not source_courses:
        raise HTTPException(status_code=404, detail="No valid source courses found")
    
    # Get target courses
    target_courses = data_loader.get_target_courses(request.target_university)
    if not target_courses:
        raise HTTPException(
            status_code=404,
            detail=f"No target courses found for: {request.target_university}"
        )
    
    try:
        evaluation = await similarity_engine.evaluate_transfer(source_courses, target_courses)
        processing_time = time.time() - start_time
        
        # Infer source university from the first course
        source_uni = source_courses[0].university if source_courses else "Unknown"

        return EvaluationResponse(
            request_id=str(uuid.uuid4()),
            source_university=source_uni,
            target_university=request.target_university,
            total_courses_evaluated=len(source_courses),
            results=evaluation["results"],
            processing_time_seconds=round(processing_time, 2),
            warnings=evaluation["warnings"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match/custom", tags=["Matching"])
async def match_custom_syllabus(request: CustomSyllabusRequest):
    """
    Match a custom syllabus (NOT in the dataset) against target university catalog.

    This is the main endpoint for students submitting their own syllabi.
    You provide the syllabus information, and it matches against the target catalog.
    """
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")

    if not similarity_engine:
        raise HTTPException(status_code=500, detail="Similarity engine not initialized")

    # Create a Course object from the submitted syllabus data
    custom_course = Course(
        university=request.source_university,
        category=request.category or "General",
        file_name=f"custom_{uuid.uuid4().hex[:8]}",  # Generate unique ID
        course_title=request.course_title,
        instructor_name=request.instructor_name,
        course_description=request.course_description,
        knowledge_points=request.knowledge_points,
        prerequisites=request.prerequisites,
        textbooks_materials=request.textbooks_materials,
        course_code=request.course_code,
    )

    # Get target courses from the dataset
    target_courses = data_loader.get_target_courses(request.target_university)
    if not target_courses:
        raise HTTPException(
            status_code=404,
            detail=f"No target courses found for university: {request.target_university}"
        )

    try:
        # Match the custom course against target catalog
        result = await similarity_engine.evaluate_single_course(custom_course, target_courses)
        return result.model_dump()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Matching error: {str(e)}")


class ScrapeRequest(BaseModel):
    university: str  # University key (e.g., "duke")
    subjects: Optional[List[str]] = None  # Subject codes to scrape (None = all)
    limit: Optional[int] = None  # Max courses to fetch
    merge: bool = True  # Merge with current loaded dataset


@app.post("/catalog/scrape", tags=["Catalog Scraping"])
async def scrape_catalog(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Scrape a university's course catalog and load it into the system.

    This is the key endpoint for automation — given a target university,
    it automatically fetches their full course catalog from their online
    catalog system (e.g., Coursedog) and makes it available for matching.
    """
    from utils.catalog_scraper import get_provider, UNIVERSITY_REGISTRY, export_to_csv

    if request.university.lower() not in UNIVERSITY_REGISTRY:
        available = list(UNIVERSITY_REGISTRY.keys())
        raise HTTPException(
            status_code=400,
            detail=f"University '{request.university}' not registered. Available: {available}",
        )

    try:
        provider = get_provider(request.university)
        uni_config = UNIVERSITY_REGISTRY[request.university.lower()]
        uni_name = uni_config["university_name"]

        courses = provider.get_courses(
            subjects=request.subjects,
            limit=request.limit,
        )

        if not courses:
            return {"status": "no_courses", "message": "No courses found", "count": 0}

        # Save to CSV
        output_path = f"data/{request.university.lower()}_catalog.csv"
        export_to_csv(courses, output_path)

        # If merge requested, reload the data loader with merged data
        if request.merge and data_loader:
            from utils.catalog_scraper import merge_with_existing
            merge_with_existing(
                courses, settings.default_csv_path, settings.default_csv_path, uni_name,
            )
            # Reload
            data_loader.load()
            stats = data_loader.get_statistics()
            return {
                "status": "success",
                "message": f"Scraped and merged {len(courses)} courses from {uni_name}",
                "courses_scraped": len(courses),
                "catalog_file": output_path,
                "dataset_stats": stats,
            }

        return {
            "status": "success",
            "message": f"Scraped {len(courses)} courses from {uni_name}",
            "courses_scraped": len(courses),
            "catalog_file": output_path,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Scraping error: {str(e)}")


@app.get("/catalog/universities", tags=["Catalog Scraping"])
async def list_scrapeable_universities():
    """List universities that can be automatically scraped"""
    from utils.catalog_scraper import UNIVERSITY_REGISTRY
    return {
        "universities": {
            key: {
                "name": config.get("university_name", key),
                "provider": config.get("provider", "unknown"),
                "catalog_url": config.get("catalog_url", config.get("origin", "")),
            }
            for key, config in UNIVERSITY_REGISTRY.items()
        }
    }


@app.get("/catalog/subjects/{university}", tags=["Catalog Scraping"])
async def list_catalog_subjects(university: str):
    """List available subject codes for a university's catalog"""
    from utils.catalog_scraper import get_provider, UNIVERSITY_REGISTRY

    if university.lower() not in UNIVERSITY_REGISTRY:
        raise HTTPException(status_code=400, detail=f"University '{university}' not registered")

    try:
        provider = get_provider(university)
        subjects = provider.get_subjects()
        return {"university": university, "subjects": subjects, "total": len(subjects)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/universities", tags=["General"])
async def list_universities():
    """List all universities available in the loaded dataset"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")

    stats = data_loader.get_statistics()
    return {
        "universities": stats["by_university"],
        "total": len(stats["by_university"]),
    }


@app.get("/statistics", tags=["General"])
async def get_statistics():
    """Get statistics about loaded data"""
    if not data_loader:
        raise HTTPException(status_code=400, detail="Data not loaded. Call /data/load first.")
    
    return data_loader.get_statistics()


# ============== On-Demand Pipeline ==============


@app.post("/pipeline/evaluate", response_model=PipelineResponse, tags=["Pipeline"])
async def pipeline_evaluate(request: PipelineRequest):
    """
    On-demand transfer credit evaluation.

    Accepts source courses, fetches target university catalog on-demand,
    runs matching, and returns transfer credit recommendations.

    This is the primary endpoint for the automated pipeline.
    No pre-loaded dataset required — target catalog is fetched live.
    """
    if not pipeline:
        raise HTTPException(status_code=500, detail="Pipeline not initialized")

    try:
        return await pipeline.evaluate(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.post("/pipeline/transcript-evaluate", tags=["Pipeline"])
async def pipeline_transcript_evaluate(
    file: UploadFile = File(..., description="Transcript PDF file"),
    target_university: str = Form("Duke", description="Target university name"),
    top_n: int = Form(3, description="Number of top matches per course"),
):
    """
    Upload a transcript PDF and get transfer credit recommendations.

    This is the primary endpoint for the new flow:
    transcript upload -> AI web research -> matching -> recommendations.
    """
    if not pipeline:
        raise HTTPException(status_code=500, detail="Pipeline not initialized")

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured. Required for transcript evaluation.",
        )

    # Validate file type
    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    try:
        pdf_bytes = await file.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        result = await pipeline.evaluate_transcript(pdf_bytes, target_university, top_n)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Transcript evaluation error: {str(e)}")


@app.post("/pipeline/transcript-evaluate-stream", tags=["Pipeline"])
async def pipeline_transcript_evaluate_stream(
    file: UploadFile = File(..., description="Transcript PDF file"),
    target_university: str = Form("Duke", description="Target university name"),
    top_n: int = Form(3, description="Number of top matches per course"),
):
    """
    Upload a transcript PDF and stream progress updates via SSE.

    Returns Server-Sent Events with progress updates, then the final result.
    """
    if not pipeline:
        raise HTTPException(status_code=500, detail="Pipeline not initialized")

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured.",
        )

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    async def event_stream():
        progress_queue: asyncio.Queue = asyncio.Queue()

        async def progress_callback(agent, stage, current, total, message):
            await progress_queue.put({
                "type": "progress",
                "agent": agent,
                "stage": stage,
                "current": current,
                "total": total,
                "message": message,
            })

        async def run_pipeline():
            try:
                result = await pipeline.evaluate_transcript(
                    pdf_bytes, target_university, top_n,
                    progress_callback=progress_callback,
                )
                await progress_queue.put({"type": "result", "data": result.model_dump()})
            except Exception as e:
                await progress_queue.put({"type": "error", "message": str(e)})
            finally:
                await progress_queue.put(None)  # Signal end

        task = asyncio.create_task(run_pipeline())

        while True:
            item = await progress_queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"

        await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.delete("/pipeline/cache", tags=["Pipeline"])
async def clear_pipeline_cache(university: Optional[str] = None):
    """Clear cached catalog data for a university or all universities."""
    catalog_cache.invalidate(university)
    return {"status": "cleared", "university": university or "all"}


# ============== Error Handlers ==============

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# ============== Run Server ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
