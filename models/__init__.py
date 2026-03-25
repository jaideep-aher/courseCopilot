"""
Data models for Course Co-Pilot
"""
from models.schemas import (
    University,
    Course,
    CourseSummary,
    SimilarityMatch,
    CourseMatchResult,
    TranscriptCourse,
    EvaluationRequest,
    EvaluationResponse,
)

__all__ = [
    "University",
    "Course",
    "CourseSummary",
    "SimilarityMatch",
    "CourseMatchResult",
    "TranscriptCourse",
    "EvaluationRequest",
    "EvaluationResponse",
]
