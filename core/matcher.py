"""
Course Similarity Matching Engine for Course Co-Pilot
Uses OpenAI LLM to evaluate course equivalency with structured JSON output.
"""
import asyncio
import json
import re
import time
from typing import List, Optional, Dict, Any

import openai

from models.schemas import (
    Course, CourseSummary, SimilarityMatch, CourseMatchResult
)
from core.config import settings


# ------------------------------------------------------------------ #
#  LLM Scoring Prompt                                                  #
# ------------------------------------------------------------------ #

SCORING_SYSTEM_PROMPT = """\
You are an expert academic transfer credit evaluator. Your job is to assess \
how well a SOURCE course matches against a list of TARGET courses and produce \
a structured similarity evaluation.

Evaluate each target course against the source by considering:
1. Content overlap — do the courses cover the same core topics?
2. Learning outcomes — do students gain equivalent knowledge/skills?
3. Course level — are they both introductory, intermediate, or advanced?
4. Prerequisites — are prerequisite expectations comparable?
5. Credit hours — are the credit loads similar?

Return ONLY valid JSON with this exact structure:
{
  "matches": [
    {
      "target_index": 0,
      "similarity_score": 78,
      "topic_overlap": ["topic1", "topic2"],
      "key_differences": ["difference1"],
      "recommendation_rationale": "1-3 sentence explanation",
      "confidence_level": "high"
    }
  ]
}

Rules:
- similarity_score is an integer 0-100
- confidence_level is one of: "low", "medium", "high"
- Return matches sorted by similarity_score descending
- Only include targets with similarity_score >= 25
- topic_overlap: list of specific shared topics (not vague words)
- key_differences: list of concrete differences
- recommendation_rationale: clear explanation a professor can read
- Be rigorous but fair — do not inflate or deflate scores
"""


def _format_course_for_prompt(course: Course, label: str = "") -> str:
    """Format a Course into a readable text block for the LLM prompt."""
    parts = [f"**{label}**" if label else ""]
    parts.append(f"Title: {course.course_title}")
    parts.append(f"University: {course.university}")
    if course.category:
        parts.append(f"Department: {course.category}")
    if course.course_code:
        parts.append(f"Code: {course.course_code}")
    if course.course_description:
        parts.append(f"Description: {course.course_description[:600]}")
    if course.knowledge_points:
        parts.append(f"Key Topics: {course.knowledge_points[:400]}")
    if course.prerequisites:
        parts.append(f"Prerequisites: {course.prerequisites[:200]}")
    if course.credit_hours:
        parts.append(f"Credits: {course.credit_hours}")
    return "\n".join(p for p in parts if p)


def _course_to_summary(course: Course) -> CourseSummary:
    """Convert a Course to a CourseSummary for API responses."""
    topics = []
    if course.knowledge_points:
        topics = [t.strip() for t in re.split(r'[;,]', course.knowledge_points) if t.strip() and len(t.strip()) > 2]

    level = None
    text = f"{course.course_title} {course.course_code or ''}".lower()
    if re.search(r"(intro|introduction|fundamental|basic|survey|1\d{3})", text):
        level = "introductory"
    elif re.search(r"(intermediate|2\d{3})", text):
        level = "intermediate"
    elif re.search(r"(advanced|senior|3\d{3}|4\d{3})", text):
        level = "advanced"
    elif re.search(r"(graduate|seminar|[56]\d{3})", text):
        level = "graduate"

    missing_fields = []
    if not course.course_description:
        missing_fields.append("course_description")
    if not course.knowledge_points:
        missing_fields.append("learning_outcomes")
    if not course.prerequisites:
        missing_fields.append("prerequisites")

    return CourseSummary(
        course_id=course.file_name,
        course_title=course.course_title,
        university=course.university,
        category=course.category,
        course_code=course.course_code or "",
        main_topics=topics[:10],
        learning_outcomes=[],
        key_concepts=topics[10:20] if len(topics) > 10 else [],
        course_level=level,
        prerequisites=course.prerequisites or "",
        summary_text=course.course_description or "",
        source_link=getattr(course, 'source_link', None),
        missing_fields=missing_fields,
    )


def _parse_llm_json(text: str) -> Any:
    """Parse JSON from an LLM response, handling markdown fences."""
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return None


# ------------------------------------------------------------------ #
#  LLM-based Matcher                                                   #
# ------------------------------------------------------------------ #

class SimilarityMatcher:
    """
    Matches source courses against target university courses using an LLM
    for nuanced, context-aware scoring.
    """

    BATCH_SIZE = 15  # max targets per LLM call to stay within token limits

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        api_key = (openai_client.api_key if openai_client else None) or settings.openai_api_key
        if api_key:
            self.async_client = openai.AsyncOpenAI(api_key=api_key)
        else:
            self.async_client = None
        self.model = settings.scoring_model
        self.top_n = settings.top_n_matches

    async def find_matches(
        self,
        source_course: Course,
        target_courses: List[Course],
    ) -> CourseMatchResult:
        """Score a source course against all targets via LLM."""
        source_summary = _course_to_summary(source_course)

        if not self.async_client:
            return CourseMatchResult(
                source_course=source_summary,
                top_matches=[],
                best_match_found=False,
                evaluation_notes="OpenAI API key not configured — cannot score.",
                missing_info_warning=None,
            )

        if not target_courses:
            return CourseMatchResult(
                source_course=source_summary,
                top_matches=[],
                best_match_found=False,
                evaluation_notes="No target courses to match against.",
            )

        try:
            all_matches: List[SimilarityMatch] = []

            # Process targets in batches to respect token limits
            for batch_start in range(0, len(target_courses), self.BATCH_SIZE):
                batch = target_courses[batch_start:batch_start + self.BATCH_SIZE]
                batch_matches = await self._score_batch(
                    source_course, batch, batch_start
                )
                all_matches.extend(batch_matches)

            # Sort and take top N
            all_matches.sort(key=lambda m: m.similarity_score, reverse=True)
            top_matches = all_matches[:self.top_n]

            # Build evaluation notes
            if top_matches:
                best_score = top_matches[0].similarity_score
                if best_score >= 0.80:
                    eval_notes = f"Excellent match found ({int(best_score * 100)}%). High confidence in equivalency."
                elif best_score >= 0.60:
                    eval_notes = f"Good match found ({int(best_score * 100)}%). Review recommended."
                elif best_score >= 0.40:
                    eval_notes = f"Partial match ({int(best_score * 100)}%). May qualify as elective credit."
                else:
                    eval_notes = f"Limited similarity ({int(best_score * 100)}%). Not recommended for direct equivalency."
                best_match_found = True
            else:
                eval_notes = "No suitable matches found in target catalog."
                best_match_found = False

            missing_warning = None
            if source_summary.missing_fields:
                missing_list = [f.replace('_', ' ') for f in source_summary.missing_fields]
                missing_warning = f"Note: Missing source data ({', '.join(missing_list)}) may affect accuracy."

            return CourseMatchResult(
                source_course=source_summary,
                top_matches=top_matches,
                best_match_found=best_match_found,
                evaluation_notes=eval_notes,
                missing_info_warning=missing_warning,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return CourseMatchResult(
                source_course=source_summary,
                top_matches=[],
                best_match_found=False,
                evaluation_notes=f"LLM scoring error: {str(e)}",
            )

    async def _score_batch(
        self,
        source_course: Course,
        target_batch: List[Course],
        global_offset: int,
    ) -> List[SimilarityMatch]:
        """Send one batch of targets to the LLM and parse results."""
        source_block = _format_course_for_prompt(source_course, "SOURCE COURSE")

        target_blocks = []
        for i, tc in enumerate(target_batch):
            target_blocks.append(
                _format_course_for_prompt(tc, f"TARGET #{i}")
            )

        user_prompt = (
            f"{source_block}\n\n"
            f"--- TARGET COURSES ---\n\n"
            + "\n\n".join(target_blocks)
            + f"\n\nEvaluate how well each target matches the source course. "
            f"Return the top matches as JSON."
        )

        response = await self.async_client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SCORING_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or ""
        parsed = _parse_llm_json(raw)

        if not parsed or "matches" not in parsed:
            return []

        results = []
        for m in parsed["matches"]:
            idx = m.get("target_index", -1)
            if idx < 0 or idx >= len(target_batch):
                continue

            score = max(0, min(100, int(m.get("similarity_score", 0))))
            target_summary = _course_to_summary(target_batch[idx])

            results.append(SimilarityMatch(
                target_course=target_summary,
                similarity_score=score / 100.0,
                similarity_percentage=score,
                topic_overlap=m.get("topic_overlap", []),
                learning_outcome_alignment=[],
                key_differences=m.get("key_differences", []),
                recommendation_rationale=m.get("recommendation_rationale", ""),
                confidence_level=m.get("confidence_level", "medium"),
            ))

        return results

    async def batch_match(
        self,
        source_courses: List[Course],
        target_courses: List[Course],
    ) -> List[CourseMatchResult]:
        """Match multiple source courses against target catalog."""
        print(f"LLM scoring: {len(source_courses)} source courses against "
              f"{len(target_courses)} targets using {self.model}...")

        results = []
        for i, source in enumerate(source_courses, 1):
            print(f"  [{i}/{len(source_courses)}] Scoring: {source.course_title[:50]}...")
            result = await self.find_matches(source, target_courses)
            results.append(result)

        return results


# ------------------------------------------------------------------ #
#  High-level Engine (unchanged interface)                             #
# ------------------------------------------------------------------ #

class SimilarityEngine:
    """High-level interface for the Course Co-Pilot similarity system."""

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        self.matcher = SimilarityMatcher(openai_client)

    async def evaluate_transfer(
        self,
        source_courses: List[Course],
        target_courses: List[Course],
    ) -> Dict[str, Any]:
        """Complete transfer credit evaluation."""
        start_time = time.time()

        results = await self.matcher.batch_match(source_courses, target_courses)

        processing_time = time.time() - start_time

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
        """Evaluate a single course transfer."""
        return await self.matcher.find_matches(source_course, target_courses)


async def find_course_matches(
    source_course: Course,
    target_courses: List[Course],
) -> CourseMatchResult:
    """Convenience function: find matches for a single transfer course."""
    engine = SimilarityEngine()
    return await engine.evaluate_single_course(source_course, target_courses)
