"""
Course Similarity Matching Engine for Course Co-Pilot
Uses local ML models - NO external API calls
"""
from typing import List, Optional, Dict, Any
import time
import sys
import os

# Add parent directory to path to import local_matcher
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.schemas import (
    Course, CourseSummary, SimilarityMatch, CourseMatchResult
)
from local_matcher import LocalCourseMatcher, MatchScore
from core.config import settings


class SimilarityMatcher:
    """
    Matches source courses against target university courses
    using local ML models (sentence-transformers + TF-IDF + rule-based)
    """

    def __init__(self):
        self.matcher = LocalCourseMatcher(
            model_name=settings.embedding_model,
            semantic_weight=settings.semantic_weight,
            keyword_weight=settings.keyword_weight,
            knowledge_points_weight=settings.knowledge_points_weight,
            structural_weight=settings.structural_weight,
        )
        self.top_n = settings.top_n_matches

    def _course_to_summary(self, course: Course, score: Optional[MatchScore] = None) -> CourseSummary:
        """Convert Course to CourseSummary format"""
        # Extract topics if available
        topics = []
        if course.knowledge_points:
            topics = self.matcher._extract_topics(course.knowledge_points)
        elif course.course_description:
            topics = self.matcher._extract_topics(course.course_description)

        # Detect course level
        course_level = self.matcher._detect_course_level(course)

        # Determine missing fields
        missing_fields = []
        if not course.course_description:
            missing_fields.append("course_description")
        if not course.knowledge_points:
            missing_fields.append("learning_outcomes")
        if not course.prerequisites:
            missing_fields.append("prerequisites")
        if not course.textbooks_materials:
            missing_fields.append("textbooks")

        return CourseSummary(
            course_id=course.file_name,
            course_title=course.course_title,
            university=course.university,
            category=course.category,
            course_code=course.course_code or "",
            main_topics=topics[:10] if topics else [],
            learning_outcomes=[],  # Not used in local matcher
            key_concepts=topics[10:20] if len(topics) > 10 else [],
            course_level=course_level,
            prerequisites=course.prerequisites or "",
            summary_text=course.course_description or "",
            missing_fields=missing_fields,
        )

    async def find_matches(
        self,
        source_course: Course,
        target_courses: List[Course],
    ) -> CourseMatchResult:
        """
        Find the top matching courses from target university for a source course

        Args:
            source_course: The course being transferred
            target_courses: List of target university courses to compare against

        Returns:
            CourseMatchResult with top N matches and explanations
        """

        try:
            # Use local matcher to find matches
            matches_data = self.matcher.find_matches(
                source_course,
                target_courses,
                top_n=self.top_n,
                min_score=settings.similarity_threshold,
            )

            # Convert source to summary
            source_summary = self._course_to_summary(source_course)

            # Convert matches to SimilarityMatch format
            matches = []
            for match_data in matches_data:
                target_course = match_data["target_course"]
                score = match_data["score"]

                # Convert target to summary
                target_summary = self._course_to_summary(target_course, score)

                # Create similarity match
                matches.append(SimilarityMatch(
                    target_course=target_summary,
                    similarity_score=score.final_score,
                    similarity_percentage=int(score.final_score * 100),
                    topic_overlap=score.topic_overlap,
                    learning_outcome_alignment=[],  # Not used in local matcher
                    key_differences=score.key_differences,
                    recommendation_rationale=score.rationale,
                    confidence_level=score.confidence,
                ))

            # Generate evaluation notes
            if matches:
                best_score = matches[0].similarity_score
                if best_score >= 0.8:
                    eval_notes = f"Strong match found with {int(best_score * 100)}% similarity. High confidence in equivalency."
                elif best_score >= 0.6:
                    eval_notes = f"Moderate matches found. Review recommended for partial credit consideration."
                else:
                    eval_notes = f"Limited similarity detected. May not qualify for direct equivalency."
                best_match_found = True
            else:
                eval_notes = "No suitable matches found in target catalog."
                best_match_found = False

            # Generate missing info warning
            missing_warning = None
            if source_summary.missing_fields:
                missing_list = [f.replace('_', ' ') for f in source_summary.missing_fields]
                missing_warning = f"Note: Missing information for source course: {', '.join(missing_list)}. Results may be less accurate."

            return CourseMatchResult(
                source_course=source_summary,
                top_matches=matches,
                best_match_found=best_match_found,
                evaluation_notes=eval_notes,
                missing_info_warning=missing_warning,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()

            source_summary = self._course_to_summary(source_course)
            return CourseMatchResult(
                source_course=source_summary,
                top_matches=[],
                best_match_found=False,
                evaluation_notes=f"Error during matching: {str(e)}",
                missing_info_warning=None,
            )

    async def batch_match(
        self,
        source_courses: List[Course],
        target_courses: List[Course],
    ) -> List[CourseMatchResult]:
        """
        Match multiple source courses against target catalog

        Args:
            source_courses: List of courses to transfer
            target_courses: Target university course catalog

        Returns:
            List of CourseMatchResult for each source course
        """

        print(f"Matching {len(source_courses)} source courses against {len(target_courses)} target courses...")

        results = []
        for i, source in enumerate(source_courses, 1):
            print(f"  [{i}/{len(source_courses)}] Processing: {source.course_title[:45]}...")
            result = await self.find_matches(source, target_courses)
            results.append(result)

        return results


class SimilarityEngine:
    """
    High-level interface for the Course Co-Pilot similarity system
    """

    def __init__(self):
        self.matcher = SimilarityMatcher()

    async def evaluate_transfer(
        self,
        source_courses: List[Course],
        target_courses: List[Course],
    ) -> Dict[str, Any]:
        """
        Complete transfer credit evaluation

        Args:
            source_courses: Courses from student's transcript (transferring from)
            target_courses: Target university catalog (transferring to)

        Returns:
            Complete evaluation results with matches and recommendations
        """
        start_time = time.time()

        results = await self.matcher.batch_match(source_courses, target_courses)

        processing_time = time.time() - start_time

        # Compile statistics
        total_with_matches = sum(1 for r in results if r.best_match_found)
        high_confidence = sum(
            1 for r in results
            if r.top_matches and r.top_matches[0].similarity_score >= 0.8
        )

        return {
            "results": results,
            "summary": {
                "total_courses_evaluated": len(source_courses),
                "courses_with_matches": total_with_matches,
                "high_confidence_matches": high_confidence,
                "processing_time_seconds": round(processing_time, 2),
            },
            "warnings": [
                r.missing_info_warning
                for r in results
                if r.missing_info_warning
            ],
        }

    async def evaluate_single_course(
        self,
        source_course: Course,
        target_courses: List[Course],
    ) -> CourseMatchResult:
        """Evaluate a single course transfer"""
        return await self.matcher.find_matches(source_course, target_courses)


# Convenience function
async def find_course_matches(
    source_course: Course,
    target_courses: List[Course],
) -> CourseMatchResult:
    """
    Find matching courses for a transfer course

    Args:
        source_course: Course being transferred
        target_courses: Target university courses to match against

    Returns:
        CourseMatchResult with top matches and explanations
    """
    engine = SimilarityEngine()
    return await engine.evaluate_single_course(source_course, target_courses)
