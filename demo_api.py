#!/usr/bin/env python3
"""
Demo script to test the Course Co-Pilot API
Shows all the key endpoints your teammate will use
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print a section header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_api():
    """Test all API endpoints"""

    print_section("1. API INFO")
    response = requests.get(f"{BASE_URL}/")
    print(json.dumps(response.json(), indent=2))

    print_section("2. LOAD DATA")
    response = requests.post(
        f"{BASE_URL}/data/load",
        json={"csv_path": "data/syllabus_dataset.csv"}
    )
    print(json.dumps(response.json(), indent=2))

    print_section("3. HEALTH CHECK")
    response = requests.get(f"{BASE_URL}/health")
    print(json.dumps(response.json(), indent=2))

    print_section("4. LIST SOURCE COURSES (Houston)")
    response = requests.get(f"{BASE_URL}/courses/source")
    data = response.json()
    print(f"Total: {data['total']} courses")
    print(f"First 3 courses:")
    for course in data['courses'][:3]:
        print(f"  - {course['title']}")
        print(f"    ID: {course['id'][:60]}...")

    print_section("5. LIST TARGET COURSES (Duke)")
    response = requests.get(f"{BASE_URL}/courses/target")
    data = response.json()
    print(f"Total: {data['total']} courses")
    print(f"First 3 courses:")
    for course in data['courses'][:3]:
        print(f"  - {course['title']}")

    # Get a course ID for matching
    source_response = requests.get(f"{BASE_URL}/courses/source")
    source_courses = source_response.json()['courses']
    test_course_id = source_courses[0]['id']

    print_section("6. SINGLE COURSE MATCH")
    print(f"Testing course: {source_courses[0]['title']}")
    print(f"Course ID: {test_course_id[:60]}...")

    start_time = time.time()
    response = requests.post(
        f"{BASE_URL}/match/single",
        json={
            "source_course_id": test_course_id,
            "target_university": "Duke"
        }
    )
    elapsed = time.time() - start_time

    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ Match completed in {elapsed:.2f}s")
        print(f"\nSource: {result['source_course']['course_title']}")
        print(f"Best match found: {result['best_match_found']}")

        if result['top_matches']:
            print(f"\nTop {len(result['top_matches'])} matches:")
            for i, match in enumerate(result['top_matches'], 1):
                print(f"\n  {i}. {match['target_course']['course_title']}")
                print(f"     Similarity: {match['similarity_percentage']}%")
                print(f"     Confidence: {match['confidence_level']}")
                print(f"     Topics: {', '.join(match['topic_overlap'][:5])}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

    print_section("7. BATCH MATCH (3 courses)")
    test_ids = [c['id'] for c in source_courses[:3]]

    start_time = time.time()
    response = requests.post(
        f"{BASE_URL}/match/batch",
        json={
            "source_course_ids": test_ids,
            "target_university": "Duke"
        }
    )
    elapsed = time.time() - start_time

    if response.status_code == 200:
        result = response.json()
        print(f"✓ Batch match completed in {elapsed:.2f}s")
        print(f"\nSummary:")
        summary = result['summary']
        print(f"  Courses evaluated: {summary['total_courses_evaluated']}")
        print(f"  With matches: {summary['courses_with_matches']}")
        print(f"  High confidence: {summary['high_confidence_matches']}")
        print(f"  Processing time: {summary['processing_time_seconds']}s")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

    print_section("8. STATISTICS")
    response = requests.get(f"{BASE_URL}/statistics")
    print(json.dumps(response.json(), indent=2))

    print_section("✓ ALL API TESTS COMPLETED!")
    print("\nAPI Documentation: http://localhost:8000/docs")
    print("Interactive testing: http://localhost:8000/docs")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("\nStart the server with:")
        print("  python -m uvicorn api.main:app --reload --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
