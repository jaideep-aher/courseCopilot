#!/usr/bin/env python3
import requests
import json

# First, load the data
print("Loading Duke catalog...")
load_response = requests.post(
    "http://localhost:8000/data/load",
    json={"csv_path": "data/Dataset.csv"}
)
print(f"Load status: {load_response.status_code}")
if load_response.status_code == 200:
    stats = load_response.json()['statistics']
    print(f"Loaded {stats['total_courses']} courses from {len(stats['by_university'])} universities\n")

# Now test the /match/custom endpoint
print("Testing /match/custom endpoint...")
response = requests.post(
    "http://localhost:8000/match/custom",
    json={
        "course_title": "Introduction to Machine Learning",
        "source_university": "Stanford",
        "target_university": "Duke",
        "course_description": "Machine learning fundamentals including supervised and unsupervised learning, neural networks, and deep learning",
        "knowledge_points": "machine learning; supervised learning; unsupervised learning; neural networks; deep learning; algorithms",
        "category": "Computer Science",
        "prerequisites": "Linear algebra, calculus, programming"
    }
)

print("Status:", response.status_code)
print("\nResponse:")
result = response.json()
print(json.dumps(result, indent=2)[:2000])  # First 2000 chars

if response.status_code == 200 and result.get('top_matches'):
    print(f"\n\n✓ Found {len(result['top_matches'])} matches!")
    for i, match in enumerate(result['top_matches'][:3], 1):
        print(f"\n{i}. {match['target_course']['course_title']}")
        print(f"   Similarity: {match['similarity_percentage']}%")
        print(f"   Confidence: {match['confidence_level']}")
