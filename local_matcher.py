#!/usr/bin/env python3
"""
Local Course Matcher - In-House Algorithm (No LLM Calls)

Uses a hybrid approach combining:
1. Sentence embeddings (semantic similarity)
2. TF-IDF (keyword similarity)
3. Knowledge-points Jaccard overlap
4. Description n-gram overlap
5. Rule-based structural scoring (category, level, prerequisites, credit hours)
6. Adaptive weighted ensemble of all signals
"""
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from collections import Counter
import re


@dataclass
class MatchScore:
    """Detailed match scoring breakdown"""
    semantic_score: float
    keyword_score: float
    knowledge_points_score: float
    description_overlap_score: float
    category_score: float
    level_score: float
    prereq_score: float
    credit_hours_score: float
    final_score: float

    topic_overlap: List[str]
    key_differences: List[str]
    rationale: str
    confidence: str  # very_high, high, medium, low

    score_breakdown: Dict[str, float] = field(default_factory=dict)


class LocalCourseMatcher:
    """
    In-house course matching algorithm without external API calls.
    Uses local ML models and custom scoring logic.
    """

    def __init__(
        self,
        model_name: str = "all-mpnet-base-v2",
        semantic_weight: float = 0.30,
        keyword_weight: float = 0.15,
        knowledge_points_weight: float = 0.15,
        description_overlap_weight: float = 0.15,
        structural_weight: float = 0.25,
    ):
        self.semantic_weight = semantic_weight
        self.keyword_weight = keyword_weight
        self.knowledge_points_weight = knowledge_points_weight
        self.description_overlap_weight = description_overlap_weight
        self.structural_weight = structural_weight

        # Lazy load heavy dependencies
        self.encoder = None
        self.vectorizer = None
        self.model_name = model_name

        self.level_patterns = {
            "introductory": r"(intro|introduction|fundamental|basic|survey|1\d{3})",
            "intermediate": r"(intermediate|2\d{3})",
            "advanced": r"(advanced|senior|3\d{3}|4\d{3})",
            "graduate": r"(graduate|seminar|[56]\d{3})",
        }

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
        """Extract all text content from course for embedding."""
        parts = []
        if course.course_title:
            parts.append(course.course_title)
        if course.course_description:
            parts.append(course.course_description)
        else:
            if course.course_title:
                parts.append(course.course_title)
        if course.knowledge_points:
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

        return "intermediate"

    def _extract_topics(self, text: str) -> List[str]:
        """Extract key topics from text"""
        if not text:
            return []

        text = text.lower()
        words = re.findall(r'\b[a-z]{4,}\b', text)

        stopwords = {'course', 'student', 'will', 'this', 'include', 'through',
                     'study', 'topics', 'using', 'introduction', 'basic', 'advanced'}
        words = [w for w in words if w not in stopwords]

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

        if len(raw) <= 10 and ';' not in raw:
            return set()

        points = raw.lower().split(';')
        cleaned_points = set()

        for point in points:
            point = point.strip()
            if len(point) > 2 and point not in {'...', 'n/a', 'na', 'tbd'}:
                cleaned_points.add(point)

        return cleaned_points

    # ------------------------------------------------------------------ #
    #  Similarity signals                                                  #
    # ------------------------------------------------------------------ #

    def _compute_knowledge_points_similarity(
        self, source_course, target_course
    ) -> float:
        """Jaccard similarity over structured knowledge-point keywords."""
        source_kp = self._extract_knowledge_points(source_course)
        target_kp = self._extract_knowledge_points(target_course)

        if not source_kp or not target_kp:
            return 0.5

        intersection = len(source_kp & target_kp)
        union = len(source_kp | target_kp)

        if union == 0:
            return 0.5

        jaccard = intersection / union

        if intersection >= 5:
            jaccard = min(1.0, jaccard * 1.3)
        elif intersection >= 3:
            jaccard = min(1.0, jaccard * 1.15)

        return jaccard

    def _compute_semantic_similarity(
        self, source_course, target_courses: List
    ) -> np.ndarray:
        """Compute semantic similarity using sentence embeddings"""
        self._ensure_models_loaded()

        source_text = self._extract_text_content(source_course)
        target_texts = [self._extract_text_content(c) for c in target_courses]

        source_embedding = self.encoder.encode([source_text], convert_to_numpy=True)
        target_embeddings = self.encoder.encode(target_texts, convert_to_numpy=True)

        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(source_embedding, target_embeddings)[0]

        return similarities

    def _compute_keyword_similarity(
        self, source_course, target_courses: List
    ) -> np.ndarray:
        """Compute keyword similarity using TF-IDF"""
        self._ensure_models_loaded()

        source_text = self._extract_text_content(source_course)
        target_texts = [self._extract_text_content(c) for c in target_courses]

        all_texts = [source_text] + target_texts

        tfidf_matrix = self.vectorizer.fit_transform(all_texts)

        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]

        return similarities

    def _get_ngrams(self, text: str, n: int) -> set:
        """Extract character-level n-grams from text after normalisation."""
        text = re.sub(r'[^a-z0-9 ]', '', text.lower())
        tokens = text.split()
        if len(tokens) < n:
            return set(tokens)
        return {" ".join(tokens[i:i + n]) for i in range(len(tokens) - n + 1)}

    def _compute_description_overlap(
        self, source_course, target_course
    ) -> float:
        """Bigram/trigram Jaccard overlap over course descriptions."""
        src_desc = source_course.course_description or ""
        tgt_desc = target_course.course_description or ""

        if not src_desc.strip() or not tgt_desc.strip():
            return 0.5  # neutral when description missing

        bigrams_src = self._get_ngrams(src_desc, 2)
        bigrams_tgt = self._get_ngrams(tgt_desc, 2)
        trigrams_src = self._get_ngrams(src_desc, 3)
        trigrams_tgt = self._get_ngrams(tgt_desc, 3)

        def _jaccard(a: set, b: set) -> float:
            if not a or not b:
                return 0.0
            return len(a & b) / len(a | b)

        bi_score = _jaccard(bigrams_src, bigrams_tgt)
        tri_score = _jaccard(trigrams_src, trigrams_tgt)

        return 0.5 * bi_score + 0.5 * tri_score

    # ------------------------------------------------------------------ #
    #  Structural signals                                                  #
    # ------------------------------------------------------------------ #

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
        if not source_course.category or not target_course.category:
            return 0.5

        source_cat = self._normalize_category(source_course.category)
        target_cat = self._normalize_category(target_course.category)

        generic = {"syllabus", "other", "general", "general_github", "hunter_syllabi"}
        if source_cat in generic or target_cat in generic:
            return 0.5

        if source_cat == target_cat:
            return 1.0

        source_words = set(source_cat.split())
        target_words = set(target_cat.split())
        if len(source_words & target_words) > 0:
            return 0.7

        return 0.3

    def _compute_level_score(self, source_course, target_course) -> float:
        source_level = self._detect_course_level(source_course)
        target_level = self._detect_course_level(target_course)

        if source_level == target_level:
            return 1.0

        levels = ["introductory", "intermediate", "advanced", "graduate"]
        try:
            diff = abs(levels.index(source_level) - levels.index(target_level))
            if diff == 1:
                return 0.6
            elif diff == 2:
                return 0.3
            else:
                return 0.1
        except ValueError:
            return 0.5

    def _compute_prereq_score(self, source_course, target_course) -> float:
        source_prereq = (source_course.prerequisites or "").lower()
        target_prereq = (target_course.prerequisites or "").lower()

        if not source_prereq and not target_prereq:
            return 1.0
        if not source_prereq or not target_prereq:
            return 0.6

        source_words = set(re.findall(r'\b[a-z]{3,}\b', source_prereq))
        target_words = set(re.findall(r'\b[a-z]{3,}\b', target_prereq))

        if not source_words or not target_words:
            return 0.5

        return len(source_words & target_words) / len(source_words | target_words)

    def _compute_credit_hours_score(self, source_course, target_course) -> float:
        """Score based on credit-hour alignment."""
        src_credits = getattr(source_course, 'credit_hours', None)
        tgt_credits = getattr(target_course, 'credit_hours', None)

        if src_credits is None or tgt_credits is None:
            return 0.5  # neutral when data missing

        diff = abs(int(src_credits) - int(tgt_credits))
        if diff == 0:
            return 1.0
        elif diff == 1:
            return 0.7
        else:
            return 0.3

    # ------------------------------------------------------------------ #
    #  Adaptive weight calculation                                         #
    # ------------------------------------------------------------------ #

    def _adaptive_weights(self, source_course, target_course) -> Dict[str, float]:
        """
        Dynamically redistribute weights when certain data fields are missing.
        Returns dict with keys: semantic, keyword, knowledge_points,
        description_overlap, structural.
        """
        w = {
            "semantic": self.semantic_weight,
            "keyword": self.keyword_weight,
            "knowledge_points": self.knowledge_points_weight,
            "description_overlap": self.description_overlap_weight,
            "structural": self.structural_weight,
        }

        src_kp = self._extract_knowledge_points(source_course)
        tgt_kp = self._extract_knowledge_points(target_course)
        kp_missing = not src_kp or not tgt_kp

        src_desc_missing = not (source_course.course_description or "").strip()
        tgt_desc_missing = not (target_course.course_description or "").strip()
        desc_missing = src_desc_missing or tgt_desc_missing

        if kp_missing:
            spare = w["knowledge_points"]
            w["knowledge_points"] = 0.0
            w["semantic"] += spare * 0.5
            w["keyword"] += spare * 0.5

        if desc_missing:
            spare = w["description_overlap"]
            w["description_overlap"] = 0.0
            if src_desc_missing:
                w["structural"] += spare
            else:
                w["semantic"] += spare * 0.5
                w["keyword"] += spare * 0.5

        return w

    # ------------------------------------------------------------------ #
    #  Explanation generation                                              #
    # ------------------------------------------------------------------ #

    def _generate_explanation(
        self,
        source_course,
        target_course,
        match_score: MatchScore,
    ) -> Tuple[List[str], List[str], str]:
        """Generate human-readable explanation of match"""
        source_kp = self._extract_knowledge_points(source_course)
        target_kp = self._extract_knowledge_points(target_course)

        keyword_overlap = list(source_kp & target_kp)[:6]

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

        differences = []

        if match_score.category_score < 0.7:
            differences.append(f"Different departments ({source_course.category} vs {target_course.category})")
        if match_score.level_score < 0.7:
            differences.append(
                f"Different course levels ({self._detect_course_level(source_course)} vs "
                f"{self._detect_course_level(target_course)})"
            )
        if match_score.prereq_score < 0.5:
            differences.append("Different prerequisite requirements")
        if match_score.credit_hours_score < 0.7:
            differences.append("Different credit hours")
        if match_score.semantic_score < 0.6:
            differences.append("Content coverage differs significantly")

        kp_overlap_count = len(source_kp & target_kp)

        breakdown = (
            f"[Semantic {int(match_score.semantic_score * 100)}% | "
            f"Keywords {int(match_score.keyword_score * 100)}% | "
            f"Topics {int(match_score.knowledge_points_score * 100)}% | "
            f"Desc {int(match_score.description_overlap_score * 100)}% | "
            f"Structure {int(((match_score.category_score + match_score.level_score + match_score.prereq_score + match_score.credit_hours_score) / 4) * 100)}%]"
        )

        if match_score.final_score >= 0.8:
            rationale = (
                f"Strong match with {kp_overlap_count} shared key topics. "
                f"Both courses are {self._detect_course_level(source_course)} level. "
                f"Recommended for transfer credit. {breakdown}"
            )
        elif match_score.final_score >= 0.6:
            rationale = (
                f"Moderate match with {kp_overlap_count} shared topics. "
                f"Courses have some overlap but notable differences. "
                f"May qualify for partial credit or as an elective. {breakdown}"
            )
        else:
            rationale = (
                f"Limited similarity with only {kp_overlap_count} shared topics. "
                f"Courses differ in content, level, or focus area. "
                f"Not recommended for direct equivalency. {breakdown}"
            )

        return topic_overlap, differences, rationale

    # ------------------------------------------------------------------ #
    #  Main matching entry point                                           #
    # ------------------------------------------------------------------ #

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

        # Batch-compute vectorised signals
        semantic_sims = self._compute_semantic_similarity(source_course, target_courses)
        keyword_sims = self._compute_keyword_similarity(source_course, target_courses)

        matches = []

        for i, target_course in enumerate(target_courses):
            # Per-pair signals
            kp_score = self._compute_knowledge_points_similarity(source_course, target_course)
            desc_overlap_score = self._compute_description_overlap(source_course, target_course)

            # Structural sub-scores
            category_score = self._compute_category_score(source_course, target_course)
            level_score = self._compute_level_score(source_course, target_course)
            prereq_score = self._compute_prereq_score(source_course, target_course)
            credit_hours_score = self._compute_credit_hours_score(source_course, target_course)

            structural_score = (category_score + level_score + prereq_score + credit_hours_score) / 4

            # Adaptive weights based on data availability
            w = self._adaptive_weights(source_course, target_course)

            final_score = (
                w["semantic"] * semantic_sims[i] +
                w["keyword"] * keyword_sims[i] +
                w["knowledge_points"] * kp_score +
                w["description_overlap"] * desc_overlap_score +
                w["structural"] * structural_score
            )

            breakdown = {
                "semantic": round(float(semantic_sims[i]), 3),
                "keyword": round(float(keyword_sims[i]), 3),
                "knowledge_points": round(kp_score, 3),
                "description_overlap": round(desc_overlap_score, 3),
                "structural": round(structural_score, 3),
                "weights_used": {k: round(v, 3) for k, v in w.items()},
            }

            match_score = MatchScore(
                semantic_score=float(semantic_sims[i]),
                keyword_score=float(keyword_sims[i]),
                knowledge_points_score=kp_score,
                description_overlap_score=desc_overlap_score,
                category_score=category_score,
                level_score=level_score,
                prereq_score=prereq_score,
                credit_hours_score=credit_hours_score,
                final_score=final_score,
                topic_overlap=[],
                key_differences=[],
                rationale="",
                confidence="medium",
                score_breakdown=breakdown,
            )

            topic_overlap, differences, rationale = self._generate_explanation(
                source_course, target_course, match_score
            )

            match_score.topic_overlap = topic_overlap
            match_score.key_differences = differences
            match_score.rationale = rationale

            if final_score >= 0.85:
                match_score.confidence = "very_high"
            elif final_score >= 0.70:
                match_score.confidence = "high"
            elif final_score >= 0.55:
                match_score.confidence = "medium"
            else:
                match_score.confidence = "low"

            matches.append({
                "target_course": target_course,
                "score": match_score,
            })

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
    from dataclasses import dataclass as dc

    @dc
    class DummyCourse:
        course_title: str
        course_description: str
        knowledge_points: str
        category: str
        course_code: str = None
        prerequisites: str = None
        textbooks_materials: str = None
        credit_hours: int = None

    source = DummyCourse(
        course_title="MATH 101 Calculus I",
        course_description="Introduction to differential and integral calculus",
        knowledge_points="derivatives; integrals; limits; continuity",
        category="Mathematics",
        course_code="MATH 101",
        credit_hours=3,
    )

    targets = [
        DummyCourse(
            course_title="MATH 105 Calculus",
            course_description="Covers differentiation and integration",
            knowledge_points="derivatives; integrals; applications",
            category="Mathematics",
            course_code="MATH 105",
            credit_hours=3,
        ),
        DummyCourse(
            course_title="STAT 101 Statistics",
            course_description="Introduction to statistical methods",
            knowledge_points="probability; distributions; hypothesis testing",
            category="Statistics",
            course_code="STAT 101",
            credit_hours=3,
        ),
    ]

    matcher = LocalCourseMatcher()
    matches = matcher.find_matches(source, targets, top_n=2)

    print("\n=== Match Results ===")
    for match in matches:
        score = match["score"]
        print(f"\nTarget: {match['target_course'].course_title}")
        print(f"Score: {score.final_score:.2f} (confidence: {score.confidence})")
        print(f"  Semantic:    {score.semantic_score:.2f}")
        print(f"  Keyword:     {score.keyword_score:.2f}")
        print(f"  KP Overlap:  {score.knowledge_points_score:.2f}")
        print(f"  Desc Overlap:{score.description_overlap_score:.2f}")
        print(f"  Category:    {score.category_score:.2f}")
        print(f"  Level:       {score.level_score:.2f}")
        print(f"  Prereq:      {score.prereq_score:.2f}")
        print(f"  Credits:     {score.credit_hours_score:.2f}")
        print(f"Rationale: {score.rationale}")


if __name__ == "__main__":
    test_matcher()
