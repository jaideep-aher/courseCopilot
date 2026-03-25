"""
Data loader for Course Co-Pilot
Handles loading and parsing course data from CSV files
"""
import pandas as pd
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import re

from models.schemas import Course, CourseSummary


class CourseDataLoader:
    """Load and process course data from CSV files"""
    
    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)
        self.df: Optional[pd.DataFrame] = None
        self.courses: Dict[str, Course] = {}
        
    def load(self) -> pd.DataFrame:
        """Load the CSV file into a DataFrame"""
        if not self.csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {self.csv_path}")
        
        self.df = pd.read_csv(self.csv_path)
        self._parse_courses()
        return self.df
    
    def _clean_text(self, text: Optional[str]) -> Optional[str]:
        """Clean and normalize text fields"""
        if pd.isna(text) or text == "..." or text == "":
            return None
        
        # Remove excessive whitespace and normalize
        text = re.sub(r'\s+', ' ', str(text).strip())
        
        # Remove URL artifacts
        text = re.sub(r'https?://\S+', '', text)
        
        return text if text else None
    
    def _extract_course_code(self, title: str) -> Optional[str]:
        """Extract course code from title (e.g., 'AAS 2320' from 'AAS 2320 Intro To...')"""
        match = re.match(r'^([A-Z]{2,4}\s*\d{3,4}[A-Z]?)', title)
        if match:
            return match.group(1).strip()
        return None
    
    def _parse_courses(self) -> None:
        """Parse DataFrame rows into Course objects"""
        if self.df is None:
            raise ValueError("Data not loaded. Call load() first.")

        for idx, row in self.df.iterrows():
            # Skip rows with missing critical fields
            university = row.get('university')
            course_title = row.get('course_title')

            if pd.isna(university) or pd.isna(course_title):
                continue

            # Create unique ID (handle duplicate file_names)
            file_name = str(row.get('file_name', ''))

            if file_name in ['OPEN_SYLLABUS_API', 'PDF_NOT_FOUND', '', 'nan']:
                unique_id = f"{university}_{course_title}_{idx}"
            else:
                unique_id = file_name

            course = Course(
                university=str(university),
                category=str(row.get('category', '')) if pd.notna(row.get('category')) else '',
                file_name=unique_id,
                course_title=self._clean_text(course_title) or '',
                instructor_name=self._clean_text(row.get('instructor_name')),
                instructor_email=self._clean_text(row.get('instructor_email')),
                course_description=self._clean_text(row.get('course_description_summary')),
                knowledge_points=self._clean_text(row.get('knowledge_points')),
                prerequisites=self._clean_text(row.get('prerequisites')),
                textbooks_materials=self._clean_text(row.get('textbooks_materials')),
                grading_scale=self._clean_text(row.get('grading_scale')),
                assignments_summary=self._clean_text(row.get('assignments_summary')),
                weekly_schedule=self._clean_text(row.get('weekly_schedule_highlights')),
            )

            # Extract course code
            course.course_code = self._extract_course_code(course.course_title)

            # Use unique ID as key
            self.courses[unique_id] = course
    
    def get_courses_by_university(self, university: str) -> List[Course]:
        """Get all courses for a specific university"""
        return [c for c in self.courses.values()
                if isinstance(c.university, str) and c.university.lower() == university.lower()]
    
    def get_source_courses(self, source_university: str = "Houston") -> List[Course]:
        """Get courses from source university (student transferring from)"""
        return self.get_courses_by_university(source_university)
    
    def get_target_courses(self, target_university: str = "Duke") -> List[Course]:
        """Get courses from target university (student transferring to)"""
        return self.get_courses_by_university(target_university)
    
    def get_course_by_filename(self, filename: str) -> Optional[Course]:
        """Get a specific course by its filename"""
        return self.courses.get(filename)
    
    def create_course_summary(self, course: Course) -> CourseSummary:
        """Convert a Course to a CourseSummary with completeness flags"""
        
        # Parse knowledge points into topics
        topics = []
        if course.knowledge_points:
            # Split by semicolon or comma
            topics = [t.strip() for t in re.split(r'[;,]', course.knowledge_points) if t.strip()]
        
        # Determine missing fields
        missing = []
        if not course.course_description:
            missing.append("course_description")
        if not course.knowledge_points:
            missing.append("learning_outcomes")
        if not course.prerequisites:
            missing.append("prerequisites")
        if not course.textbooks_materials:
            missing.append("textbooks")
        
        # Determine course level from code
        level = None
        if course.course_code:
            code_num = re.search(r'\d+', course.course_code)
            if code_num:
                num = int(code_num.group())
                if num < 2000:
                    level = "introductory"
                elif num < 4000:
                    level = "intermediate"
                else:
                    level = "advanced"
        
        return CourseSummary(
            course_id=course.file_name,
            course_title=course.course_title,
            university=course.university,
            category=course.category,
            main_topics=topics[:10],  # Limit to top 10
            learning_outcomes=[],  # Will be enriched by LLM
            key_concepts=topics[:5],
            course_level=level,
            has_description=bool(course.course_description),
            has_learning_outcomes=bool(course.knowledge_points),
            has_prerequisites=bool(course.prerequisites),
            has_textbooks=bool(course.textbooks_materials),
            missing_fields=missing,
        )
    
    def get_all_summaries(self, university: Optional[str] = None) -> List[CourseSummary]:
        """Get CourseSummary objects for all (or filtered) courses"""
        courses = self.courses.values()
        if university:
            courses = [c for c in courses if c.university.lower() == university.lower()]
        
        return [self.create_course_summary(c) for c in courses]
    
    def get_statistics(self) -> Dict:
        """Get statistics about the loaded data"""
        if not self.courses:
            return {"error": "No courses loaded"}
        
        universities = {}
        categories = {}
        
        for course in self.courses.values():
            universities[course.university] = universities.get(course.university, 0) + 1
            categories[course.category] = categories.get(course.category, 0) + 1
        
        return {
            "total_courses": len(self.courses),
            "by_university": universities,
            "by_category": categories,
        }


# Convenience function
def load_courses(csv_path: str, source: str = "Houston", target: str = "Duke") -> Tuple[List[Course], List[Course]]:
    """
    Load courses and return (source_courses, target_courses) tuple

    Args:
        csv_path: Path to syllabus CSV
        source: Source university name (transferring from)
        target: Target university name (transferring to)
    """
    loader = CourseDataLoader(csv_path)
    loader.load()

    return loader.get_source_courses(source), loader.get_target_courses(target)
