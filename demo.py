#!/usr/bin/env python3
"""
Course Co-Pilot Demo Script
Demonstrates how to use the library programmatically
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core.data_loader import CourseDataLoader
from core.matcher import SimilarityEngine, find_course_matches
from core.summarizer import CourseSummarizer
from core.llm_client import get_llm_client, MockLLMClient


async def demo_with_mock():
    """
    Demo using mock LLM (no API key needed)
    Shows the data flow and structure
    """
    print("\n" + "=" * 60)
    print(" Course Co-Pilot Demo (Mock Mode)")
    print("=" * 60)
    
    # Path to your CSV file
    csv_path = "data/syllabus_dataset.csv"  # Update this path as needed
    
    # Check if file exists
    if not Path(csv_path).exists():
        print(f"\n⚠️  CSV file not found at: {csv_path}")
        print("Please update the csv_path variable or copy your data file.")
        print("\nExpected location: course_copilot/data/syllabus_dataset.csv")
        return
    
    # 1. Load the data
    print("\n📂 Step 1: Loading course data...")
    loader = CourseDataLoader(csv_path)
    loader.load()
    
    stats = loader.get_statistics()
    print(f"   Loaded {stats['total_courses']} courses")
    print(f"   By university: {stats['by_university']}")
    
    # 2. Get source and target courses
    print("\n📚 Step 2: Separating source and target courses...")
    source_courses = loader.get_source_courses("Houston")
    target_courses = loader.get_target_courses("Duke")
    
    print(f"   Source (Houston): {len(source_courses)} courses")
    print(f"   Target (Duke): {len(target_courses)} courses")
    
    # 3. Show sample courses
    print("\n📋 Step 3: Sample source courses:")
    for course in source_courses[:3]:
        print(f"   - {course.course_code or 'N/A'}: {course.course_title[:50]}...")
    
    print("\n📋 Sample target courses:")
    for course in target_courses[:3]:
        print(f"   - {course.course_code or 'N/A'}: {course.course_title[:50]}...")
    
    # 4. Create course summaries (mock mode)
    print("\n🤖 Step 4: In production, the LLM would generate summaries...")
    print("   (Running in mock mode - no API calls)")
    
    # Show what a summary looks like
    sample_summary = loader.create_course_summary(source_courses[0])
    print(f"\n   Sample summary structure:")
    print(f"   - Course: {sample_summary.course_title}")
    print(f"   - Topics: {sample_summary.main_topics[:5]}")
    print(f"   - Level: {sample_summary.course_level}")
    print(f"   - Missing fields: {sample_summary.missing_fields}")
    
    # 5. Show expected output structure
    print("\n📊 Step 5: Expected match result structure:")
    print("""
    {
        "source_course": {
            "course_title": "AAS 2320 Intro To African American Stdy",
            "university": "Houston",
            "main_topics": ["culture", "african american", "history"...],
            "course_level": "introductory"
        },
        "top_matches": [
            {
                "target_course": {...Duke course...},
                "similarity_score": 0.85,
                "similarity_percentage": 85,
                "topic_overlap": ["culture", "history"],
                "key_differences": ["Different focus area"],
                "recommendation_rationale": "Both courses cover..."
            }
        ],
        "best_match_found": true,
        "evaluation_notes": "Strong match found..."
    }
    """)
    
    print("\n✅ Demo complete!")
    print("\nTo run with actual LLM:")
    print("  1. Set ANTHROPIC_API_KEY environment variable")
    print("  2. Run: python cli.py evaluate data/syllabus_dataset.csv")


async def demo_with_llm(csv_path: str):
    """
    Demo using actual LLM (requires API key)
    """
    print("\n" + "=" * 60)
    print(" Course Co-Pilot Demo (Live LLM Mode)")
    print("=" * 60)
    
    # Load data
    print("\n📂 Loading course data...")
    loader = CourseDataLoader(csv_path)
    loader.load()
    
    source_courses = loader.get_source_courses("Houston")
    target_courses = loader.get_target_courses("Duke")
    
    print(f"   Source courses: {len(source_courses)}")
    print(f"   Target courses: {len(target_courses)}")
    
    # Initialize engine
    print("\n🤖 Initializing similarity engine...")
    engine = SimilarityEngine()
    
    # Evaluate just one course for demo
    print("\n🔍 Evaluating first source course...")
    sample_course = source_courses[0]
    print(f"   Course: {sample_course.course_title}")
    
    result = await engine.evaluate_single_course(sample_course, target_courses)
    
    # Print results
    print(f"\n📊 Results for: {result.source_course.course_title}")
    print(f"   Best match found: {result.best_match_found}")
    
    if result.top_matches:
        print(f"\n   Top {len(result.top_matches)} matches:")
        for i, match in enumerate(result.top_matches):
            print(f"\n   Match #{i+1}:")
            print(f"   - Course: {match.target_course.course_title}")
            print(f"   - Similarity: {match.similarity_percentage}%")
            print(f"   - Rationale: {match.recommendation_rationale[:150]}...")
    
    print(f"\n   Evaluation notes: {result.evaluation_notes}")


def main():
    """Main entry point"""
    import os
    
    # Check for API key
    has_api_key = (
        os.getenv("ANTHROPIC_API_KEY") or 
        os.getenv("OPENAI_API_KEY")
    )
    
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
        if has_api_key:
            asyncio.run(demo_with_llm(csv_path))
        else:
            print("No API key found. Running mock demo.")
            asyncio.run(demo_with_mock())
    else:
        # Run mock demo
        asyncio.run(demo_with_mock())


if __name__ == "__main__":
    main()
