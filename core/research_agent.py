"""
Custom AI Web Research Agent for Course Co-Pilot.

Uses OpenAI function calling with custom web search and page scraping tools.
The agent autonomously decides what to search, which pages to read, and when
it has enough information to return structured course data.

No built-in search tools — we build our own agent loop.
"""
import asyncio
import json
import re
import time
from typing import Any, Callable, List, Optional

import openai
import requests
from bs4 import BeautifulSoup

from models.schemas import Course, TranscriptCourse
from core.config import settings

# Try to import duckduckgo-search; fall back to raw HTTP search if unavailable
try:
    from duckduckgo_search import DDGS
    _HAS_DDGS = True
except ImportError:
    _HAS_DDGS = False


# ============== Tool Definitions (OpenAI Function Calling) ==============

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": (
                "Search the web using DuckDuckGo. Returns a list of results "
                "with title, URL, and snippet for each. Use specific queries "
                "like 'Duke University COMPSCI 201 syllabus' for best results."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to execute",
                    }
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "scrape_webpage",
            "description": (
                "Fetch and read the text content of a specific webpage URL. "
                "Use this to read course catalog pages, syllabi, or department listings. "
                "Returns the extracted text content (truncated to ~5000 chars)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full URL to fetch and read",
                    }
                },
                "required": ["url"],
            },
        },
    },
]


# ============== Tool Implementations ==============

# Rate limiter for web searches
_last_search_time = 0.0


def _web_search(query: str, max_results: int = 5) -> str:
    """Execute a web search. Uses duckduckgo-search if available, else raw HTTP."""
    global _last_search_time

    # Rate limit: at least 1.5s between searches to avoid blocks
    elapsed = time.time() - _last_search_time
    if elapsed < 1.5:
        time.sleep(1.5 - elapsed)
    _last_search_time = time.time()

    if _HAS_DDGS:
        return _ddgs_search(query, max_results)
    return _fallback_search(query, max_results)


def _ddgs_search(query: str, max_results: int = 5) -> str:
    """Search via duckduckgo-search package."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return json.dumps({"results": [], "note": "No results found."})
        return json.dumps([
            {"title": r.get("title", ""), "url": r.get("href", ""), "snippet": r.get("body", "")}
            for r in results
        ])
    except Exception as e:
        # Try fallback on DDGS failure
        try:
            return _fallback_search(query, max_results)
        except Exception:
            return json.dumps({"error": str(e), "results": []})


def _fallback_search(query: str, max_results: int = 5) -> str:
    """Fallback: search via DuckDuckGo HTML endpoint with raw HTTP."""
    try:
        resp = requests.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"},
            timeout=10,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        results = []
        for r in soup.select(".result__body"):
            title_el = r.select_one(".result__a")
            snippet_el = r.select_one(".result__snippet")
            url = title_el.get("href", "") if title_el else ""
            results.append({
                "title": title_el.get_text(strip=True) if title_el else "",
                "url": url,
                "snippet": snippet_el.get_text(strip=True) if snippet_el else "",
            })
            if len(results) >= max_results:
                break
        return json.dumps(results if results else [{"note": "No results found"}])
    except Exception as e:
        return json.dumps({"error": str(e), "results": []})


def _scrape_webpage(url: str) -> str:
    """Fetch and extract text content from a webpage."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        resp = requests.get(url, timeout=10, headers=headers, allow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Remove non-content elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        # Truncate to keep token usage reasonable
        if len(text) > 5000:
            text = text[:5000] + "\n\n[... truncated]"
        return text if text else "Page loaded but no text content found."
    except Exception as e:
        return f"Error fetching {url}: {e}"


# ============== Agent Loop ==============

class WebSearchAgent:
    """
    Runs an OpenAI function-calling agent loop with web search + scraping tools.
    The model autonomously decides what to search, which pages to read,
    and when it has enough info to return a final answer.
    """

    MAX_ITERATIONS = 8  # Max tool-calling rounds before forcing a response

    def __init__(self, async_client: openai.AsyncOpenAI):
        self.client = async_client
        self.model = settings.research_model

    async def run(
        self,
        system_prompt: str,
        user_prompt: str,
        step: Optional[Callable] = None,
    ) -> str:
        """
        Run the agent loop. Returns the final text response from the model.

        Args:
            system_prompt: System instructions for the agent
            user_prompt: The specific task/query
            step: Optional async callback for progress updates
        """
        _step = step or (lambda msg: asyncio.sleep(0))
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        for iteration in range(self.MAX_ITERATIONS):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=AGENT_TOOLS,
                    temperature=0.1,
                )
            except openai.RateLimitError:
                wait = (2 ** iteration) * 2
                await _step(f"Rate limited — waiting {wait}s")
                await asyncio.sleep(wait)
                continue

            message = response.choices[0].message

            # If no tool calls, the model is done — return its response
            if not message.tool_calls:
                return message.content or ""

            # Process each tool call
            messages.append(message)
            for tool_call in message.tool_calls:
                fn_name = tool_call.function.name
                try:
                    fn_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    fn_args = {}

                if fn_name == "web_search":
                    query = fn_args.get("query", "")
                    await _step(f"Searching: {query[:70]}")
                    result = await asyncio.to_thread(_web_search, query)
                elif fn_name == "scrape_webpage":
                    url = fn_args.get("url", "")
                    await _step(f"Reading: {url[:70]}")
                    result = await asyncio.to_thread(_scrape_webpage, url)
                else:
                    result = f"Unknown tool: {fn_name}"

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })

        # Exhausted iterations — ask the model to wrap up
        messages.append({
            "role": "user",
            "content": "You've used all available tool calls. Return your best answer now as JSON based on what you've found so far.",
        })
        try:
            final = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.1,
            )
            return final.choices[0].message.content or ""
        except Exception:
            return ""


# ============== Prompts ==============

SOURCE_SYSTEM_PROMPT = """\
You are a university course research agent. Your job is to find detailed \
information about a specific course at a specific university.

You have two tools:
- web_search: Search the web for information
- scrape_webpage: Read the content of a specific URL

Strategy:
1. Search for the course's official catalog page or syllabus
2. If results look promising, scrape the most relevant URL to get details
3. Extract structured information

Be efficient — use 1-3 searches max. Only scrape pages likely to have course details.

When done, return ONLY valid JSON with these fields:
{
  "course_description": "2-3 sentence description of the course content and goals",
  "knowledge_points": "semicolon-separated list of key topics (e.g. machine learning; statistics; python)",
  "prerequisites": "prerequisite courses or knowledge, or null if not found",
  "credit_hours": null or integer number of credits,
  "category": "academic department or field (e.g. Computer Science, Mathematics, Biology)"
}

If you can't find certain information, use null for that field. Always return valid JSON."""

TARGET_SYSTEM_PROMPT = """\
You are a university course research agent. Your job is to find courses at a \
target university that are equivalent to a given source course.

You have two tools:
- web_search: Search the web for information
- scrape_webpage: Read the content of a specific URL

Strategy:
1. Search the target university's course catalog for courses in a similar field
2. Look for courses with similar topics and content to the source course
3. Scrape catalog pages to get course details

Do NOT include labs, recitations, seminars, or practicums — only lecture courses.
Be efficient — use 1-3 searches max.

When done, return ONLY valid JSON as a list of up to 5 equivalent courses:
[
  {
    "course_code": "DEPT 123",
    "course_title": "Course Name",
    "course_description": "2-3 sentence description",
    "knowledge_points": "semicolon-separated key topics",
    "prerequisites": "prerequisite courses or null",
    "credit_hours": null or integer,
    "category": "academic department"
  }
]

Return an empty list [] if no equivalent courses are found. Always return valid JSON."""


# ============== Course Research Agent ==============

class CourseResearchAgent:
    """
    AI-powered agent that uses OpenAI function calling + custom web search
    to find course syllabi and extract structured course data.
    """

    def __init__(self, openai_client: Optional[openai.OpenAI] = None):
        api_key = (openai_client.api_key if openai_client else None) or settings.openai_api_key
        self.async_client = openai.AsyncOpenAI(api_key=api_key)
        self.agent = WebSearchAgent(self.async_client)
        self._semaphore: Optional[asyncio.Semaphore] = None

    @property
    def semaphore(self) -> asyncio.Semaphore:
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.max_concurrent_research)
        return self._semaphore

    async def research_source_courses(
        self,
        courses: List[TranscriptCourse],
        university: str,
        progress_callback: Optional[Callable] = None,
    ) -> List[Course]:
        """Research multiple source courses concurrently."""
        tasks = []
        for i, course in enumerate(courses):
            tasks.append(
                self._research_with_semaphore(
                    course.course_name, course.course_code, university,
                    i, len(courses), progress_callback,
                )
            )
        results = await asyncio.gather(*tasks, return_exceptions=True)

        researched = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"  Research failed for {courses[i].course_code}: {result}")
                researched.append(self._transcript_to_minimal_course(courses[i], university))
            else:
                researched.append(result)
        return researched

    async def research_target_courses(
        self,
        source_courses: List[Course],
        target_university: str,
        progress_callback: Optional[Callable] = None,
    ) -> List[Course]:
        """
        For each source course, search for equivalent courses at the target university.
        Returns a flat deduplicated list of all target courses found.
        """
        all_target_courses = []
        seen_keys = set()

        tasks = []
        for i, source in enumerate(source_courses):
            tasks.append(
                self._find_target_equivalents_with_semaphore(
                    source, target_university, i, len(source_courses), progress_callback,
                )
            )
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"  Target search failed for {source_courses[i].course_title}: {result}")
                continue
            for course in result:
                key = f"{course.course_code}_{course.course_title}".lower()
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_target_courses.append(course)

        return all_target_courses

    # ---- Semaphore wrappers with progress reporting ----

    async def _research_with_semaphore(
        self, course_title: str, course_code: str, university: str,
        index: int, total: int, progress_callback: Optional[Callable],
    ) -> Course:
        async with self.semaphore:
            label = f"[{index+1}/{total}] {course_code} {course_title}".strip()

            async def step(msg):
                if progress_callback:
                    await progress_callback(index + 1, total, f"{label} — {msg}")

            result = await self.research_single_course(course_title, course_code, university, step)
            await asyncio.sleep(settings.research_delay_seconds)
            return result

    async def _find_target_equivalents_with_semaphore(
        self, source_course: Course, target_university: str,
        index: int, total: int, progress_callback: Optional[Callable],
    ) -> List[Course]:
        async with self.semaphore:
            raw_title = source_course.course_title or ""
            plain_name = re.sub(r"^[A-Z]{2,6}\s*\d{3,4}[A-Z]?\s*", "", raw_title).strip() or raw_title
            label = f"[{index+1}/{total}] {plain_name}"

            async def step(msg):
                if progress_callback:
                    await progress_callback(index + 1, total, f"{label} — {msg}")

            result = await self.find_target_equivalents(source_course, target_university, step)
            await asyncio.sleep(settings.research_delay_seconds)
            return result

    # ---- Core research methods ----

    async def research_single_course(
        self, course_title: str, course_code: str, university: str,
        step: Optional[Callable] = None,
    ) -> Course:
        """Use the agent to search the web and extract course information."""
        _step = step or (lambda msg: asyncio.sleep(0))
        await _step("Starting web research")

        user_prompt = (
            f"Find information about this course:\n"
            f"Course code: {course_code}\n"
            f"Course name: {course_title}\n"
            f"University: {university}\n\n"
            f"Search for its official catalog page or syllabus and extract the course details."
        )

        try:
            response_text = await self.agent.run(SOURCE_SYSTEM_PROMPT, user_prompt, step=_step)
            extracted = self._parse_json(response_text)
            await _step("Done")
        except Exception as e:
            print(f"  Research failed for {course_code} {course_title}: {e}")
            await _step("Research failed, using transcript data only")
            extracted = {}

        if not extracted:
            return Course(
                university=university,
                category="",
                file_name=f"RESEARCH_{university}_{course_code}",
                course_title=f"{course_code} {course_title}".strip(),
                course_code=course_code,
            )

        return Course(
            university=university,
            category=extracted.get("category", ""),
            file_name=f"RESEARCH_{university}_{course_code}",
            course_title=f"{course_code} {course_title}".strip(),
            course_code=course_code,
            course_description=extracted.get("course_description"),
            knowledge_points=extracted.get("knowledge_points"),
            prerequisites=extracted.get("prerequisites"),
            credit_hours=extracted.get("credit_hours"),
        )

    async def find_target_equivalents(
        self, source_course: Course, target_university: str,
        step: Optional[Callable] = None,
    ) -> List[Course]:
        """Use the agent to find equivalent courses at the target university."""
        _step = step or (lambda msg: asyncio.sleep(0))

        raw_title = source_course.course_title or ""
        plain_name = re.sub(r"^[A-Z]{2,6}\s*\d{3,4}[A-Z]?\s*", "", raw_title).strip() or raw_title

        await _step(f"Searching {target_university} catalog")

        user_prompt = (
            f"Find courses at {target_university} that are equivalent to this course:\n\n"
            f"Source course: {plain_name}\n"
            f"Source university: {source_course.university}\n"
            f"Description: {source_course.course_description or 'No description available'}\n\n"
            f"Search {target_university}'s course catalog for courses covering similar topics."
        )

        try:
            response_text = await self.agent.run(TARGET_SYSTEM_PROMPT, user_prompt, step=_step)
            courses_data = self._parse_json(response_text)
            if not isinstance(courses_data, list):
                courses_data = []
            await _step(f"Found {len(courses_data)} potential equivalents")
        except Exception as e:
            print(f"  Target search failed for {plain_name}: {e}")
            await _step("Search failed")
            return []

        # Convert to Course objects
        target_courses = []
        for item in courses_data[:5]:
            if not isinstance(item, dict):
                continue
            target_courses.append(Course(
                university=target_university,
                category=item.get("category", ""),
                file_name=f"RESEARCH_{target_university}_{item.get('course_code', 'UNK')}",
                course_title=f"{item.get('course_code', '')} {item.get('course_title', '')}".strip(),
                course_code=item.get("course_code", ""),
                course_description=item.get("course_description"),
                knowledge_points=item.get("knowledge_points"),
                prerequisites=item.get("prerequisites"),
                credit_hours=item.get("credit_hours"),
            ))

        return target_courses

    # ---- Helpers ----

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

    def _transcript_to_minimal_course(self, tc: TranscriptCourse, university: str) -> Course:
        """Create a minimal Course from transcript data when research fails."""
        return Course(
            university=university,
            category="",
            file_name=f"TRANSCRIPT_{university}_{tc.course_code}",
            course_title=f"{tc.course_code} {tc.course_name}".strip(),
            course_code=tc.course_code,
            credit_hours=int(tc.credits) if tc.credits else None,
        )
