"""
Core module for Course Co-Pilot
"""
from core.config import settings
from core.data_loader import CourseDataLoader, load_courses
from core.llm_client import get_llm_client, LLMClient
from core.summarizer import CourseSummarizer, summarize_course
from core.matcher import SimilarityMatcher, SimilarityEngine, find_course_matches

__all__ = [
    "settings",
    "CourseDataLoader",
    "load_courses",
    "get_llm_client",
    "LLMClient",
    "CourseSummarizer",
    "summarize_course",
    "SimilarityMatcher",
    "SimilarityEngine",
    "find_course_matches",
]
