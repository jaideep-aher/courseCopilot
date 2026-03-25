"""
Course Summarizer for Course Co-Pilot
Uses LLM to create standardized course summaries for comparison
"""
from typing import List, Optional
import json

from models.schemas import Course, CourseSummary
from core.llm_client import LLMClient, get_llm_client


SUMMARIZATION_SYSTEM_PROMPT = """You are an expert academic course analyst specializing in course equivalency evaluation. 
Your task is to analyze course information and create structured summaries that enable accurate comparison between courses.

Focus on extracting:
1. Main topics and subject areas covered
2. Learning outcomes and skills students will gain
3. Course level (introductory, intermediate, advanced)
4. Key concepts and terminology
5. Practical applications or labs if mentioned

Be precise and academic in your analysis. If information is missing, note it but don't fabricate details."""


class CourseSummarizer:
    """Generates standardized course summaries using LLM"""
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm = llm_client or get_llm_client()
    
    def _build_course_text(self, course: Course) -> str:
        """Build a text representation of course for LLM input"""
        parts = []
        
        parts.append(f"Course Title: {course.course_title}")
        parts.append(f"University: {course.university}")
        parts.append(f"Category/Department: {course.category}")
        
        if course.course_code:
            parts.append(f"Course Code: {course.course_code}")
        
        if course.course_description:
            parts.append(f"\nCourse Description:\n{course.course_description}")
        
        if course.knowledge_points:
            parts.append(f"\nTopics/Knowledge Points:\n{course.knowledge_points}")
        
        if course.prerequisites:
            parts.append(f"\nPrerequisites:\n{course.prerequisites}")
        
        if course.textbooks_materials:
            parts.append(f"\nTextbooks/Materials:\n{course.textbooks_materials}")
        
        if course.assignments_summary:
            parts.append(f"\nAssignments:\n{course.assignments_summary}")
        
        if course.weekly_schedule:
            parts.append(f"\nWeekly Schedule/Topics:\n{course.weekly_schedule}")
        
        return "\n".join(parts)
    
    async def summarize_course(self, course: Course) -> CourseSummary:
        """Generate a structured summary for a single course"""
        
        course_text = self._build_course_text(course)
        
        prompt = f"""Analyze this course and provide a structured summary in JSON format.

COURSE INFORMATION:
{course_text}

Respond with a JSON object containing:
{{
    "main_topics": ["list of 5-10 main topics covered"],
    "learning_outcomes": ["list of 3-5 key learning outcomes/skills"],
    "key_concepts": ["list of 5-8 important concepts/terms"],
    "course_level": "introductory|intermediate|advanced",
    "estimated_credits": 3,
    "summary_text": "2-3 sentence summary of what students learn",
    "subject_area": "primary academic discipline",
    "practical_components": "labs, projects, or hands-on work if any"
}}

Base your analysis ONLY on the provided information. If certain details are unclear, make reasonable inferences based on course title and available content."""

        try:
            result = await self.llm.generate_json(prompt, SUMMARIZATION_SYSTEM_PROMPT)
            
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
            
            return CourseSummary(
                course_id=course.file_name,
                course_title=course.course_title,
                university=course.university,
                category=course.category,
                main_topics=result.get("main_topics", []),
                learning_outcomes=result.get("learning_outcomes", []),
                key_concepts=result.get("key_concepts", []),
                course_level=result.get("course_level"),
                estimated_credits=result.get("estimated_credits"),
                summary_text=result.get("summary_text", ""),
                has_description=bool(course.course_description),
                has_learning_outcomes=bool(course.knowledge_points),
                has_prerequisites=bool(course.prerequisites),
                has_textbooks=bool(course.textbooks_materials),
                missing_fields=missing,
            )
            
        except Exception as e:
            # Return basic summary if LLM fails
            print(f"Warning: LLM summarization failed for {course.course_title}: {e}")
            return self._create_basic_summary(course)
    
    def _create_basic_summary(self, course: Course) -> CourseSummary:
        """Create a basic summary without LLM (fallback)"""
        topics = []
        if course.knowledge_points:
            topics = [t.strip() for t in course.knowledge_points.split(";") if t.strip()][:10]
        
        missing = []
        if not course.course_description:
            missing.append("course_description")
        if not course.knowledge_points:
            missing.append("learning_outcomes")
        if not course.prerequisites:
            missing.append("prerequisites")
        if not course.textbooks_materials:
            missing.append("textbooks")
        
        return CourseSummary(
            course_id=course.file_name,
            course_title=course.course_title,
            university=course.university,
            category=course.category,
            main_topics=topics,
            learning_outcomes=[],
            key_concepts=topics[:5],
            summary_text=course.course_description or "",
            has_description=bool(course.course_description),
            has_learning_outcomes=bool(course.knowledge_points),
            has_prerequisites=bool(course.prerequisites),
            has_textbooks=bool(course.textbooks_materials),
            missing_fields=missing,
        )
    
    async def summarize_courses(self, courses: List[Course]) -> List[CourseSummary]:
        """Summarize multiple courses"""
        summaries = []
        for course in courses:
            summary = await self.summarize_course(course)
            summaries.append(summary)
        return summaries


async def summarize_course(course: Course, llm_client: Optional[LLMClient] = None) -> CourseSummary:
    """Convenience function to summarize a single course"""
    summarizer = CourseSummarizer(llm_client)
    return await summarizer.summarize_course(course)
