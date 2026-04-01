"""
Pydantic models for Course Co-Pilot data structures
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class University(str, Enum):
    """Supported universities"""
    HOUSTON = "Houston"
    HOUSTON_LAW = "Houston_Law"
    DUKE = "Duke"
    HARVARD = "Harvard"
    STANFORD = "Stanford"
    UC_BERKELEY = "UC_Berkeley"
    BERKELEY = "Berkeley"
    GEORGIA_TECH = "GeorgiaTech"
    US_UNIVERSITIES = "US_Universities"
    ILLINOIS = "Illinois"
    UCLA = "UCLA"
    CMU = "CMU"
    HAVERFORD = "Haverford"
    NYU = "NYU"
    SJSU = "SJSU"
    UMICH = "UMich"


class Course(BaseModel):
    """Structured course information"""
    university: str
    category: str
    file_name: str
    course_title: str
    instructor_name: Optional[str] = None
    instructor_email: Optional[str] = None
    course_description: Optional[str] = None
    knowledge_points: Optional[str] = None  # Topics/learning outcomes
    prerequisites: Optional[str] = None
    textbooks_materials: Optional[str] = None
    grading_scale: Optional[str] = None
    assignments_summary: Optional[str] = None
    weekly_schedule: Optional[str] = None
    
    # Computed/enriched fields
    course_code: Optional[str] = None
    credit_hours: Optional[int] = None

    # Source reference
    source_link: Optional[str] = None
    data_source: Optional[str] = None
    
    class Config:
        extra = "allow"


class CourseSummary(BaseModel):
    """Standardized course summary for comparison"""
    course_id: str  # Unique identifier (file_name or course_code)
    course_title: str
    university: str
    category: str
    
    # Structured summary fields
    main_topics: List[str] = Field(default_factory=list)
    learning_outcomes: List[str] = Field(default_factory=list)
    key_concepts: List[str] = Field(default_factory=list)
    course_level: Optional[str] = None  # intro, intermediate, advanced
    estimated_credits: Optional[int] = None
    
    # Raw summary text
    summary_text: str = ""

    # Additional metadata
    course_code: str = ""
    prerequisites: str = ""
    source_link: Optional[str] = None
    
    # Completeness flags
    has_description: bool = False
    has_learning_outcomes: bool = False
    has_prerequisites: bool = False
    has_textbooks: bool = False
    missing_fields: List[str] = Field(default_factory=list)


class SimilarityMatch(BaseModel):
    """A single course match with similarity details"""
    target_course: CourseSummary
    similarity_score: float = Field(ge=0, le=1)  # 0-1 score
    similarity_percentage: int = Field(ge=0, le=100)  # 0-100 for display
    
    # Explanation components
    topic_overlap: List[str] = Field(default_factory=list)
    learning_outcome_alignment: List[str] = Field(default_factory=list)
    key_differences: List[str] = Field(default_factory=list)
    recommendation_rationale: str = ""
    
    # Confidence
    confidence_level: str = "medium"  # low, medium, high


class CourseMatchResult(BaseModel):
    """Complete matching result for a source course"""
    source_course: CourseSummary
    top_matches: List[SimilarityMatch] = Field(default_factory=list)
    
    # Overall assessment
    best_match_found: bool = False
    evaluation_notes: str = ""
    missing_info_warning: Optional[str] = None


class TranscriptCourse(BaseModel):
    """Course extracted from a student transcript"""
    course_code: str
    course_name: str
    credits: Optional[float] = None
    grade: Optional[str] = None
    semester: Optional[str] = None
    source_university: str = ""


class EvaluationRequest(BaseModel):
    """Request to evaluate transfer courses"""
    source_courses: List[str]  # List of course file_names or IDs
    target_university: str = "Duke"


class EvaluationResponse(BaseModel):
    """Complete evaluation response"""
    request_id: str
    source_university: str
    target_university: str
    total_courses_evaluated: int
    results: List[CourseMatchResult]
    processing_time_seconds: float
    warnings: List[str] = Field(default_factory=list)


class CustomSyllabusRequest(BaseModel):
    """Request to match a custom syllabus against target university"""
    # Required fields
    course_title: str
    source_university: str
    target_university: str = "Duke"

    # Optional syllabus fields (more data = better matching)
    course_description: Optional[str] = None
    knowledge_points: Optional[str] = None  # Semicolon-separated keywords or free text
    category: Optional[str] = None
    prerequisites: Optional[str] = None
    textbooks_materials: Optional[str] = None
    instructor_name: Optional[str] = None
    course_code: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "course_title": "Introduction to Data Science",
                "source_university": "Stanford",
                "target_university": "Duke",
                "course_description": "Learn data analysis, machine learning, and statistical modeling using Python",
                "knowledge_points": "python; machine learning; statistics; data visualization; pandas",
                "category": "Computer Science",
                "prerequisites": "Basic programming knowledge"
            }
        }


# ============== On-Demand Pipeline Models ==============


class SourceCourseInput(BaseModel):
    """A single source course submitted by the student for evaluation."""
    course_title: str
    source_university: str
    course_description: Optional[str] = None
    knowledge_points: Optional[str] = None
    category: Optional[str] = None
    prerequisites: Optional[str] = None
    textbooks_materials: Optional[str] = None
    instructor_name: Optional[str] = None
    course_code: Optional[str] = None
    credit_hours: Optional[float] = None
    grade: Optional[str] = None


class PipelineRequest(BaseModel):
    """Request for the on-demand transfer credit evaluation pipeline."""
    courses: List[SourceCourseInput]
    target_university: str = "duke"
    target_subjects: Optional[List[str]] = None  # Override auto-detection
    top_n: int = 3

    class Config:
        json_schema_extra = {
            "example": {
                "courses": [
                    {
                        "course_title": "Introduction to Data Science",
                        "source_university": "Houston",
                        "course_description": "Data analysis, machine learning, statistical modeling using Python",
                        "category": "Computer Science",
                    }
                ],
                "target_university": "duke",
            }
        }


class CourseRecommendation(BaseModel):
    """Transfer credit recommendation for a single source course."""
    source_course: CourseSummary
    matches: List[SimilarityMatch] = Field(default_factory=list)
    recommendation: str  # "approve", "review", "deny"
    confidence: str  # "high", "medium", "low"
    rationale: str


class PipelineResponse(BaseModel):
    """Response from the on-demand evaluation pipeline."""
    request_id: str
    target_university: str
    target_courses_fetched: int
    target_subjects_used: List[str]
    recommendations: List[CourseRecommendation]
    summary: dict
    processing_time_seconds: float
    cached: bool


# ============== Transcript Pipeline Models ==============


class TranscriptParseResult(BaseModel):
    """Result of parsing a student transcript PDF."""
    source_university: str
    courses: List[TranscriptCourse]
    raw_text_preview: str = ""
    confidence: str = "medium"  # "high", "medium", "low"
    warnings: List[str] = Field(default_factory=list)
    # Enriched fields from vision extraction
    student_name: Optional[str] = None
    student_id: Optional[str] = None
    degree_program: Optional[str] = None
    gpa_info: Optional[dict] = None
    additional_info: Optional[str] = None


class ResearchProgress(BaseModel):
    """Progress update for SSE streaming during long-running research."""
    stage: str  # "parsing", "researching_source", "researching_target", "matching"
    current: int = 0
    total: int = 0
    message: str = ""


class TranscriptPipelineResponse(BaseModel):
    """Response from the transcript-based evaluation pipeline."""
    request_id: str
    source_university: str
    target_university: str
    courses_parsed: int
    source_courses_researched: int
    target_courses_researched: int
    recommendations: List[CourseRecommendation]
    transcript_parse: TranscriptParseResult
    summary: dict
    processing_time_seconds: float
