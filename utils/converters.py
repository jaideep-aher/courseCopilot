"""
Converters between data formats used by different components.
"""
import re
from typing import List

from utils.catalog_scraper import CatalogCourse
from models.schemas import Course


def catalog_course_to_course(cc: CatalogCourse) -> Course:
    """Convert a CatalogCourse (scraper output) to a Course (matcher input)."""
    course = Course(
        university=cc.university,
        category=cc.category,
        file_name=cc.file_name,
        course_title=cc.course_title,
        instructor_name=cc.instructor_name if cc.instructor_name != "N/A" else None,
        instructor_email=cc.instructor_email if cc.instructor_email != "N/A" else None,
        course_description=cc.course_description_summary or None,
        knowledge_points=cc.knowledge_points or None,
        prerequisites=cc.prerequisites or None,
        textbooks_materials=cc.textbooks_materials if cc.textbooks_materials != "N/A" else None,
        grading_scale=cc.grading_scale if cc.grading_scale != "Standard" else None,
        assignments_summary=cc.assignments_summary if cc.assignments_summary != "N/A" else None,
        weekly_schedule=cc.weekly_schedule_highlights if cc.weekly_schedule_highlights != "N/A" else None,
    )
    match = re.match(r'^([A-Z]{2,6}\s*\d{3,4}[A-Z]?)', course.course_title)
    if match:
        course.course_code = match.group(1).strip()
    return course


def catalog_courses_to_courses(ccs: List[CatalogCourse]) -> List[Course]:
    """Convert a list of CatalogCourses to Course objects."""
    return [catalog_course_to_course(cc) for cc in ccs]
