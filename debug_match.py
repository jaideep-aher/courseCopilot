#!/usr/bin/env python3
"""Debug script to see matching scores"""
import sys
sys.path.insert(0, '.')

from local_matcher import LocalCourseMatcher
from models.schemas import Course

# Create matcher
matcher = LocalCourseMatcher(
    model_name="all-mpnet-base-v2",
    semantic_weight=0.30,
    keyword_weight=0.15,
    knowledge_points_weight=0.15,
    description_overlap_weight=0.15,
    structural_weight=0.25,
)

# Create a custom ML course
custom_course = Course(
    university="Stanford",
    category="Computer Science",
    file_name="custom_test",
    course_title="Introduction to Machine Learning",
    course_description="Machine learning fundamentals including supervised and unsupervised learning, neural networks, and deep learning",
    knowledge_points="machine learning; supervised learning; unsupervised learning; neural networks; deep learning; algorithms",
    prerequisites="Linear algebra, calculus, programming"
)

# Create a Duke AIPI course
duke_course = Course(
    university="Duke",
    category="Duke AIPI",
    file_name="aipi510",
    course_title="AI in Product Management",
    course_description="AI and machine learning applications in product management",
    knowledge_points="machine learning; analytics; privacy; ai; data sourcing; data pipelines; data science; model evaluation; regression; evaluation; ethics; statistics; calculus; algebra",
    prerequisites="Basic programming"
)

print("Testing match between:")
print(f"  Source: {custom_course.course_title}")
print(f"  Target: {duke_course.course_title}")
print()

# Find matches
matches = matcher.find_matches(custom_course, [duke_course], top_n=1, min_score=0.0)

if matches:
    match = matches[0]
    score = match['score']
    print(f"✓ Match found!")
    print(f"  Final Score: {score.final_score:.3f} ({int(score.final_score * 100)}%)")
    print(f"  Semantic: {score.semantic_score:.3f}")
    print(f"  Keyword: {score.keyword_score:.3f}")
    print(f"  Knowledge Points: {score.knowledge_points_score:.3f}")
    print(f"  Desc Overlap: {score.description_overlap_score:.3f}")
    print(f"  Category: {score.category_score:.3f}")
    print(f"  Level: {score.level_score:.3f}")
    print(f"  Prereq: {score.prereq_score:.3f}")
    print(f"  Credit Hours: {score.credit_hours_score:.3f}")
    print(f"\n  Topic Overlap: {', '.join(score.topic_overlap)}")
    print(f"  Confidence: {score.confidence}")
    print(f"\n  Rationale: {score.rationale}")
else:
    print("✗ No matches found")
