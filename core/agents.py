"""
Multi-Agent System for Course Co-Pilot.

Five specialized agents coordinated by an Orchestrator:
  - ParserAgent:           Extracts courses from transcript PDFs
  - SourceResearcherAgent: Enriches source courses via web research
  - TargetDiscoveryAgent:  Finds equivalent courses at the target university
  - EvaluationAgent:       Scores source-target course pairs with LLM
  - OrchestratorAgent:     Coordinates all agents, handles re-research loops
"""
import asyncio
import json
import re
from typing import Any, Callable, Dict, List, Optional, Tuple

import openai

from models.schemas import (
    Course, CourseMatchResult, CourseRecommendation,
    SimilarityMatch, TranscriptCourse, TranscriptParseResult,
)
from core.config import settings
from core.research_agent import (
    WebSearchAgent, SOURCE_SYSTEM_PROMPT, TARGET_SYSTEM_PROMPT,
)
from core.matcher import SimilarityMatcher, _course_to_summary
from utils.transcript_parser import TranscriptParser


# ------------------------------------------------------------------ #
#  Base Agent                                                          #
# ------------------------------------------------------------------ #

class BaseAgent:
    """Shared infrastructure for all agents."""

    name: str = "base"

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        api_key = (openai_client.api_key if openai_client else None) or settings.openai_api_key
        self.async_client = openai.AsyncOpenAI(api_key=api_key) if api_key else None
        self._openai_client = openai_client

    def _parse_json(self, text: str) -> Any:
        """Parse JSON from LLM response, handling markdown code blocks."""
        if not text:
            return None
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"[\[{].*[}\]]", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except json.JSONDecodeError:
                    pass
            return None


# ------------------------------------------------------------------ #
#  Parser Agent                                                        #
# ------------------------------------------------------------------ #

class ParserAgent(BaseAgent):
    """Extracts courses from transcript PDFs using GPT-4o vision."""

    name = "parser_agent"

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        super().__init__(openai_client)
        self._parser = TranscriptParser(openai_client)

    async def run(
        self,
        pdf_bytes: bytes,
        step: Optional[Callable] = None,
    ) -> TranscriptParseResult:
        _step = step or (lambda msg: asyncio.sleep(0))
        await _step("Analyzing transcript pages with vision model...")
        result = await asyncio.to_thread(self._parser.parse, pdf_bytes)
        await _step(f"Extracted {len(result.courses)} courses from {result.source_university}")
        return result


# ------------------------------------------------------------------ #
#  Source Researcher Agent                                             #
# ------------------------------------------------------------------ #

class SourceResearcherAgent(BaseAgent):
    """Enriches source courses by autonomously searching the web."""

    name = "source_researcher"

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        super().__init__(openai_client)
        self._web_agent = WebSearchAgent(self.async_client) if self.async_client else None
        self._semaphore: Optional[asyncio.Semaphore] = None

    @property
    def semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.max_concurrent_research)
        return self._semaphore

    async def run(
        self,
        courses: List[TranscriptCourse],
        university: str,
        step: Optional[Callable] = None,
    ) -> List[Course]:
        """Research all source courses concurrently."""
        _step = step or (lambda msg: asyncio.sleep(0))
        tasks = [
            self._research_one(c, university, i, len(courses), _step)
            for i, c in enumerate(courses)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        researched = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"  [{self.name}] Research failed for {courses[i].course_code}: {result}")
                researched.append(self._minimal_course(courses[i], university))
            else:
                researched.append(result)
        return researched

    async def research_single(
        self,
        course_title: str,
        course_code: str,
        university: str,
        step: Optional[Callable] = None,
    ) -> Course:
        """Deep-research a single course (used for re-research)."""
        _step = step or (lambda msg: asyncio.sleep(0))
        return await self._do_research(course_title, course_code, university, _step)

    async def _research_one(
        self, tc: TranscriptCourse, university: str,
        idx: int, total: int, step: Callable,
    ) -> Course:
        async with self.semaphore:
            label = f"[{idx+1}/{total}] {tc.course_code} {tc.course_name}".strip()

            async def _step(msg):
                await step(f"{label} — {msg}")

            result = await self._do_research(tc.course_name, tc.course_code, university, _step)
            await asyncio.sleep(settings.research_delay_seconds)
            return result

    async def _do_research(
        self, title: str, code: str, university: str, step: Callable,
    ) -> Course:
        await step("Starting web research")
        user_prompt = (
            f"Find information about this course:\n"
            f"Course code: {code}\nCourse name: {title}\nUniversity: {university}\n\n"
            f"Search for its official catalog page or syllabus and extract the course details."
        )
        try:
            response_text = await self._web_agent.run(SOURCE_SYSTEM_PROMPT, user_prompt, step=step)
            extracted = self._parse_json(response_text) or {}
            await step("Done")
        except Exception as e:
            print(f"  [{self.name}] Research failed for {code} {title}: {e}")
            await step("Research failed — using transcript data only")
            extracted = {}

        if not extracted:
            return Course(
                university=university, category="",
                file_name=f"RESEARCH_{university}_{code}",
                course_title=f"{code} {title}".strip(), course_code=code,
            )

        return Course(
            university=university,
            category=extracted.get("category", ""),
            file_name=f"RESEARCH_{university}_{code}",
            course_title=f"{code} {title}".strip(),
            course_code=code,
            course_description=extracted.get("course_description"),
            knowledge_points=extracted.get("knowledge_points"),
            prerequisites=extracted.get("prerequisites"),
            credit_hours=extracted.get("credit_hours"),
            source_link=extracted.get("source_url"),
        )

    def _minimal_course(self, tc: TranscriptCourse, university: str) -> Course:
        return Course(
            university=university, category="",
            file_name=f"TRANSCRIPT_{university}_{tc.course_code}",
            course_title=f"{tc.course_code} {tc.course_name}".strip(),
            course_code=tc.course_code,
            credit_hours=int(tc.credits) if tc.credits else None,
        )


# ------------------------------------------------------------------ #
#  Target Discovery Agent                                              #
# ------------------------------------------------------------------ #

class TargetDiscoveryAgent(BaseAgent):
    """Finds equivalent courses at the target university via web research."""

    name = "target_discoverer"

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        super().__init__(openai_client)
        self._web_agent = WebSearchAgent(self.async_client) if self.async_client else None
        self._semaphore: Optional[asyncio.Semaphore] = None

    @property
    def semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.max_concurrent_research)
        return self._semaphore

    async def run(
        self,
        source_courses: List[Course],
        target_university: str,
        step: Optional[Callable] = None,
    ) -> List[Course]:
        """Find target equivalents for all source courses, deduplicated."""
        _step = step or (lambda msg: asyncio.sleep(0))
        tasks = [
            self._discover_one(sc, target_university, i, len(source_courses), _step)
            for i, sc in enumerate(source_courses)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_targets = []
        seen = set()
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"  [{self.name}] Target search failed for {source_courses[i].course_title}: {result}")
                continue
            for course in result:
                key = f"{course.course_code}_{course.course_title}".lower()
                if key not in seen:
                    seen.add(key)
                    all_targets.append(course)
        return all_targets

    async def _discover_one(
        self, source: Course, target_uni: str,
        idx: int, total: int, step: Callable,
    ) -> List[Course]:
        async with self.semaphore:
            raw_title = source.course_title or ""
            plain_name = re.sub(r"^[A-Z]{2,6}\s*\d{3,4}[A-Z]?\s*", "", raw_title).strip() or raw_title
            label = f"[{idx+1}/{total}] {plain_name}"

            async def _step(msg):
                await step(f"{label} — {msg}")

            await _step(f"Searching {target_uni} catalog")
            user_prompt = (
                f"Find courses at {target_uni} that are equivalent to this course:\n\n"
                f"Source course: {plain_name}\n"
                f"Source university: {source.university}\n"
                f"Description: {source.course_description or 'No description available'}\n\n"
                f"Search {target_uni}'s course catalog for courses covering similar topics."
            )

            try:
                response_text = await self._web_agent.run(TARGET_SYSTEM_PROMPT, user_prompt, step=_step)
                courses_data = self._parse_json(response_text)
                if not isinstance(courses_data, list):
                    courses_data = []
                await _step(f"Found {len(courses_data)} potential equivalents")
            except Exception as e:
                print(f"  [{self.name}] Search failed for {plain_name}: {e}")
                await _step("Search failed")
                return []

            await asyncio.sleep(settings.research_delay_seconds)

            target_courses = []
            for item in courses_data[:5]:
                if not isinstance(item, dict):
                    continue
                target_courses.append(Course(
                    university=target_uni,
                    category=item.get("category", ""),
                    file_name=f"RESEARCH_{target_uni}_{item.get('course_code', 'UNK')}",
                    course_title=f"{item.get('course_code', '')} {item.get('course_title', '')}".strip(),
                    course_code=item.get("course_code", ""),
                    course_description=item.get("course_description"),
                    knowledge_points=item.get("knowledge_points"),
                    prerequisites=item.get("prerequisites"),
                    credit_hours=item.get("credit_hours"),
                    source_link=item.get("source_url"),
                ))
            return target_courses


# ------------------------------------------------------------------ #
#  Evaluation Agent                                                    #
# ------------------------------------------------------------------ #

class EvaluationAgent(BaseAgent):
    """Scores source-target course pairs using LLM. Flags low-confidence results."""

    name = "evaluator"

    LOW_CONFIDENCE_THRESHOLD = 0.35

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        super().__init__(openai_client)
        self._matcher = SimilarityMatcher(openai_client)

    async def run(
        self,
        source_courses: List[Course],
        target_courses: List[Course],
        step: Optional[Callable] = None,
    ) -> Tuple[List[CourseMatchResult], List[int]]:
        """
        Score all source courses against targets.
        Returns (results, indices_needing_reresearch).
        """
        _step = step or (lambda msg: asyncio.sleep(0))
        results = []
        needs_reresearch: List[int] = []

        for i, source in enumerate(source_courses):
            await _step(f"[{i+1}/{len(source_courses)}] Scoring: {source.course_title[:50]}...")
            result = await self._matcher.find_matches(source, target_courses)
            results.append(result)

            if self._should_reresearch(result, source):
                needs_reresearch.append(i)

        return results, needs_reresearch

    async def re_evaluate_single(
        self,
        source_course: Course,
        target_courses: List[Course],
    ) -> CourseMatchResult:
        """Re-score a single source course after enrichment."""
        return await self._matcher.find_matches(source_course, target_courses)

    def _should_reresearch(self, result: CourseMatchResult, source: Course) -> bool:
        """Decide if this result warrants deeper research."""
        if not result.top_matches:
            has_description = bool(source.course_description)
            return not has_description

        best = result.top_matches[0].similarity_score
        if best < self.LOW_CONFIDENCE_THRESHOLD and not source.course_description:
            return True
        return False


# ------------------------------------------------------------------ #
#  Orchestrator Agent                                                  #
# ------------------------------------------------------------------ #

_SKIP_KEYWORDS = re.compile(
    r"\b(lab|laboratory|recitation|seminar|practicum|internship|"
    r"independent\s+study|thesis|dissertation|research\s+credit|"
    r"directed\s+study|field\s+experience|clinical|co-?op)\b",
    re.IGNORECASE,
)


class OrchestratorAgent(BaseAgent):
    """
    Coordinates all agents to complete a transfer credit evaluation.
    Handles the dynamic workflow including re-research feedback loops.
    """

    name = "orchestrator"

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        super().__init__(openai_client)
        self.parser = ParserAgent(openai_client)
        self.source_researcher = SourceResearcherAgent(openai_client)
        self.target_discoverer = TargetDiscoveryAgent(openai_client)
        self.evaluator = EvaluationAgent(openai_client)

    async def run_full_evaluation(
        self,
        pdf_bytes: bytes,
        target_university: str,
        progress_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        End-to-end multi-agent evaluation.
        Returns dict with parse_result, source_courses, target_courses,
        results (CourseMatchResult list), and recommendations.
        """
        report = self._make_reporter(progress_callback)

        # ---- Phase 1: Parser Agent ----
        await report("parser_agent", "parsing", 0, 1, "Parser Agent analyzing transcript...")
        parse_result = await self.parser.run(pdf_bytes, step=self._agent_step(report, "parser_agent", "parsing"))
        print(f"  [orchestrator] Parser Agent extracted {len(parse_result.courses)} courses")

        if not parse_result.courses:
            return {"parse_result": parse_result, "source_courses": [], "target_courses": [],
                    "results": [], "recommendations": []}

        evaluable = [c for c in parse_result.courses if not _SKIP_KEYWORDS.search(c.course_name or "")]
        print(f"  [orchestrator] Filtered to {len(evaluable)} evaluable courses")

        if not evaluable:
            return {"parse_result": parse_result, "source_courses": [], "target_courses": [],
                    "results": [], "recommendations": []}

        # ---- Phase 2: Source Researcher Agent ----
        await report("source_researcher", "researching_source", 0, len(evaluable),
                      f"Source Researcher enriching {len(evaluable)} courses...")
        source_courses = await self.source_researcher.run(
            evaluable, parse_result.source_university,
            step=self._agent_step(report, "source_researcher", "researching_source"),
        )
        print(f"  [orchestrator] Source Researcher enriched {len(source_courses)} courses")

        # ---- Phase 3: Target Discovery Agent ----
        await report("target_discoverer", "researching_target", 0, len(source_courses),
                      f"Target Discoverer searching {target_university} catalog...")
        target_courses = await self.target_discoverer.run(
            source_courses, target_university,
            step=self._agent_step(report, "target_discoverer", "researching_target"),
        )
        print(f"  [orchestrator] Target Discoverer found {len(target_courses)} courses at {target_university}")

        if not target_courses:
            return {"parse_result": parse_result, "source_courses": source_courses,
                    "target_courses": [], "results": [], "recommendations": []}

        # ---- Phase 4: Evaluation Agent ----
        await report("evaluator", "evaluating", 0, len(source_courses),
                      "Evaluation Agent scoring course matches...")
        results, needs_reresearch = await self.evaluator.run(
            source_courses, target_courses,
            step=self._agent_step(report, "evaluator", "evaluating"),
        )
        print(f"  [orchestrator] Evaluation Agent scored {len(results)} courses, "
              f"{len(needs_reresearch)} flagged for re-research")

        # ---- Phase 4b: Re-research feedback loop ----
        if needs_reresearch:
            await report("orchestrator", "re_researching", 0, len(needs_reresearch),
                          f"Orchestrator re-researching {len(needs_reresearch)} low-confidence courses...")
            for count, idx in enumerate(needs_reresearch):
                src = source_courses[idx]
                await report("source_researcher", "re_researching", count + 1, len(needs_reresearch),
                              f"Deep research: {src.course_title[:40]}...")
                enriched = await self.source_researcher.research_single(
                    src.course_title, src.course_code or "", src.university,
                    step=self._agent_step(report, "source_researcher", "re_researching"),
                )
                source_courses[idx] = enriched

                await report("evaluator", "re_researching", count + 1, len(needs_reresearch),
                              f"Re-scoring: {enriched.course_title[:40]}...")
                results[idx] = await self.evaluator.re_evaluate_single(enriched, target_courses)

            print(f"  [orchestrator] Re-research complete")

        # ---- Phase 5: Build recommendations ----
        await report("orchestrator", "finalizing", 0, 0, "Generating final recommendations...")
        recommendations = [self._make_recommendation(r) for r in results]

        return {
            "parse_result": parse_result,
            "source_courses": source_courses,
            "target_courses": target_courses,
            "results": results,
            "recommendations": recommendations,
        }

    # ---- Recommendation logic ----

    def _make_recommendation(self, result: CourseMatchResult) -> CourseRecommendation:
        if not result.top_matches:
            return CourseRecommendation(
                source_course=result.source_course,
                matches=[],
                recommendation="deny",
                confidence="low",
                rationale="No matching courses found in target catalog.",
            )

        best = result.top_matches[0]
        score = best.similarity_score

        if score >= 0.75:
            rec, conf = "approve", ("high" if score >= 0.85 else "medium")
            rationale = (f"Strong match ({int(score*100)}%) with {best.target_course.course_title}. "
                         f"{best.recommendation_rationale}")
        elif score >= 0.55:
            rec, conf = "review", "medium"
            rationale = (f"Moderate match ({int(score*100)}%) with {best.target_course.course_title}. "
                         f"Manual review recommended. {best.recommendation_rationale}")
        else:
            rec = "deny"
            conf = "medium" if score >= 0.40 else "high"
            rationale = (f"Low similarity ({int(score*100)}%) — no strong equivalent found. "
                         f"Best candidate: {best.target_course.course_title}.")

        return CourseRecommendation(
            source_course=result.source_course,
            matches=result.top_matches,
            recommendation=rec,
            confidence=conf,
            rationale=rationale,
        )

    # ---- Progress helpers ----

    def _make_reporter(self, callback: Optional[Callable]):
        async def report(agent: str, stage: str, current: int, total: int, message: str):
            if callback:
                await callback(agent, stage, current, total, message)
        return report

    def _agent_step(self, report, agent_name: str, stage: str):
        async def step(msg: str):
            await report(agent_name, stage, 0, 0, msg)
        return step
