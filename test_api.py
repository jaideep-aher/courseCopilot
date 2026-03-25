#!/usr/bin/env python3
"""
Quick API test for Course Co-Pilot
Tests that the API endpoints work with the new local matcher
"""
import asyncio
import sys
from core.data_loader import CourseDataLoader
from core.matcher import SimilarityEngine


async def test_api():
    """Test the core matching functionality"""
    print("=" * 60)
    print("Testing Course Co-Pilot API (In-House Matching)")
    print("=" * 60)

    # Load data
    print("\n1. Loading data...")
    try:
        loader = CourseDataLoader("data/syllabus_dataset.csv")
        loader.load()
        stats = loader.get_statistics()
        print(f"   ✓ Loaded {stats['total_courses']} courses")
        print(f"   ✓ Universities: {', '.join(stats['by_university'].keys())}")
    except Exception as e:
        print(f"   ✗ Failed to load data: {e}")
        return False

    # Initialize engine
    print("\n2. Initializing similarity engine...")
    try:
        engine = SimilarityEngine()
        print("   ✓ Engine initialized (using local ML models)")
    except Exception as e:
        print(f"   ✗ Failed to initialize engine: {e}")
        return False

    # Test single match
    print("\n3. Testing single course matching...")
    try:
        source_courses = loader.get_source_courses("Houston")
        target_courses = loader.get_target_courses("Duke")

        if not source_courses or not target_courses:
            print("   ✗ No courses found")
            return False

        print(f"   Testing: {source_courses[0].course_title[:50]}...")
        result = await engine.evaluate_single_course(
            source_courses[0],
            target_courses
        )

        print(f"   ✓ Found {len(result.top_matches)} matches")
        if result.top_matches:
            best = result.top_matches[0]
            print(f"   ✓ Best match: {best.target_course.course_title[:50]}")
            print(f"   ✓ Similarity: {best.similarity_percentage}%")
            print(f"   ✓ Confidence: {best.confidence_level}")
    except Exception as e:
        print(f"   ✗ Matching failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test batch matching
    print("\n4. Testing batch matching (3 courses)...")
    try:
        test_courses = source_courses[:3]
        evaluation = await engine.evaluate_transfer(test_courses, target_courses)

        summary = evaluation["summary"]
        print(f"   ✓ Evaluated: {summary['total_courses_evaluated']} courses")
        print(f"   ✓ With matches: {summary['courses_with_matches']}")
        print(f"   ✓ High confidence: {summary['high_confidence_matches']}")
        print(f"   ✓ Processing time: {summary['processing_time_seconds']}s")
    except Exception as e:
        print(f"   ✗ Batch matching failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nAPI is ready to use. Start the server with:")
    print("  python -m uvicorn api.main:app --reload --port 8000")
    print("\nThen visit: http://localhost:8000/docs")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_api())
    sys.exit(0 if success else 1)
