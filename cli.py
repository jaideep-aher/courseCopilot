#!/usr/bin/env python3
"""
Course Co-Pilot CLI
Command-line interface for testing and running evaluations
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from core.data_loader import CourseDataLoader
from core.matcher import SimilarityEngine
from core.config import settings


def print_header(text: str):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)


def print_match(match, index: int):
    """Print a formatted match result"""
    print(f"\n  Match #{index + 1}: {match.target_course.course_title}")
    print(f"  ├── Similarity: {match.similarity_percentage}%")
    print(f"  ├── Confidence: {match.confidence_level}")
    print(f"  ├── Category: {match.target_course.category}")
    
    if match.topic_overlap:
        print(f"  ├── Topic Overlap: {', '.join(match.topic_overlap[:5])}")
    
    if match.key_differences:
        print(f"  ├── Key Differences: {', '.join(match.key_differences[:3])}")
    
    print(f"  └── Rationale: {match.recommendation_rationale[:200]}...")


async def run_evaluation(csv_path: str, source_ids: list = None, output_json: str = None):
    """Run a transfer credit evaluation"""
    
    print_header("Course Co-Pilot - Transfer Credit Evaluation")
    
    # Load data
    print(f"\n📂 Loading data from: {csv_path}")
    loader = CourseDataLoader(csv_path)
    loader.load()
    
    stats = loader.get_statistics()
    print(f"   Loaded {stats['total_courses']} courses")
    print(f"   Universities: {stats['by_university']}")
    
    # Get courses
    source_courses = loader.get_source_courses("Houston")
    target_courses = loader.get_target_courses("Duke")
    
    print(f"\n📚 Source courses (Houston): {len(source_courses)}")
    print(f"📚 Target courses (Duke): {len(target_courses)}")
    
    # Filter source courses if IDs provided
    if source_ids:
        source_courses = [
            c for c in source_courses 
            if c.file_name in source_ids or c.course_code in source_ids
        ]
        print(f"\n🔍 Filtered to {len(source_courses)} source courses")
    
    if not source_courses:
        print("\n❌ No source courses to evaluate!")
        return
    
    if not target_courses:
        print("\n❌ No target courses to compare against!")
        return
    
    # Initialize engine
    print("\n🤖 Initializing similarity engine...")
    engine = SimilarityEngine()
    
    # Run evaluation
    print_header("Running Evaluation")
    print(f"Evaluating {len(source_courses)} courses against {len(target_courses)} target courses...")
    print("(This may take a few minutes depending on API response times)\n")
    
    try:
        evaluation = await engine.evaluate_transfer(source_courses, target_courses)
        
        # Print results
        print_header("Evaluation Results")
        
        summary = evaluation["summary"]
        print(f"\n📊 Summary:")
        print(f"   Total courses evaluated: {summary['total_courses_evaluated']}")
        print(f"   Courses with matches: {summary['courses_with_matches']}")
        print(f"   High confidence matches: {summary['high_confidence_matches']}")
        print(f"   Processing time: {summary['processing_time_seconds']}s")
        
        # Print each result
        for result in evaluation["results"]:
            print_header(f"Source: {result.source_course.course_title}")
            print(f"Category: {result.source_course.category}")
            print(f"Level: {result.source_course.course_level or 'Unknown'}")
            
            if result.missing_info_warning:
                print(f"\n⚠️  {result.missing_info_warning}")
            
            if result.top_matches:
                print(f"\n🎯 Top {len(result.top_matches)} Matches:")
                for i, match in enumerate(result.top_matches):
                    print_match(match, i)
            else:
                print("\n❌ No suitable matches found")
            
            print(f"\n📝 Notes: {result.evaluation_notes}")
        
        # Save to JSON if requested
        if output_json:
            output_data = {
                "summary": summary,
                "results": [r.model_dump() for r in evaluation["results"]],
                "warnings": evaluation["warnings"],
            }
            with open(output_json, 'w') as f:
                json.dump(output_data, f, indent=2, default=str)
            print(f"\n💾 Results saved to: {output_json}")
        
        return evaluation
        
    except Exception as e:
        print(f"\n❌ Error during evaluation: {e}")
        raise


async def list_courses(csv_path: str, university: str = None):
    """List available courses"""
    loader = CourseDataLoader(csv_path)
    loader.load()
    
    if university:
        courses = loader.get_courses_by_university(university)
        print(f"\nCourses from {university}:")
    else:
        courses = list(loader.courses.values())
        print("\nAll courses:")
    
    for course in courses:
        code = course.course_code or "N/A"
        print(f"  [{course.university}] {code}: {course.course_title[:50]}...")
        print(f"      ID: {course.file_name}")


def main():
    parser = argparse.ArgumentParser(
        description="Course Co-Pilot CLI - Transfer Credit Evaluation Tool"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Run transfer credit evaluation")
    eval_parser.add_argument("csv_path", help="Path to syllabus CSV file")
    eval_parser.add_argument(
        "--courses", "-c", 
        nargs="+", 
        help="Specific course IDs to evaluate (optional)"
    )
    eval_parser.add_argument(
        "--output", "-o",
        help="Output JSON file path (optional)"
    )
    
    # List command
    list_parser = subparsers.add_parser("list", help="List available courses")
    list_parser.add_argument("csv_path", help="Path to syllabus CSV file")
    list_parser.add_argument(
        "--university", "-u",
        help="Filter by university name"
    )
    
    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Show data statistics")
    stats_parser.add_argument("csv_path", help="Path to syllabus CSV file")
    
    args = parser.parse_args()
    
    if args.command == "evaluate":
        asyncio.run(run_evaluation(
            args.csv_path, 
            args.courses, 
            args.output
        ))
    
    elif args.command == "list":
        asyncio.run(list_courses(args.csv_path, args.university))
    
    elif args.command == "stats":
        loader = CourseDataLoader(args.csv_path)
        loader.load()
        stats = loader.get_statistics()
        print(json.dumps(stats, indent=2))
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
