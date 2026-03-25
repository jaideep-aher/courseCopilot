"""
Smart subject inference: given source courses, determine which target university
subjects to scrape from the catalog.
"""
from typing import List, Dict, Optional
from models.schemas import Course

# Maps normalized academic categories to likely target subject codes.
# These are broad mappings — the fuzzy matcher below handles edge cases.
CATEGORY_TO_SUBJECTS: Dict[str, List[str]] = {
    "computer science": ["COMPSCI", "AIPI", "ECE", "ISS"],
    "engineering": ["ECE", "ME", "CEE", "BME", "ENRGYEGR", "EGRMGMT"],
    "mathematics": ["MATH", "STA"],
    "statistics": ["STA", "MATH"],
    "economics": ["ECON", "PUBPOL"],
    "biology": ["BIOLOGY", "BIOSTAT", "BME", "BIOCHEM"],
    "chemistry": ["CHEM", "BIOCHEM"],
    "physics": ["PHYSICS"],
    "psychology": ["PSY", "NEUROSCI"],
    "neuroscience": ["NEUROSCI", "PSY"],
    "philosophy": ["PHIL"],
    "history": ["HISTORY"],
    "political science": ["POLSCI", "PUBPOL"],
    "sociology": ["SOCIOL"],
    "education": ["EDUC"],
    "music": ["MUSIC"],
    "finance": ["FINANCE", "ECON"],
    "accounting": ["ACCOUNTG", "ECON"],
    "law": ["LAW"],
    "writing": ["WRITING", "ENGLISH"],
    "languages": ["ROMST", "GERMAN", "CHINESE", "JAPANESE", "SPANISH", "FRENCH"],
    "arts": ["ARTSVIS", "ARTHIST"],
    "theater": ["THEATRST"],
    "dance": ["DANCE"],
    "african american studies": ["AAAS"],
    "asian american studies": ["AMES"],
    "international studies": ["ICS", "PUBPOL"],
    "exercise science": ["PHYSEDU"],
    "materials science": ["MATSCI", "ME"],
    "government": ["POLSCI", "PUBPOL"],
}

# Reverse mapping from CATEGORY_ALIASES in local_matcher.py
_ALIAS_TO_CANONICAL = {
    "phil": "philosophy", "psy": "psychology",
    "stat": "statistics", "stats": "statistics",
    "econ": "economics", "hist": "history", "his": "history",
    "gov": "government", "educ": "education",
    "neuro": "neuroscience",
    "bcmp": "biology", "mcb": "biology", "oeb": "biology", "scrb": "biology",
    "ece": "engineering", "me": "engineering", "cee": "engineering",
    "ics": "computer science", "ecs": "computer science", "duke aipi": "computer science",
    "math": "mathematics", "finance": "finance", "accounting": "accounting",
    "sociology": "sociology", "chemistry": "chemistry", "biology": "biology",
    "physics": "physics", "music": "music", "dance": "dance", "law": "law",
    "writing": "writing", "comp sci": "computer science",
}


def _normalize_category(cat: str) -> str:
    """Normalize a category string to canonical form."""
    cat = cat.lower().replace("_", " ").strip()
    return _ALIAS_TO_CANONICAL.get(cat, cat)


def infer_target_subjects(
    source_courses: List[Course],
    available_subjects: List[Dict[str, str]],
    max_subjects: int = 15,
) -> List[str]:
    """
    Given source courses and available target subjects, infer which subjects to scrape.

    Args:
        source_courses: Student's source courses
        available_subjects: List of {"code": "COMPSCI", "name": "Computer Science"} from provider
        max_subjects: Maximum number of subjects to return

    Returns:
        List of subject codes to scrape
    """
    available_codes = {s["code"].upper() for s in available_subjects}
    available_by_name = {}
    for s in available_subjects:
        available_by_name[s["name"].lower()] = s["code"]
        # Also index by individual words for fuzzy matching
        for word in s["name"].lower().split():
            if len(word) > 3:
                available_by_name[word] = s["code"]

    candidates = set()

    for course in source_courses:
        cat = _normalize_category(course.category) if course.category else ""

        # Direct lookup in CATEGORY_TO_SUBJECTS
        if cat in CATEGORY_TO_SUBJECTS:
            for subj in CATEGORY_TO_SUBJECTS[cat]:
                if subj in available_codes:
                    candidates.add(subj)

        # Fuzzy match category name against available subject names
        if cat:
            for name_key, code in available_by_name.items():
                if cat in name_key or name_key in cat:
                    candidates.add(code)

        # Also check course title for subject hints
        title_lower = (course.course_title or "").lower()
        for name_key, code in available_by_name.items():
            if len(name_key) > 4 and name_key in title_lower:
                candidates.add(code)

    # Fallback: if no subjects inferred, use a broad default set
    if not candidates:
        defaults = ["COMPSCI", "MATH", "ECON", "BIOLOGY", "CHEM", "PHYSICS",
                     "PSY", "ENGLISH", "HISTORY", "POLSCI"]
        candidates = {s for s in defaults if s in available_codes}

    return sorted(candidates)[:max_subjects]
