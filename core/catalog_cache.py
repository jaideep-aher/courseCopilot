"""
In-memory cache for scraped catalog data with TTL.
"""
import time
from typing import List, Dict, Optional, Tuple

from models.schemas import Course


class CatalogCache:
    """In-memory cache for target university catalog data."""

    def __init__(self, ttl_seconds: int = 86400):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Tuple[float, List[Course]]] = {}

    def _make_key(self, university: str, subjects: Optional[List[str]] = None) -> str:
        subj_part = ",".join(sorted(subjects)) if subjects else "ALL"
        return f"{university.lower()}:{subj_part}"

    def get(self, university: str, subjects: Optional[List[str]] = None) -> Optional[List[Course]]:
        """Return cached courses if still valid, else None."""
        key = self._make_key(university, subjects)
        if key in self._cache:
            ts, courses = self._cache[key]
            if time.time() - ts < self.ttl:
                return courses
            del self._cache[key]
        return None

    def put(self, university: str, courses: List[Course], subjects: Optional[List[str]] = None):
        """Store courses in cache."""
        key = self._make_key(university, subjects)
        self._cache[key] = (time.time(), courses)

    def invalidate(self, university: Optional[str] = None):
        """Clear cache for a university or all."""
        if university:
            prefix = f"{university.lower()}:"
            self._cache = {k: v for k, v in self._cache.items() if not k.startswith(prefix)}
        else:
            self._cache.clear()
