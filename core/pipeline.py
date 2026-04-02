"""
On-demand transfer credit evaluation pipeline.

Orchestrates: source course parsing -> target catalog fetching -> matching -> recommendations.
"""
import re
import time
import uuid
from typing import Callable, List, Optional

import openai

from models.schemas import (
    Course, SourceCourseInput, PipelineRequest, PipelineResponse,
    CourseRecommendation, TranscriptPipelineResponse, TranscriptParseResult,
)
from core.matcher import SimilarityEngine
from core.catalog_cache import CatalogCache
from core.subject_filter import infer_target_subjects
from core.config import settings
from core.research_agent import CourseResearchAgent
from utils.transcript_parser import TranscriptParser

# Keep legacy imports for backward compat (may not be installed)
try:
    from utils.catalog_scraper import get_provider, UNIVERSITY_REGISTRY
    from utils.converters import catalog_courses_to_courses
except ImportError:
    UNIVERSITY_REGISTRY = {}
    get_provider = None
    catalog_courses_to_courses = None


class TransferPipeline:
    """On-demand transfer credit evaluation pipeline."""

    def __init__(
        self,
        similarity_engine: SimilarityEngine,
        cache: CatalogCache,
        openai_client: Optional[openai.OpenAI] = None,
    ):
        self.engine = similarity_engine
        self.cache = cache
        self.openai_client = openai_client
        self._transcript_parser = TranscriptParser(openai_client)

    async def evaluate(self, request: PipelineRequest) -> PipelineResponse:
        """
        Full pipeline: parse source courses, fetch target catalog, match, return recommendations.
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())[:8]

        # Step 1: Build source Course objects
        source_courses = [self._input_to_course(c) for c in request.courses]

        # Step 2: Fetch target catalog (with cache)
        target_courses, subjects_used, was_cached = self._fetch_target_catalog(
            request.target_university,
            source_courses,
            request.target_subjects,
        )

        if not target_courses:
            return PipelineResponse(
                request_id=request_id,
                target_university=request.target_university,
                target_courses_fetched=0,
                target_subjects_used=subjects_used,
                recommendations=[],
                summary={"error": "No target courses found. Check university key and subjects."},
                processing_time_seconds=round(time.time() - start_time, 2),
                cached=was_cached,
            )

        # Step 3: Match using existing engine
        evaluation = await self.engine.evaluate_transfer(source_courses, target_courses)

        # Step 4: Build recommendations
        recommendations = []
        for result in evaluation["results"]:
            rec, conf, rationale = self._make_recommendation(result)
            recommendations.append(CourseRecommendation(
                source_course=result.source_course,
                matches=result.top_matches,
                recommendation=rec,
                confidence=conf,
                rationale=rationale,
            ))

        processing_time = round(time.time() - start_time, 2)

        return PipelineResponse(
            request_id=request_id,
            target_university=request.target_university,
            target_courses_fetched=len(target_courses),
            target_subjects_used=subjects_used,
            recommendations=recommendations,
            summary={
                "total_evaluated": len(source_courses),
                "approve": sum(1 for r in recommendations if r.recommendation == "approve"),
                "review": sum(1 for r in recommendations if r.recommendation == "review"),
                "deny": sum(1 for r in recommendations if r.recommendation == "deny"),
                "target_catalog_cached": was_cached,
            },
            processing_time_seconds=processing_time,
            cached=was_cached,
        )

    def _input_to_course(self, inp: SourceCourseInput) -> Course:
        """Convert a SourceCourseInput to a Course object for the matcher."""
        course = Course(
            university=inp.source_university,
            category=inp.category or "",
            file_name=f"INPUT_{inp.source_university}_{inp.course_title[:30]}",
            course_title=inp.course_title,
            instructor_name=inp.instructor_name,
            course_description=inp.course_description,
            knowledge_points=inp.knowledge_points,
            prerequisites=inp.prerequisites,
            textbooks_materials=inp.textbooks_materials,
            course_code=inp.course_code,
            credit_hours=int(inp.credit_hours) if inp.credit_hours else None,
        )
        # Auto-extract course code if not provided
        if not course.course_code and course.course_title:
            match = re.match(r'^([A-Z]{2,6}\s*\d{3,4}[A-Z]?)', course.course_title)
            if match:
                course.course_code = match.group(1).strip()
        return course

    async def evaluate_transcript(
        self,
        pdf_bytes: bytes,
        target_university: str,
        top_n: int = 3,
        progress_callback: Optional[Callable] = None,
    ) -> TranscriptPipelineResponse:
        """
        Full transcript pipeline:
        parse transcript -> research source courses -> research target courses -> match -> recommend.
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())[:8]

        # Step 1: Parse transcript
        if progress_callback:
            await progress_callback("parsing", 0, 1, "Parsing transcript PDF...")
        parse_result = self._transcript_parser.parse(pdf_bytes)
        print(f"  Parsed {len(parse_result.courses)} courses from {parse_result.source_university}")

        if not parse_result.courses:
            return TranscriptPipelineResponse(
                request_id=request_id,
                source_university=parse_result.source_university,
                target_university=target_university,
                courses_parsed=0,
                source_courses_researched=0,
                target_courses_researched=0,
                recommendations=[],
                transcript_parse=parse_result,
                summary={"error": "No courses found in transcript."},
                processing_time_seconds=round(time.time() - start_time, 2),
            )

        # Filter out labs, recitations, seminars, etc.
        evaluable_courses = self._filter_evaluable_courses(parse_result.courses)
        print(f"  Filtered to {len(evaluable_courses)} evaluable courses (excluded labs/recitations/seminars)")

        if not evaluable_courses:
            return TranscriptPipelineResponse(
                request_id=request_id,
                source_university=parse_result.source_university,
                target_university=target_university,
                courses_parsed=len(parse_result.courses),
                source_courses_researched=0,
                target_courses_researched=0,
                recommendations=[],
                transcript_parse=parse_result,
                summary={"error": "All parsed courses are labs/recitations/seminars — nothing to evaluate."},
                processing_time_seconds=round(time.time() - start_time, 2),
            )

        # Step 2: Research source courses via AI agent
        agent = CourseResearchAgent(self.openai_client)

        async def source_progress(current, total, msg):
            if progress_callback:
                await progress_callback("researching_source", current, total, msg)

        print(f"  Researching {len(evaluable_courses)} source courses at {parse_result.source_university}...")
        source_courses = await agent.research_source_courses(
            evaluable_courses, parse_result.source_university, progress_callback=source_progress
        )

        # Step 3: Research target courses via AI agent
        async def target_progress(current, total, msg):
            if progress_callback:
                await progress_callback("researching_target", current, total, msg)

        print(f"  Searching for equivalent courses at {target_university}...")
        target_courses = await agent.research_target_courses(
            source_courses, target_university, progress_callback=target_progress
        )
        print(f"  Found {len(target_courses)} target courses at {target_university}")

        if not target_courses:
            return TranscriptPipelineResponse(
                request_id=request_id,
                source_university=parse_result.source_university,
                target_university=target_university,
                courses_parsed=len(parse_result.courses),
                source_courses_researched=len(source_courses),
                target_courses_researched=0,
                recommendations=[],
                transcript_parse=parse_result,
                summary={"error": f"Could not find courses at {target_university}."},
                processing_time_seconds=round(time.time() - start_time, 2),
            )

        # Step 4: Match using existing engine
        if progress_callback:
            await progress_callback("matching", 0, len(source_courses), "Running similarity analysis...")
        evaluation = await self.engine.evaluate_transfer(source_courses, target_courses)

        # Step 5: Build recommendations
        recommendations = []
        for result in evaluation["results"]:
            rec, conf, rationale = self._make_recommendation(result)
            recommendations.append(CourseRecommendation(
                source_course=result.source_course,
                matches=result.top_matches,
                recommendation=rec,
                confidence=conf,
                rationale=rationale,
            ))

        processing_time = round(time.time() - start_time, 2)

        return TranscriptPipelineResponse(
            request_id=request_id,
            source_university=parse_result.source_university,
            target_university=target_university,
            courses_parsed=len(parse_result.courses),
            source_courses_researched=len(source_courses),
            target_courses_researched=len(target_courses),
            recommendations=recommendations,
            transcript_parse=parse_result,
            summary={
                "total_evaluated": len(source_courses),
                "approve": sum(1 for r in recommendations if r.recommendation == "approve"),
                "review": sum(1 for r in recommendations if r.recommendation == "review"),
                "deny": sum(1 for r in recommendations if r.recommendation == "deny"),
            },
            processing_time_seconds=processing_time,
        )

    # Course types to exclude from evaluation
    _SKIP_KEYWORDS = re.compile(
        r"\b(lab|laboratory|recitation|seminar|practicum|internship|"
        r"independent\s+study|thesis|dissertation|research\s+credit|"
        r"directed\s+study|field\s+experience|clinical|co-?op)\b",
        re.IGNORECASE,
    )

    def _filter_evaluable_courses(self, courses: list) -> list:
        """Remove labs, recitations, seminars, and similar non-lecture courses."""
        return [
            c for c in courses
            if not self._SKIP_KEYWORDS.search(c.course_name or "")
        ]

    def _fetch_target_catalog(
        self,
        university_key: str,
        source_courses: List[Course],
        explicit_subjects: Optional[List[str]] = None,
    ) -> tuple:
        """
        Fetch target catalog with caching and smart subject selection.
        Returns: (courses, subjects_used, was_cached)
        """
        uni_key = university_key.lower()
        if uni_key not in UNIVERSITY_REGISTRY:
            available = ", ".join(sorted(UNIVERSITY_REGISTRY.keys()))
            raise ValueError(f"University '{university_key}' not registered. Available: {available}")

        provider = get_provider(uni_key)
        uni_name = UNIVERSITY_REGISTRY[uni_key]["university_name"]

        # Determine subjects
        if explicit_subjects:
            subjects = explicit_subjects
        else:
            available_subjects = provider.get_subjects()
            subjects = infer_target_subjects(
                source_courses, available_subjects,
                max_subjects=settings.max_target_subjects,
            )

        # Check cache
        cached = self.cache.get(uni_key, subjects)
        if cached:
            print(f"  Cache hit: {len(cached)} courses for {uni_name} ({len(subjects)} subjects)")
            return cached, subjects, True

        # Scrape
        print(f"  Scraping {uni_name} catalog: {len(subjects)} subjects ({', '.join(subjects[:5])}...)")
        catalog_courses = provider.get_courses(subjects=subjects)
        courses = catalog_courses_to_courses(catalog_courses)
        print(f"  Fetched {len(courses)} target courses")

        # Cache
        self.cache.put(uni_key, courses, subjects)

        return courses, subjects, False

    def _make_recommendation(self, result) -> tuple:
        """
        Derive a transfer credit recommendation from match results.
        Returns: (recommendation, confidence, rationale)
        """
        if not result.top_matches:
            return "deny", "low", "No matching courses found in target catalog."

        best = result.top_matches[0]
        score = best.similarity_score

        if score >= 0.70:
            return (
                "approve",
                "very_high" if score >= 0.85 else ("high" if score >= 0.75 else "medium"),
                f"Strong match ({int(score*100)}%) with {best.target_course.course_title}. "
                f"{best.recommendation_rationale}",
            )
        elif score >= 0.50:
            return (
                "review",
                "medium",
                f"Moderate match ({int(score*100)}%) with {best.target_course.course_title}. "
                f"Manual review recommended. {best.recommendation_rationale}",
            )
        else:
            return (
                "deny",
                "medium" if score >= 0.35 else "high",
                f"Low similarity ({int(score*100)}%) — no strong equivalent found. "
                f"Best candidate: {best.target_course.course_title}.",
            )
