#!/usr/bin/env python3
"""
Local Course Matcher - In-House Algorithm (No LLM Calls)

Uses a hybrid approach combining:
1. Sentence embeddings (semantic similarity)
2. TF-IDF (keyword similarity)
3. Rule-based scoring (structured fields)
4. Weighted ensemble of all signals
"""
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from collections import Counter
import re


@dataclass
class MatchScore:
    """Detailed match scoring breakdown"""
    semantic_score: float  # 0-1 from sentence embeddings
    keyword_score: float   # 0-1 from TF-IDF
    knowledge_points_score: float  # 0-1 from structured keyword overlap (NEW!)
    category_score: float  # 0-1 from category matching
    level_score: float     # 0-1 from course level matching
    prereq_score: float    # 0-1 from prerequisite similarity
    final_score: float     # Weighted combination

    topic_overlap: List[str]
    key_differences: List[str]
    rationale: str
    confidence: str  # high, medium, low


class LocalCourseMatcher:
    """
    In-house course matching algorithm without external API calls.
    Uses local ML models and custom scoring logic.
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        semantic_weight: float = 0.40,  # 96% description coverage — most reliable signal
        keyword_weight: float = 0.20,
        knowledge_points_weight: float = 0.20,  # Useful when available, but sparse for many universities
        structural_weight: float = 0.20,
    ):
        """
        Initialize matcher with local models.

        Args:
            model_name: Sentence transformer model (lightweight by default)
            semantic_weight: Weight for embedding similarity
            keyword_weight: Weight for TF-IDF similarity
            knowledge_points_weight: Weight for knowledge points overlap
            structural_weight: Weight for rule-based scoring
        """
        self.semantic_weight = semantic_weight
        self.keyword_weight = keyword_weight
        self.knowledge_points_weight = knowledge_points_weight
        self.structural_weight = structural_weight

        # Lazy load heavy dependencies
        self.encoder = None
        self.vectorizer = None
        self.model_name = model_name

        # Course level patterns
        self.level_patterns = {
            "introductory": r"(intro|introduction|fundamental|basic|survey|1\d{3})",
            "intermediate": r"(intermediate|2\d{3})",
            "advanced": r"(advanced|senior|3\d{3}|4\d{3})",
            "graduate": r"(graduate|seminar|[56]\d{3})",
        }

        # University tier mapping for cross-university matching
        self.university_tiers = {
            "Harvard": "tier1",
            "Stanford": "tier1",
            "UC_Berkeley": "tier1",
            "Berkeley": "tier1",
            "Duke": "tier1",
            "GeorgiaTech": "tier1",
            "CMU": "tier1",
            "UCLA": "tier1",
            "UMich": "tier1",
            "NYU": "tier1",
            "Illinois": "tier1",
            "Haverford": "tier2",
            "Houston": "tier2",
            "Houston_Law": "tier2",
            "SJSU": "tier2",
            "US_Universities": "tier2",
        }

    def _ensure_models_loaded(self):
        """Lazy load models only when needed"""
        if self.encoder is None:
            from sentence_transformers import SentenceTransformer
            print(f"Loading sentence transformer model: {self.model_name}...")
            self.encoder = SentenceTransformer(self.model_name)

        if self.vectorizer is None:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.vectorizer = TfidfVectorizer(
                max_features=500,
                stop_words='english',
                ngram_range=(1, 2),
            )

    def _extract_text_content(self, course) -> str:
        """Extract all text content from course for embedding.

        Combines available fields (title, description, knowledge points, etc.)
        into a single text for semantic similarity computation.
        """
        parts = []
        if course.course_title:
            # Repeat title to give it more weight when description is missing
            parts.append(course.course_title)
        if course.course_description:
            parts.append(course.course_description)
        else:
            # No description — repeat title and lean on other fields
            if course.course_title:
                parts.append(course.course_title)
        if course.knowledge_points:
            # Knowledge points are always present — expand semicolons to spaces
            parts.append(course.knowledge_points.replace(';', ' '))
        if course.prerequisites:
            parts.append(course.prerequisites)
        if course.textbooks_materials:
            parts.append(course.textbooks_materials[:300])
        if getattr(course, 'weekly_schedule', None):
            parts.append(str(course.weekly_schedule)[:200])
        return " ".join(parts)

    def _detect_course_level(self, course) -> str:
        """Detect course level from title and code"""
        text = f"{course.course_title} {course.course_code or ''}".lower()

        for level, pattern in self.level_patterns.items():
            if re.search(pattern, text):
                return level

        return "intermediate"  # default

    def _extract_topics(self, text: str) -> List[str]:
        """Extract key topics from text"""
        if not text:
            return []

        # Simple topic extraction (can be enhanced)
        text = text.lower()
        words = re.findall(r'\b[a-z]{4,}\b', text)

        # Filter common words and count
        stopwords = {'course', 'student', 'will', 'this', 'include', 'through',
                     'study', 'topics', 'using', 'introduction', 'basic', 'advanced'}
        words = [w for w in words if w not in stopwords]

        # Return most common topics
        counter = Counter(words)
        return [word for word, _ in counter.most_common(15)]

    def _extract_knowledge_points(self, course) -> set:
        """
        Extract knowledge points as structured keywords.
        Dataset uses semicolon-separated keywords.
        Filters out entries that are just category/department codes.
        """
        if not course.knowledge_points:
            return set()

        raw = str(course.knowledge_points).strip()

        # If it's just a short category code (e.g. "BCMP", "EDUC"), skip it
        if len(raw) <= 10 and ';' not in raw:
            return set()

        # Split by semicolon and clean
        points = raw.lower().split(';')
        cleaned_points = set()

        for point in points:
            point = point.strip()
            # Remove very short or meaningless points
            if len(point) > 2 and point not in {'...', 'n/a', 'na', 'tbd'}:
                cleaned_points.add(point)

        return cleaned_points

    def _compute_knowledge_points_similarity(
        self,
        source_course,
        target_course
    ) -> float:
        """
        Compute similarity based on knowledge points overlap.
        This is highly accurate because knowledge_points are structured keywords!
        """
        source_kp = self._extract_knowledge_points(source_course)
        target_kp = self._extract_knowledge_points(target_course)

        if not source_kp or not target_kp:
            return 0.5  # Neutral score if missing

        # Jaccard similarity
        intersection = len(source_kp & target_kp)
        union = len(source_kp | target_kp)

        if union == 0:
            return 0.5

        jaccard = intersection / union

        # Boost score for strong keyword overlap
        if intersection >= 5:
            jaccard = min(1.0, jaccard * 1.3)  # 30% bonus for strong overlap
        elif intersection >= 3:
            jaccard = min(1.0, jaccard * 1.15)  # 15% bonus for moderate overlap

        return jaccard

    def _compute_semantic_similarity(
        self,
        source_course,
        target_courses: List
    ) -> np.ndarray:
        """Compute semantic similarity using sentence embeddings"""
        self._ensure_models_loaded()

        # Extract text
        source_text = self._extract_text_content(source_course)
        target_texts = [self._extract_text_content(c) for c in target_courses]

        # Encode
        source_embedding = self.encoder.encode([source_text], convert_to_numpy=True)
        target_embeddings = self.encoder.encode(target_texts, convert_to_numpy=True)

        # Cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(source_embedding, target_embeddings)[0]

        return similarities

    def _compute_keyword_similarity(
        self,
        source_course,
        target_courses: List
    ) -> np.ndarray:
        """Compute keyword similarity using TF-IDF"""
        self._ensure_models_loaded()

        # Extract text
        source_text = self._extract_text_content(source_course)
        target_texts = [self._extract_text_content(c) for c in target_courses]

        all_texts = [source_text] + target_texts

        # TF-IDF
        tfidf_matrix = self.vectorizer.fit_transform(all_texts)

        # Cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

        return similarities

    # Map department codes and variant names to canonical categories
    CATEGORY_ALIASES = {
        "phil": "philosophy",
        "psy": "psychology",
        "stat": "statistics", "stats": "statistics",
        "econ": "economics",
        "hist": "history", "his": "history",
        "gov": "government",
        "educ": "education",
        "ital": "italian", "heb": "hebrew",
        "neuro": "neuroscience",
        "bcmp": "biology", "mcb": "biology", "oeb": "biology", "scrb": "biology",
        "ece": "engineering", "me": "engineering", "cee": "engineering",
        "matsci": "materials science",
        "ics": "computer science", "ecs": "computer science", "duke aipi": "computer science",
        "tdm": "theater",
        "hbtm": "hospitality",
        "oit": "operations",
        "rad": "radiology",
        "vms": "visual studies",
        "exhs": "exercise science", "pe health": "exercise science",
        "a": "arts", "m": "music", "c": "communication", "cl": "classics",
        "ias": "international studies",
        "math": "mathematics",
        "finance": "finance",
        "accounting": "accounting",
        "african american studies": "african american studies",
        "asian american studies": "asian american studies",
        "music": "music",
        "sociology": "sociology",
        "chemistry": "chemistry",
        "biology": "biology",
        "physics": "physics",
        "languages": "languages",
        "writing": "writing",
        "dance": "dance",
        "law": "law",
    }

    def _normalize_category(self, category: str) -> str:
        """Normalize category to canonical name"""
        cat = category.lower().replace('_', ' ').strip()
        return self.CATEGORY_ALIASES.get(cat, cat)

    def _compute_category_score(self, source_course, target_course) -> float:
        """Score based on category matching"""
        if not source_course.category or not target_course.category:
            return 0.5

        source_cat = self._normalize_category(source_course.category)
        target_cat = self._normalize_category(target_course.category)

        # Treat generic categories as neutral (not informative)
        generic = {"syllabus", "other", "general", "general_github", "hunter_syllabi"}
        if source_cat in generic or target_cat in generic:
            return 0.5

        # Exact match (after normalization)
        if source_cat == target_cat:
            return 1.0

        # Partial match (any word overlap)
        source_words = set(source_cat.split())
        target_words = set(target_cat.split())
        overlap = len(source_words & target_words)

        if overlap > 0:
            return 0.7

        return 0.3

    def _compute_level_score(self, source_course, target_course) -> float:
        """Score based on course level matching"""
        source_level = self._detect_course_level(source_course)
        target_level = self._detect_course_level(target_course)

        if source_level == target_level:
            return 1.0

        # Adjacent levels
        levels = ["introductory", "intermediate", "advanced", "graduate"]
        try:
            s_idx = levels.index(source_level)
            t_idx = levels.index(target_level)
            diff = abs(s_idx - t_idx)

            if diff == 1:
                return 0.6
            elif diff == 2:
                return 0.3
            else:
                return 0.1
        except ValueError:
            return 0.5

    def _compute_prereq_score(self, source_course, target_course) -> float:
        """Score based on prerequisite similarity"""
        source_prereq = (source_course.prerequisites or "").lower()
        target_prereq = (target_course.prerequisites or "").lower()

        if not source_prereq and not target_prereq:
            return 1.0  # Both have no prerequisites

        if not source_prereq or not target_prereq:
            return 0.6  # One has prerequisites

        # Simple word overlap
        source_words = set(re.findall(r'\b[a-z]{3,}\b', source_prereq))
        target_words = set(re.findall(r'\b[a-z]{3,}\b', target_prereq))

        if not source_words or not target_words:
            return 0.5

        overlap = len(source_words & target_words)
        union = len(source_words | target_words)

        return overlap / union if union > 0 else 0.5

    def _generate_explanation(
        self,
        source_course,
        target_course,
        match_score: MatchScore,
    ) -> Tuple[List[str], List[str], str]:
        """Generate human-readable explanation of match"""
        # Use structured knowledge points for MORE ACCURATE topic overlap
        source_kp = self._extract_knowledge_points(source_course)
        target_kp = self._extract_knowledge_points(target_course)

        # Direct keyword overlap (much more accurate than text extraction!)
        keyword_overlap = list(source_kp & target_kp)[:6]

        # If we don't have enough from knowledge points, fall back to text extraction
        if len(keyword_overlap) < 3:
            source_topics = self._extract_topics(
                f"{source_course.course_description or ''} {source_course.knowledge_points or ''}"
            )
            target_topics = self._extract_topics(
                f"{target_course.course_description or ''} {target_course.knowledge_points or ''}"
            )
            text_overlap = list(set(source_topics[:10]) & set(target_topics[:10]))[:5]
            topic_overlap = keyword_overlap + text_overlap
        else:
            topic_overlap = keyword_overlap

        # Key differences
        differences = []

        if match_score.category_score < 0.7:
            differences.append(f"Different departments ({source_course.category} vs {target_course.category})")

        if match_score.level_score < 0.7:
            source_level = self._detect_course_level(source_course)
            target_level = self._detect_course_level(target_course)
            differences.append(f"Different course levels ({source_level} vs {target_level})")

        if match_score.prereq_score < 0.5:
            differences.append("Different prerequisite requirements")

        if match_score.semantic_score < 0.6:
            differences.append("Content coverage differs significantly")

        # Generate rationale (now includes knowledge points info!)
        kp_overlap_count = len(source_kp & target_kp)

        if match_score.final_score >= 0.8:
            rationale = (
                f"Strong match with {int(match_score.semantic_score * 100)}% semantic similarity "
                f"and {kp_overlap_count} shared key topics. "
                f"Both courses are {self._detect_course_level(source_course)} level. "
                f"Recommended for transfer credit."
            )
        elif match_score.final_score >= 0.6:
            rationale = (
                f"Moderate match with {int(match_score.semantic_score * 100)}% semantic similarity "
                f"and {kp_overlap_count} shared topics. "
                f"Courses have some overlap but notable differences. "
                f"May qualify for partial credit or as an elective."
            )
        else:
            rationale = (
                f"Limited similarity ({int(match_score.semantic_score * 100)}%) "
                f"with only {kp_overlap_count} shared topics. "
                f"Courses differ in content, level, or focus area. "
                f"Not recommended for direct equivalency."
            )

        return topic_overlap, differences, rationale

    def find_matches(
        self,
        source_course,
        target_courses: List,
        top_n: int = 3,
        min_score: float = 0.3,
    ) -> List[Dict]:
        """
        Find best matching courses using hybrid algorithm.

        Args:
            source_course: Source course to match
            target_courses: List of target courses
            top_n: Number of top matches to return
            min_score: Minimum similarity threshold

        Returns:
            List of match dictionaries with scores and explanations
        """
        if not target_courses:
            return []

        self._ensure_models_loaded()

        # Compute all similarity signals
        semantic_sims = self._compute_semantic_similarity(source_course, target_courses)
        keyword_sims = self._compute_keyword_similarity(source_course, target_courses)

        matches = []

        for i, target_course in enumerate(target_courses):
            # Knowledge points similarity (NEW! - very accurate for new dataset)
            kp_score = self._compute_knowledge_points_similarity(source_course, target_course)

            # Structural scores
            category_score = self._compute_category_score(source_course, target_course)
            level_score = self._compute_level_score(source_course, target_course)
            prereq_score = self._compute_prereq_score(source_course, target_course)

            # Combine structural scores
            structural_score = (category_score + level_score + prereq_score) / 3

            # Final weighted score (NOW includes knowledge points!)
            final_score = (
                self.semantic_weight * semantic_sims[i] +
                self.keyword_weight * keyword_sims[i] +
                self.knowledge_points_weight * kp_score +
                self.structural_weight * structural_score
            )

            # Create match score object
            match_score = MatchScore(
                semantic_score=float(semantic_sims[i]),
                keyword_score=float(keyword_sims[i]),
                knowledge_points_score=kp_score,
                category_score=category_score,
                level_score=level_score,
                prereq_score=prereq_score,
                final_score=final_score,
                topic_overlap=[],
                key_differences=[],
                rationale="",
                confidence="medium"
            )

            # Generate explanation
            topic_overlap, differences, rationale = self._generate_explanation(
                source_course, target_course, match_score
            )

            match_score.topic_overlap = topic_overlap
            match_score.key_differences = differences
            match_score.rationale = rationale

            # Determine confidence
            if final_score >= 0.8:
                match_score.confidence = "high"
            elif final_score >= 0.6:
                match_score.confidence = "medium"
            else:
                match_score.confidence = "low"

            matches.append({
                "target_course": target_course,
                "score": match_score,
            })

        # Sort by score and filter
        matches = sorted(matches, key=lambda x: x["score"].final_score, reverse=True)
        matches = [m for m in matches if m["score"].final_score >= min_score]

        return matches[:top_n]

    def batch_match(
        self,
        source_courses: List,
        target_courses: List,
        top_n: int = 3,
    ) -> List[Dict]:
        """Match multiple source courses against target catalog"""
        results = []

        for i, source_course in enumerate(source_courses, 1):
            print(f"  [{i}/{len(source_courses)}] Matching: {source_course.course_title[:45]}...")

            matches = self.find_matches(source_course, target_courses, top_n)

            results.append({
                "source_course": source_course,
                "matches": matches,
            })

        return results


def test_matcher():
    """Quick test of the matcher"""
    from dataclasses import dataclass

    @dataclass
    class DummyCourse:
        course_title: str
        course_description: str
        knowledge_points: str
        category: str
        course_code: str = None
        prerequisites: str = None
        textbooks_materials: str = None

    source = DummyCourse(
        course_title="MATH 101 Calculus I",
        course_description="Introduction to differential and integral calculus",
        knowledge_points="derivatives, integrals, limits, continuity",
        category="Mathematics",
        course_code="MATH 101"
    )

    targets = [
        DummyCourse(
            course_title="MATH 105 Calculus",
            course_description="Covers differentiation and integration",
            knowledge_points="derivatives, integrals, applications",
            category="Mathematics",
            course_code="MATH 105"
        ),
        DummyCourse(
            course_title="STAT 101 Statistics",
            course_description="Introduction to statistical methods",
            knowledge_points="probability, distributions, hypothesis testing",
            category="Statistics",
            course_code="STAT 101"
        ),
    ]

    matcher = LocalCourseMatcher()
    matches = matcher.find_matches(source, targets, top_n=2)

    print("\n=== Match Results ===")
    for match in matches:
        score = match["score"]
        print(f"\nTarget: {match['target_course'].course_title}")
        print(f"Score: {score.final_score:.2f}")
        print(f"  Semantic: {score.semantic_score:.2f}")
        print(f"  Keyword: {score.keyword_score:.2f}")
        print(f"  Category: {score.category_score:.2f}")
        print(f"  Level: {score.level_score:.2f}")
        print(f"Rationale: {score.rationale}")


if __name__ == "__main__":
    test_matcher()
