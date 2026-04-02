#!/usr/bin/env python3
"""
Course Co-Pilot - Standalone Version (In-House Matching)

Single-file CLI for transfer credit evaluation using local ML models.
No external API calls — uses sentence-transformers + TF-IDF + knowledge points.

Usage:
    python standalone.py                                    # Uses default dataset
    python standalone.py data/syllabus_dataset.csv          # Custom path
    python standalone.py --courses "course_id_1" "course_id_2"
    python standalone.py --list
    python standalone.py --stats
    python standalone.py --source Houston --target Duke
"""
import pandas as pd
import json
import os
import re
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any


# ============== Data Models ==============

@dataclass
class Course:
    """Structured course information"""
    university: str
    category: str
    file_name: str
    course_title: str
    instructor_name: Optional[str] = None
    instructor_email: Optional[str] = None
    course_description: Optional[str] = None
    knowledge_points: Optional[str] = None
    prerequisites: Optional[str] = None
    textbooks_materials: Optional[str] = None
    grading_scale: Optional[str] = None
    assignments_summary: Optional[str] = None
    weekly_schedule: Optional[str] = None
    course_code: Optional[str] = None


@dataclass
class SimilarityMatch:
    """A course match with similarity details"""
    target_course_id: str
    target_course_title: str
    similarity_score: float
    topic_overlap: List[str] = field(default_factory=list)
    key_differences: List[str] = field(default_factory=list)
    recommendation_rationale: str = ""
    confidence_level: str = "medium"


@dataclass
class MatchResult:
    """Complete matching result for a source course"""
    source_course_id: str
    source_course_title: str
    top_matches: List[SimilarityMatch] = field(default_factory=list)
    evaluation_notes: str = ""
    missing_info_warning: Optional[str] = None


# ============== Data Loader ==============

class CourseDataLoader:
    """Load and process course data from CSV"""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.df: Optional[pd.DataFrame] = None
        self.courses: Dict[str, Course] = {}
    
    def load(self) -> pd.DataFrame:
        """Load CSV into DataFrame"""
        self.df = pd.read_csv(self.csv_path)
        self._parse_courses()
        return self.df
    
    def _clean_text(self, text) -> Optional[str]:
        """Clean text fields"""
        if pd.isna(text) or str(text) == "..." or str(text) == "":
            return None
        text = re.sub(r'\s+', ' ', str(text).strip())
        text = re.sub(r'https?://\S+', '', text)
        return text if text else None
    
    def _extract_course_code(self, title: str) -> Optional[str]:
        """Extract course code from title"""
        match = re.match(r'^([A-Z]{2,4}\s*\d{3,4}[A-Z]?)', str(title))
        return match.group(1).strip() if match else None
    
    def _parse_courses(self):
        """Parse rows into Course objects"""
        for idx, row in self.df.iterrows():
            # Skip rows with missing critical fields
            if pd.isna(row.get('university')) or pd.isna(row.get('course_title')):
                continue

            # Create unique ID (handle duplicate file_names in new dataset)
            file_name = str(row.get('file_name', ''))
            university = str(row.get('university', ''))
            course_title = str(row.get('course_title', ''))

            # If file_name is generic/duplicate, create unique ID
            if file_name in ['OPEN_SYLLABUS_API', 'PDF_NOT_FOUND', '', 'nan']:
                unique_id = f"{university}_{course_title}_{idx}"
            else:
                unique_id = file_name

            course = Course(
                university=university,
                category=str(row.get('category', '')) if pd.notna(row.get('category')) else '',
                file_name=unique_id,  # Use unique ID
                course_title=self._clean_text(row.get('course_title', '')) or '',
                instructor_name=self._clean_text(row.get('instructor_name')),
                instructor_email=self._clean_text(row.get('instructor_email')),
                course_description=self._clean_text(row.get('course_description_summary')),
                knowledge_points=self._clean_text(row.get('knowledge_points')),
                prerequisites=self._clean_text(row.get('prerequisites')),
                textbooks_materials=self._clean_text(row.get('textbooks_materials')),
                grading_scale=self._clean_text(row.get('grading_scale')),
                assignments_summary=self._clean_text(row.get('assignments_summary')),
                weekly_schedule=self._clean_text(row.get('weekly_schedule_highlights')),
            )
            course.course_code = self._extract_course_code(course.course_title)
            self.courses[unique_id] = course
    
    def get_courses_by_university(self, university: str) -> List[Course]:
        """Get courses for a university"""
        return [c for c in self.courses.values()
                if isinstance(c.university, str) and c.university.lower() == university.lower()]
    
    def get_source_courses(self, source: str = "Houston") -> List[Course]:
        return self.get_courses_by_university(source)
    
    def get_target_courses(self, target: str = "Duke") -> List[Course]:
        return self.get_courses_by_university(target)
    
    def get_statistics(self) -> Dict:
        """Get data statistics"""
        universities = {}
        categories = {}
        for c in self.courses.values():
            universities[c.university] = universities.get(c.university, 0) + 1
            categories[c.category] = categories.get(c.category, 0) + 1
        return {
            "total_courses": len(self.courses),
            "by_university": universities,
            "by_category": categories,
        }


# ============== Similarity Matching Engine ==============

class SimilarityMatcher:
    """
    Matches source courses against target courses using local ML models.
    No external API calls - everything runs in-house.
    """

    def __init__(self, top_n: int = 3):
        from local_matcher import LocalCourseMatcher
        self.matcher = LocalCourseMatcher(
            model_name="all-mpnet-base-v2",
            semantic_weight=0.30,
            keyword_weight=0.15,
            knowledge_points_weight=0.15,
            description_overlap_weight=0.15,
            structural_weight=0.25,
        )
        self.top_n = top_n

    def find_matches(self, source: Course, targets: List[Course]) -> MatchResult:
        """Find top matches for a source course using local algorithm"""

        try:
            # Use local matcher
            matches_data = self.matcher.find_matches(
                source,
                targets,
                top_n=self.top_n,
                min_score=0.3
            )

            # Convert to expected format
            matches = []
            for match_data in matches_data:
                target = match_data["target_course"]
                score = match_data["score"]

                matches.append(SimilarityMatch(
                    target_course_id=target.file_name,
                    target_course_title=target.course_title,
                    similarity_score=score.final_score,
                    topic_overlap=score.topic_overlap,
                    key_differences=score.key_differences,
                    recommendation_rationale=score.rationale,
                    confidence_level=score.confidence,
                ))

            # Generate warning for missing info
            missing_warning = None
            missing_fields = []
            if not source.course_description:
                missing_fields.append("description")
            if not source.knowledge_points:
                missing_fields.append("learning outcomes")
            if missing_fields:
                missing_warning = f"Limited source info ({', '.join(missing_fields)}) may affect accuracy"

            # Generate evaluation notes
            if matches:
                best_score = matches[0].similarity_score
                if best_score >= 0.8:
                    eval_notes = f"Strong match found with {int(best_score * 100)}% similarity. High confidence in equivalency."
                elif best_score >= 0.6:
                    eval_notes = f"Moderate matches found. Review recommended for partial credit consideration."
                else:
                    eval_notes = f"Limited similarity detected. May not qualify for direct equivalency."
            else:
                eval_notes = "No suitable matches found in target catalog."

            return MatchResult(
                source_course_id=source.file_name,
                source_course_title=source.course_title,
                top_matches=matches,
                evaluation_notes=eval_notes,
                missing_info_warning=missing_warning,
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return MatchResult(
                source_course_id=source.file_name,
                source_course_title=source.course_title,
                top_matches=[],
                evaluation_notes=f"Error during matching: {str(e)}",
            )

    def batch_match(self, sources: List[Course], targets: List[Course]) -> List[MatchResult]:
        """Match multiple source courses against target catalog"""
        results = []
        total = len(sources)

        for i, source in enumerate(sources, 1):
            print(f"  [{i}/{total}] Matching: {source.course_title[:45]}...")
            result = self.find_matches(source, targets)
            results.append(result)

        return results


# ============== Main Interface ==============

class CourseCopilot:
    """Main interface for Course Co-Pilot"""

    def __init__(self, csv_path: str):
        self.loader = CourseDataLoader(csv_path)
        self.loader.load()
        self.matcher = SimilarityMatcher()
    
    def evaluate_transfer(
        self, 
        source_university: str = "Houston",
        target_university: str = "Duke",
        source_ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Run complete transfer credit evaluation
        
        Args:
            source_university: University student is transferring FROM
            target_university: University student is transferring TO  
            source_ids: Specific course IDs to evaluate (optional, evaluates all if None)
        
        Returns:
            Complete evaluation results with matches and statistics
        """
        # Get courses
        source_courses = self.loader.get_source_courses(source_university)
        target_courses = self.loader.get_target_courses(target_university)
        
        # Filter if specific IDs provided
        if source_ids:
            source_courses = [c for c in source_courses if c.file_name in source_ids]
        
        if not source_courses:
            return {"error": f"No source courses found for {source_university}"}
        if not target_courses:
            return {"error": f"No target courses found for {target_university}"}
        
        print(f"\n🔍 Evaluating {len(source_courses)} courses against {len(target_courses)} target courses...")
        print("-" * 50)
        
        # Run matching
        results = self.matcher.batch_match(source_courses, target_courses)
        
        # Compile summary statistics
        matches_found = sum(1 for r in results if r.top_matches)
        high_confidence = sum(
            1 for r in results 
            if r.top_matches and r.top_matches[0].similarity_score >= 0.8
        )
        
        return {
            "source_university": source_university,
            "target_university": target_university,
            "total_evaluated": len(source_courses),
            "matches_found": matches_found,
            "high_confidence_matches": high_confidence,
            "results": [asdict(r) for r in results],
        }
    
    def evaluate_single(self, source_id: str, target_university: str = "Duke") -> Dict:
        """Evaluate a single source course"""
        source = self.loader.courses.get(source_id)
        if not source:
            return {"error": f"Course not found: {source_id}"}
        
        targets = self.loader.get_target_courses(target_university)
        if not targets:
            return {"error": f"No target courses for: {target_university}"}
        
        result = self.matcher.find_matches(source, targets)
        return asdict(result)
    
    def list_courses(self, university: Optional[str] = None) -> List[Dict]:
        """List available courses"""
        if university:
            courses = self.loader.get_courses_by_university(university)
        else:
            courses = list(self.loader.courses.values())
        
        return [
            {
                "id": c.file_name, 
                "title": c.course_title, 
                "code": c.course_code, 
                "university": c.university,
                "category": c.category,
            }
            for c in courses
        ]
    
    def get_stats(self) -> Dict:
        """Get data statistics"""
        return self.loader.get_statistics()


# ============== CLI ==============

def print_results(evaluation: Dict):
    """Pretty print evaluation results"""
    print("\n" + "=" * 60)
    print(" TRANSFER CREDIT EVALUATION RESULTS")
    print("=" * 60)
    
    print(f"\n📊 Summary:")
    print(f"   From: {evaluation['source_university']}")
    print(f"   To:   {evaluation['target_university']}")
    print(f"   Courses evaluated: {evaluation['total_evaluated']}")
    print(f"   Matches found: {evaluation['matches_found']}")
    print(f"   High confidence (80%+): {evaluation['high_confidence_matches']}")
    
    for result in evaluation['results']:
        print("\n" + "-" * 60)
        print(f"📚 SOURCE: {result['source_course_title']}")
        print(f"   ID: {result['source_course_id']}")
        
        if result['missing_info_warning']:
            print(f"   ⚠️  {result['missing_info_warning']}")
        
        if result['top_matches']:
            print(f"\n   🎯 TOP {len(result['top_matches'])} MATCHES:")
            for i, match in enumerate(result['top_matches'], 1):
                score_pct = int(match['similarity_score'] * 100)
                conf = match['confidence_level'].upper()
                
                print(f"\n   {i}. {match['target_course_title']}")
                print(f"      Similarity: {score_pct}% | Confidence: {conf}")
                
                if match['topic_overlap']:
                    topics = ', '.join(match['topic_overlap'][:5])
                    print(f"      Shared Topics: {topics}")
                
                if match['key_differences']:
                    diffs = ', '.join(match['key_differences'][:3])
                    print(f"      Differences: {diffs}")
                
                if match['recommendation_rationale']:
                    rationale = match['recommendation_rationale'][:150]
                    print(f"      Rationale: {rationale}...")
        else:
            print("\n   ❌ No suitable matches found in target catalog")
        
        if result['evaluation_notes']:
            print(f"\n   📝 Notes: {result['evaluation_notes'][:200]}")
    
    print("\n" + "=" * 60)


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Course Co-Pilot - In-House Transfer Credit Evaluation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python standalone.py                                     # Uses default dataset
  python standalone.py data/syllabus_dataset.csv           # Custom path
  python standalone.py --courses "course_id_1"
  python standalone.py --list
  python standalone.py --stats
        """
    )

    parser.add_argument("csv_path", nargs="?", default="data/syllabus_dataset.csv",
                       help="Path to syllabus CSV file (default: data/syllabus_dataset.csv)")
    parser.add_argument("--courses", "-c", nargs="+",
                       help="Specific course IDs to evaluate")
    parser.add_argument("--output", "-o",
                       help="Save results to JSON file")
    parser.add_argument("--list", "-l", action="store_true",
                       help="List courses only")
    parser.add_argument("--stats", "-s", action="store_true",
                       help="Show statistics only")
    parser.add_argument("--source", default="Houston",
                       help="Source university (default: Houston)")
    parser.add_argument("--target", default="Duke",
                       help="Target university (default: Duke)")

    args = parser.parse_args()

    # Commands that don't need matching
    if args.list or args.stats:
        loader = CourseDataLoader(args.csv_path)
        loader.load()
        
        if args.stats:
            stats = loader.get_statistics()
            print(json.dumps(stats, indent=2))
        else:
            print(f"\n{'='*60}")
            print(" AVAILABLE COURSES")
            print(f"{'='*60}\n")
            
            for uni in sorted(set(c.university for c in loader.courses.values())):
                courses = loader.get_courses_by_university(uni)
                print(f"\n📚 {uni} ({len(courses)} courses):")
                for c in courses[:10]:  # Show first 10
                    code = c.course_code or "N/A"
                    print(f"   [{code}] {c.course_title[:50]}")
                    print(f"       ID: {c.file_name}")
                if len(courses) > 10:
                    print(f"   ... and {len(courses)-10} more")
        return
    
    # Full evaluation
    try:
        print("\n🚀 Starting Course Co-Pilot (In-House Matching)...")
        copilot = CourseCopilot(args.csv_path)

        evaluation = copilot.evaluate_transfer(
            source_university=args.source,
            target_university=args.target,
            source_ids=args.courses,
        )

        if "error" in evaluation:
            print(f"\n❌ Error: {evaluation['error']}")
            return

        print_results(evaluation)

        if args.output:
            with open(args.output, 'w') as f:
                json.dump(evaluation, f, indent=2)
            print(f"\n💾 Results saved to: {args.output}")

    except ImportError as e:
        print(f"\n❌ Missing dependency: {e}")
        print("\nInstall required packages:")
        print("  pip install sentence-transformers scikit-learn")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
