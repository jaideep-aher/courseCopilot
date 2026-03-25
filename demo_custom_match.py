#!/usr/bin/env python3
"""
Demo: Match custom syllabi (NOT in dataset) against Duke catalog
This is the PRIMARY use case for your transfer credit evaluation system
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def demo_custom_matching():
    """Demo matching custom syllabi against Duke"""

    print_header("SETUP: Load Duke catalog from dataset")
    load_response = requests.post(
        f"{BASE_URL}/data/load",
        json={"csv_path": "data/Dataset.csv"}
    )
    print(json.dumps(load_response.json(), indent=2))

    # Example 1: Stanford Data Science course
    print_header("EXAMPLE 1: Stanford Data Science Course")

    custom_syllabus_1 = {
        "course_title": "Introduction to Data Science",
        "source_university": "Stanford",
        "target_university": "Duke",
        "course_description": "Comprehensive introduction to data science including statistical analysis, machine learning, data visualization, and big data processing. Students learn Python programming, pandas, scikit-learn, and modern data analysis workflows.",
        "knowledge_points": "python; machine learning; statistics; data visualization; pandas; scikit-learn; data analysis; big data",
        "category": "Computer Science",
        "prerequisites": "Basic programming knowledge (Python preferred)",
        "textbooks_materials": "Python for Data Analysis by Wes McKinney",
        "course_code": "CS 109"
    }

    response = requests.post(
        f"{BASE_URL}/match/custom",
        json=custom_syllabus_1
    )

    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ Custom syllabus matched!")
        print(f"\nSource: {result['source_course']['course_title']} ({custom_syllabus_1['source_university']})")
        print(f"Best match found: {result['best_match_found']}")

        if result['top_matches']:
            print(f"\n📊 Top {len(result['top_matches'])} matches at Duke:")
            for i, match in enumerate(result['top_matches'], 1):
                print(f"\n  {i}. {match['target_course']['course_title']}")
                print(f"     Similarity: {match['similarity_percentage']}%")
                print(f"     Confidence: {match['confidence_level']}")
                print(f"     Shared topics: {', '.join(match['topic_overlap'][:5])}")
                print(f"     Rationale: {match['recommendation_rationale'][:150]}...")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

    # Example 2: Harvard Economics course
    print_header("EXAMPLE 2: Harvard Economics Course")

    custom_syllabus_2 = {
        "course_title": "Intermediate Macroeconomics",
        "source_university": "Harvard",
        "target_university": "Duke",
        "course_description": "Advanced analysis of national economic systems, focusing on GDP, inflation, unemployment, monetary policy, fiscal policy, and international trade. Emphasis on quantitative methods and economic modeling.",
        "knowledge_points": "macroeconomics; GDP; inflation; monetary policy; fiscal policy; economic modeling; unemployment; trade",
        "category": "Economics",
        "prerequisites": "Principles of Economics",
        "course_code": "ECON 1011b"
    }

    response = requests.post(
        f"{BASE_URL}/match/custom",
        json=custom_syllabus_2
    )

    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ Custom syllabus matched!")
        print(f"\nSource: {result['source_course']['course_title']} ({custom_syllabus_2['source_university']})")

        if result['top_matches']:
            best_match = result['top_matches'][0]
            print(f"\n🎯 Best Match: {best_match['target_course']['course_title']}")
            print(f"   Similarity: {best_match['similarity_percentage']}%")
            print(f"   Confidence: {best_match['confidence_level']}")
            print(f"\n   Why it matches:")
            print(f"   {best_match['recommendation_rationale']}")

    # Example 3: Minimal information (testing edge case)
    print_header("EXAMPLE 3: Minimal Information (Edge Case)")

    minimal_syllabus = {
        "course_title": "Introduction to Philosophy",
        "source_university": "Unknown University",
        "target_university": "Duke",
        "course_description": "Survey of major philosophical questions and thinkers."
    }

    response = requests.post(
        f"{BASE_URL}/match/custom",
        json=minimal_syllabus
    )

    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ Matched with limited information")
        if result.get('missing_info_warning'):
            print(f"\n⚠️  Warning: {result['missing_info_warning']}")

        if result['top_matches']:
            print(f"\n   Best match: {result['top_matches'][0]['target_course']['course_title']}")
            print(f"   Similarity: {result['top_matches'][0]['similarity_percentage']}%")
            print(f"   Note: Limited data may reduce accuracy")

    print_header("✓ DEMO COMPLETE")
    print("\n📝 Key Points:")
    print("  • Use /match/custom to match ANY syllabus against Duke catalog")
    print("  • More syllabus details = better matching accuracy")
    print("  • knowledge_points (semicolon-separated) are especially important")
    print("  • System handles missing information gracefully")
    print("\n🔗 Full API docs: http://localhost:8000/docs")

if __name__ == "__main__":
    try:
        demo_custom_matching()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server")
        print("\nStart the server with:")
        print("  python -m uvicorn api.main:app --reload --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
