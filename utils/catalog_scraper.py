#!/usr/bin/env python3
"""
University Course Catalog Scraper

Scalable architecture for automatically fetching course catalog data from any university.
Uses a provider-based pattern:
  - Each university catalog platform (Coursedog, Banner, PeopleSoft, etc.) gets a provider
  - Providers are auto-detected or manually specified
  - Output is a standardized CSV matching the matcher's expected format

Usage:
    python -m utils.catalog_scraper --university duke --output data/duke_catalog.csv
    python -m utils.catalog_scraper --university duke --subjects COMPSCI MATH --limit 50
"""
import csv
import json
import time
import re
import os
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


# ============== Data Model ==============

@dataclass
class CatalogCourse:
    """Standardized course data from any catalog source"""
    university: str
    category: str  # Department/subject
    file_name: str  # Unique ID
    course_title: str
    instructor_name: str = "N/A"
    instructor_email: str = "N/A"
    course_description_summary: str = ""
    knowledge_points: str = ""  # Semicolon-separated topics
    prerequisites: str = ""
    textbooks_materials: str = "N/A"
    grading_scale: str = "Standard"
    assignments_summary: str = "N/A"
    weekly_schedule_highlights: str = "N/A"
    data_source: str = ""
    source_link: str = ""


# ============== Provider Registry ==============

# Maps university identifiers to their catalog provider config
UNIVERSITY_REGISTRY: Dict[str, dict] = {
    "duke": {
        "provider": "coursedog",
        "institution_id": "duke_peoplesoft",
        "university_name": "Duke",
        "origin": "https://undergraduate.bulletins.duke.edu",
        "catalog_url": "https://undergraduate.bulletins.duke.edu/courses",
    },
    # Add more universities here as you discover their catalog platforms:
    # "unc": {
    #     "provider": "coursedog",
    #     "institution_id": "unc_peoplesoft",
    #     "university_name": "UNC",
    #     "origin": "https://catalog.unc.edu",
    # },
    # "stanford": {
    #     "provider": "explorecourses",
    #     "university_name": "Stanford",
    #     "api_url": "https://explorecourses.stanford.edu",
    # },
}


# ============== Base Provider ==============

class CatalogProvider(ABC):
    """Base class for university catalog providers"""

    @abstractmethod
    def get_subjects(self) -> List[Dict[str, str]]:
        """Return list of {"code": "COMPSCI", "name": "Computer Science"}"""
        pass

    @abstractmethod
    def get_courses(
        self,
        subjects: Optional[List[str]] = None,
        limit: Optional[int] = None,
    ) -> List[CatalogCourse]:
        """Fetch courses, optionally filtered by subject codes"""
        pass


# ============== Coursedog Provider ==============

class CoursedogProvider(CatalogProvider):
    """
    Provider for universities using Coursedog catalog platform.

    Coursedog is used by 700+ universities including Duke, UNC, Georgetown, etc.
    Their public catalog API is accessible with proper Origin headers.
    """

    API_BASE = "https://app.coursedog.com/api/v1/cm"
    BATCH_SIZE = 100  # Coursedog allows up to 500 per request

    def __init__(self, institution_id: str, university_name: str, origin: str, **kwargs):
        self.institution_id = institution_id
        self.university_name = university_name
        self.origin = origin
        self.catalog_url = kwargs.get("catalog_url", origin)

    def _api_url(self, path: str) -> str:
        return f"{self.API_BASE}/{self.institution_id}/{path}"

    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Origin": self.origin,
            "Referer": f"{self.origin}/",
        }

    def _post(self, path: str, body: dict = None, params: dict = None) -> dict:
        import urllib.request
        import urllib.parse

        url = self._api_url(path)
        if params:
            url += "?" + urllib.parse.urlencode(params)

        data = json.dumps(body or {}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers=self._headers(),
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def _get(self, path: str, params: dict = None) -> dict:
        import urllib.request
        import urllib.parse

        url = self._api_url(path)
        if params:
            url += "?" + urllib.parse.urlencode(params)

        req = urllib.request.Request(url, headers=self._headers())

        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def get_subjects(self) -> List[Dict[str, str]]:
        """Fetch all subject codes from the catalog"""
        # Use the Streamer API for subjects (works with public token for Duke)
        try:
            import urllib.request
            url = f"https://streamer.oit.duke.edu/curriculum/list_of_values/fieldname/subject?access_token=public"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                values = data["scc_lov_resp"]["lovs"]["lov"]["values"]["value"]
                return [{"code": v["code"], "name": v["desc"]} for v in values]
        except Exception:
            # Fallback: get subjects from Coursedog by fetching a small batch
            # and extracting unique subject codes
            result = self._post(
                "courses/search/%24filters",
                body={},
                params={"skip": 0, "limit": 1},
            )
            print(f"  Warning: Could not fetch subject list. Total courses: {result.get('listLength', '?')}")
            return []

    def get_courses(
        self,
        subjects: Optional[List[str]] = None,
        limit: Optional[int] = None,
    ) -> List[CatalogCourse]:
        """Fetch courses from Coursedog API"""
        courses = []

        if subjects:
            # Fetch per-subject
            for subj in subjects:
                subj_courses = self._fetch_subject_courses(subj, limit)
                courses.extend(subj_courses)
                if limit and len(courses) >= limit:
                    break
        else:
            # Fetch all courses
            courses = self._fetch_all_courses(limit)

        if limit:
            courses = courses[:limit]

        return courses

    def _fetch_subject_courses(self, subject_code: str, limit: Optional[int] = None) -> List[CatalogCourse]:
        """Fetch all courses for a subject code"""
        courses = []
        skip = 0
        batch_limit = min(self.BATCH_SIZE, limit) if limit else self.BATCH_SIZE

        while True:
            result = self._post(
                "courses/search/%24filters",
                body={},
                params={
                    "skip": skip,
                    "limit": batch_limit,
                    "subjectCode": subject_code,
                },
            )

            total = result.get("listLength", 0)
            batch = result.get("data", [])

            if not batch:
                break

            for raw in batch:
                course = self._parse_course(raw)
                if course:
                    courses.append(course)

            skip += len(batch)

            if skip >= total:
                break
            if limit and len(courses) >= limit:
                break

            time.sleep(0.1)  # Be polite

        return courses

    def _fetch_all_courses(self, limit: Optional[int] = None) -> List[CatalogCourse]:
        """Fetch all courses across all subjects"""
        courses = []
        skip = 0
        batch_limit = self.BATCH_SIZE

        # First request to get total
        result = self._post(
            "courses/search/%24filters",
            body={},
            params={"skip": 0, "limit": 1},
        )
        total = result.get("listLength", 0)
        effective_total = min(total, limit) if limit else total
        print(f"  Total courses in catalog: {total}")
        if limit:
            print(f"  Fetching up to: {limit}")

        while skip < effective_total:
            result = self._post(
                "courses/search/%24filters",
                body={},
                params={"skip": skip, "limit": batch_limit},
            )

            batch = result.get("data", [])
            if not batch:
                break

            for raw in batch:
                course = self._parse_course(raw)
                if course:
                    courses.append(course)

            skip += len(batch)
            print(f"  Fetched {skip}/{effective_total} courses...")

            if limit and len(courses) >= limit:
                break

            time.sleep(0.1)  # Be polite

        return courses[:limit] if limit else courses

    def _parse_course(self, raw: dict) -> Optional[CatalogCourse]:
        """Parse a Coursedog course JSON into standardized format"""
        name = raw.get("name") or raw.get("longName") or ""
        if not name:
            return None

        # Skip inactive/archived courses
        if raw.get("status") == "Inactive" or raw.get("archived"):
            return None

        code = raw.get("code", "")
        subject = raw.get("subjectCode", "")
        description = raw.get("description", "") or ""
        long_name = raw.get("longName") or name

        # Build course title
        course_title = f"{code}: {long_name}" if code else long_name

        # Extract prerequisites from structured fields first, then from description
        prereqs = raw.get("prerequisiteDescription") or raw.get("catalogPrerequisites") or ""
        if isinstance(prereqs, dict):
            prereqs = prereqs.get("description", "")
        if not prereqs:
            prereqs = self._extract_prereqs_from_description(description)

        # Extract instructor from description (e.g., "Instructor: Staff")
        instructor = self._extract_instructor_from_description(description)

        # Clean description: remove trailing "Instructor: ..." and "Prerequisite: ..."
        clean_desc = self._clean_description(description)

        # Extract department name
        departments = raw.get("departments", [])
        dept_name = subject
        if departments:
            if isinstance(departments[0], dict):
                dept_name = departments[0].get("displayName", subject)
            elif isinstance(departments[0], str):
                dept_name = departments[0]

        # Extract grading info
        grade_mode = raw.get("gradeMode", "")
        components = [c.get("name", "") for c in raw.get("components", []) if isinstance(c, dict)]
        credits_info = raw.get("credits", {})
        credit_hours = ""
        if isinstance(credits_info, dict):
            ch = credits_info.get("creditHours", {})
            if isinstance(ch, dict):
                mn, mx = ch.get("min"), ch.get("max")
                credit_hours = f"{mn}-{mx}" if mn != mx else str(mn or "")

        # Build grading scale string
        grading_parts = []
        if grade_mode:
            grading_parts.append(grade_mode)
        if credit_hours:
            grading_parts.append(f"{credit_hours} credit(s)")
        if components:
            grading_parts.append(f"Components: {', '.join(components)}")
        grading_scale = "; ".join(grading_parts) if grading_parts else "Standard"

        # Extract knowledge points from description
        knowledge_points = self._extract_knowledge_points(clean_desc, name, subject)

        # Build unique file_name
        course_id = raw.get("_id") or raw.get("id") or f"{self.university_name}_{code}"

        return CatalogCourse(
            university=self.university_name,
            category=dept_name,
            file_name=f"CATALOG_{course_id}",
            course_title=course_title,
            instructor_name=instructor,
            course_description_summary=clean_desc[:2000] if clean_desc else "",
            knowledge_points=knowledge_points,
            prerequisites=prereqs[:1000] if prereqs else "",
            grading_scale=grading_scale,
            data_source=f"Coursedog Catalog API ({self.institution_id})",
            source_link=f"{self.catalog_url}/{raw.get('courseGroupId', '')}",
        )

    def _extract_prereqs_from_description(self, description: str) -> str:
        """Extract prerequisite text embedded in course descriptions"""
        patterns = [
            r'[Pp]rerequisites?:\s*(.+?)(?:\.|Instructor:|$)',
            r'[Pp]rereqs?:\s*(.+?)(?:\.|Instructor:|$)',
            r'[Pp]rerequisites?[—–-]\s*(.+?)(?:\.|Instructor:|$)',
        ]
        for pattern in patterns:
            match = re.search(pattern, description)
            if match:
                return match.group(1).strip().rstrip(".")
        return ""

    def _extract_instructor_from_description(self, description: str) -> str:
        """Extract instructor name from description (e.g., 'Instructor: Smith')"""
        # Handles: "Instructor: Staff", "Instructors: Forbes", "Instructors. Biermann and staff"
        match = re.search(r'[Ii]nstructors?[:.]\s*(.+?)\s*$', description)
        if match:
            return match.group(1).strip().rstrip(".")
        return "N/A"

    def _clean_description(self, description: str) -> str:
        """Remove trailing Instructor/Prerequisite boilerplate from description"""
        if not description:
            return ""
        # Remove "Instructor(s): ..." or "Instructors. ..." at end
        desc = re.sub(r'\s*[Ii]nstructors?[:.]\s*.+?\s*$', '', description).strip()
        # Remove "Prerequisite: ..." sentences (keep the rest)
        desc = re.sub(r'\s*[Pp]rerequisites?:\s*[^.]+\.?', '', desc).strip()
        desc = re.sub(r'\s*[Pp]rereqs?:\s*[^.]+\.?', '', desc).strip()
        return desc

    def _extract_knowledge_points(self, description: str, name: str, subject: str) -> str:
        """Extract topic keywords from course description and title"""
        if not description and not name:
            return subject

        text = f"{name} {description}".lower()

        # Common academic topic keywords to look for
        topic_patterns = [
            r'\b(machine learning|deep learning|artificial intelligence|neural network[s]?)\b',
            r'\b(data science|data analysis|data mining|big data)\b',
            r'\b(algorithm[s]?|data structure[s]?|programming|software engineering)\b',
            r'\b(calculus|linear algebra|statistics|probability|differential equations)\b',
            r'\b(organic chemistry|biochemistry|molecular biology|genetics)\b',
            r'\b(quantum mechanics|thermodynamics|electromagnetism)\b',
            r'\b(microeconomics|macroeconomics|econometrics|game theory)\b',
            r'\b(sociology|anthropology|psychology|political science)\b',
            r'\b(creative writing|composition|rhetoric|literature)\b',
            r'\b(ethics|philosophy|logic|epistemology)\b',
        ]

        found_topics = set()
        for pattern in topic_patterns:
            matches = re.findall(pattern, text)
            found_topics.update(matches)

        # Also extract key nouns from the title
        title_words = re.findall(r'\b[a-z]{4,}\b', name.lower())
        stopwords = {'course', 'intro', 'introduction', 'topics', 'special', 'selected',
                     'advanced', 'general', 'basic', 'study', 'studies'}
        title_topics = [w for w in title_words if w not in stopwords][:5]
        found_topics.update(title_topics)

        if not found_topics:
            return subject

        return "; ".join(sorted(found_topics))


# ============== Provider Factory ==============

PROVIDERS = {
    "coursedog": CoursedogProvider,
}


def get_provider(university_key: str) -> CatalogProvider:
    """Get the appropriate catalog provider for a university"""
    key = university_key.lower()

    if key not in UNIVERSITY_REGISTRY:
        available = ", ".join(sorted(UNIVERSITY_REGISTRY.keys()))
        raise ValueError(
            f"University '{university_key}' not in registry. "
            f"Available: {available}. "
            f"Add it to UNIVERSITY_REGISTRY in catalog_scraper.py"
        )

    config = UNIVERSITY_REGISTRY[key].copy()
    provider_name = config.pop("provider")

    if provider_name not in PROVIDERS:
        raise ValueError(f"Unknown provider '{provider_name}'. Available: {list(PROVIDERS.keys())}")

    provider_class = PROVIDERS[provider_name]
    return provider_class(**config)


# ============== CSV Export ==============

def export_to_csv(courses: List[CatalogCourse], output_path: str) -> str:
    """Export courses to CSV in the format expected by the matcher"""
    fieldnames = [
        "university", "category", "file_name", "course_title",
        "instructor_name", "instructor_email", "course_description_summary",
        "knowledge_points", "prerequisites", "textbooks_materials",
        "grading_scale", "assignments_summary", "weekly_schedule_highlights",
        "data_source", "source_link",
    ]

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for course in courses:
            writer.writerow(asdict(course))

    return output_path


def merge_with_existing(
    new_courses: List[CatalogCourse],
    existing_csv: str,
    output_csv: str,
    university_name: str,
) -> str:
    """
    Merge scraped catalog courses with the existing dataset.
    Replaces courses from the same university, keeps others.
    """
    existing_rows = []

    if os.path.exists(existing_csv):
        with open(existing_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Keep rows from OTHER universities
                if row.get("university", "").lower() != university_name.lower():
                    existing_rows.append(row)

    # Convert new courses to dicts
    new_rows = [asdict(c) for c in new_courses]

    all_rows = existing_rows + new_rows

    fieldnames = [
        "university", "category", "file_name", "course_title",
        "instructor_name", "instructor_email", "course_description_summary",
        "knowledge_points", "prerequisites", "textbooks_materials",
        "grading_scale", "assignments_summary", "weekly_schedule_highlights",
        "data_source", "source_link",
    ]

    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in all_rows:
            writer.writerow(row)

    return output_csv


# ============== CLI ==============

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="University Course Catalog Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape Duke's full catalog
  python -m utils.catalog_scraper --university duke --output data/duke_catalog.csv

  # Scrape specific subjects only
  python -m utils.catalog_scraper --university duke --subjects COMPSCI MATH ECE --limit 500

  # Merge scraped data with existing dataset
  python -m utils.catalog_scraper --university duke --merge data/syllabus_dataset.csv

  # List available subjects
  python -m utils.catalog_scraper --university duke --list-subjects
        """,
    )

    parser.add_argument("--university", "-u", default=None,
                        help="University key (e.g., duke)")
    parser.add_argument("--output", "-o", default=None,
                        help="Output CSV path (default: data/{university}_catalog.csv)")
    parser.add_argument("--subjects", "-s", nargs="+",
                        help="Specific subject codes to scrape (e.g., COMPSCI MATH)")
    parser.add_argument("--limit", "-l", type=int, default=None,
                        help="Maximum number of courses to fetch")
    parser.add_argument("--merge", "-m", default=None,
                        help="Merge with existing CSV (replaces university's courses)")
    parser.add_argument("--list-subjects", action="store_true",
                        help="List available subject codes and exit")
    parser.add_argument("--list-universities", action="store_true",
                        help="List registered universities and exit")

    args = parser.parse_args()

    # List universities
    if args.list_universities:
        print("\nRegistered Universities:")
        for key, config in sorted(UNIVERSITY_REGISTRY.items()):
            print(f"  {key}: {config.get('university_name', key)} (provider: {config.get('provider', '?')})")
        return

    if not args.university:
        if not args.list_universities:
            print("Error: --university is required (unless using --list-universities)")
            return
        return

    # Get provider
    try:
        provider = get_provider(args.university)
    except ValueError as e:
        print(f"Error: {e}")
        return

    uni_name = UNIVERSITY_REGISTRY[args.university.lower()]["university_name"]

    # List subjects
    if args.list_subjects:
        print(f"\nFetching subjects for {uni_name}...")
        subjects = provider.get_subjects()
        print(f"\nAvailable subjects ({len(subjects)}):")
        for s in subjects:
            print(f"  {s['code']:12s} {s['name']}")
        return

    # Scrape courses
    print(f"\nScraping {uni_name} course catalog...")
    start = time.time()

    courses = provider.get_courses(
        subjects=args.subjects,
        limit=args.limit,
    )

    elapsed = time.time() - start
    print(f"\nScraped {len(courses)} courses in {elapsed:.1f}s")

    if not courses:
        print("No courses found.")
        return

    # Show sample
    print(f"\nSample courses:")
    for c in courses[:5]:
        print(f"  [{c.category}] {c.course_title[:60]}")
        if c.course_description_summary:
            print(f"    Desc: {c.course_description_summary[:80]}...")

    # Export
    if args.merge:
        output = args.merge
        merge_with_existing(courses, args.merge, output, uni_name)
        print(f"\nMerged into: {output}")
    else:
        output = args.output or f"data/{args.university.lower()}_catalog.csv"
        export_to_csv(courses, output)
        print(f"\nSaved to: {output}")


if __name__ == "__main__":
    main()
