# Course Co-Pilot

**AI-Powered Transfer Credit Evaluation System**

Course Co-Pilot is a tool that helps university transfer credit evaluators quickly assess course equivalency between institutions. It uses LLM-based summarization and similarity matching to compare courses and provide ranked recommendations with explanations.

## 🎯 Features

- **Course Data Loading**: Parse structured syllabus data from CSV files
- **LLM Summarization**: Generate standardized course summaries using Claude or GPT
- **Similarity Matching**: Compare source courses against target university catalog
- **Ranked Recommendations**: Get top 3 matches with similarity scores
- **Explanation Generation**: Understand why courses are considered equivalent
- **Missing Info Detection**: Flag courses with incomplete information
- **REST API**: FastAPI-based API for frontend integration
- **CLI Tool**: Command-line interface for testing and batch processing

## 📁 Project Structure

```
course_copilot/
├── api/
│   ├── __init__.py
│   └── main.py              # FastAPI application
├── core/
│   ├── __init__.py
│   ├── config.py            # Configuration settings
│   ├── data_loader.py       # CSV parsing and course loading
│   ├── llm_client.py        # LLM client abstraction
│   ├── matcher.py           # Similarity matching engine
│   └── summarizer.py        # Course summarization
├── models/
│   ├── __init__.py
│   └── schemas.py           # Pydantic data models
├── utils/
│   └── __init__.py
├── data/                    # Place your CSV files here
├── cli.py                   # Command-line interface
├── demo.py                  # Demo script
├── requirements.txt         # Python dependencies
├── .env.example             # Environment template
└── README.md
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone/copy the project
cd course_copilot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
# ANTHROPIC_API_KEY=sk-ant-...
# or
# OPENAI_API_KEY=sk-...
```

### 3. Prepare Data

Place your syllabus CSV file in the `data/` directory. The CSV should have these columns:
- `university` - University name (e.g., "Houston", "Duke")
- `category` - Department/category
- `file_name` - Unique identifier for the course
- `course_title` - Course name
- `course_description_summary` - Course description
- `knowledge_points` - Topics/learning outcomes
- `prerequisites` - Prerequisites
- `textbooks_materials` - Required materials
- `grading_scale` - Grading information
- `assignments_summary` - Assignment details
- `weekly_schedule_highlights` - Schedule/topics by week

### 4. Run the API

```bash
# Start the FastAPI server
python -m uvicorn api.main:app --reload --port 8000

# API will be available at:
# - http://localhost:8000 (root)
# - http://localhost:8000/docs (Swagger UI)
# - http://localhost:8000/redoc (ReDoc)
```

### 5. Use the CLI

```bash
# List available courses
python cli.py list data/syllabus_dataset.csv

# List courses from specific university
python cli.py list data/syllabus_dataset.csv --university Houston

# Run evaluation
python cli.py evaluate data/syllabus_dataset.csv

# Evaluate specific courses
python cli.py evaluate data/syllabus_dataset.csv --courses "AAS 2320..." "ACCT 2301..."

# Save results to JSON
python cli.py evaluate data/syllabus_dataset.csv --output results.json

# View statistics
python cli.py stats data/syllabus_dataset.csv
```

## 📡 API Endpoints

### General
- `GET /` - API information
- `GET /health` - Health check
- `GET /statistics` - Data statistics

### Data Management
- `POST /data/load` - Load CSV file
  ```json
  {"csv_path": "data/syllabus_dataset.csv"}
  ```

### Courses
- `GET /courses` - List all courses
- `GET /courses/source` - List source (Houston) courses
- `GET /courses/target` - List target (Duke) courses
- `GET /courses/{course_id}` - Get course details

### Matching
- `POST /match/single` - Match single course
  ```json
  {
    "source_course_id": "AAS 2320 20153 Intro...",
    "target_university": "Duke"
  }
  ```

- `POST /match/batch` - Match multiple courses
  ```json
  {
    "source_course_ids": ["course1", "course2"],
    "target_university": "Duke"
  }
  ```

- `POST /evaluate` - Full evaluation
  ```json
  {
    "source_courses": ["course1", "course2"],
    "target_university": "Duke"
  }
  ```

## 🔧 Programmatic Usage

```python
import asyncio
from core.data_loader import CourseDataLoader
from core.matcher import SimilarityEngine

async def main():
    # Load data
    loader = CourseDataLoader("data/syllabus_dataset.csv")
    loader.load()
    
    # Get courses
    source_courses = loader.get_source_courses("Houston")
    target_courses = loader.get_target_courses("Duke")
    
    # Initialize engine
    engine = SimilarityEngine()
    
    # Evaluate
    results = await engine.evaluate_transfer(source_courses, target_courses)
    
    # Process results
    for result in results["results"]:
        print(f"Source: {result.source_course.course_title}")
        for match in result.top_matches:
            print(f"  -> {match.target_course.course_title}: {match.similarity_percentage}%")

asyncio.run(main())
```

## 📊 Output Format

Match results include:

```json
{
  "source_course": {
    "course_id": "AAS 2320...",
    "course_title": "Intro To African American Studies",
    "university": "Houston",
    "category": "African_American_Studies",
    "main_topics": ["culture", "african american", "history"],
    "learning_outcomes": ["Understand key theories", "..."],
    "course_level": "introductory",
    "missing_fields": []
  },
  "top_matches": [
    {
      "target_course": {...},
      "similarity_score": 0.85,
      "similarity_percentage": 85,
      "topic_overlap": ["culture", "history"],
      "learning_outcome_alignment": ["Critical analysis skills"],
      "key_differences": ["Different regional focus"],
      "recommendation_rationale": "Both courses provide foundational...",
      "confidence_level": "high"
    }
  ],
  "best_match_found": true,
  "evaluation_notes": "Strong match found in target catalog.",
  "missing_info_warning": null
}
```

## ⚙️ Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | anthropic | LLM provider (anthropic/openai) |
| `LLM_MODEL` | claude-sonnet-4-20250514 | Model to use |
| `LLM_TEMPERATURE` | 0.3 | Response randomness (0-1) |
| `TOP_N_MATCHES` | 3 | Number of matches to return |
| `SIMILARITY_THRESHOLD` | 0.5 | Minimum similarity score |

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=core --cov=api
```

## 🔐 Security Notes

- Never commit `.env` files with API keys
- Transcripts may contain PII - handle securely
- Use HTTPS in production
- Configure CORS appropriately

## 📝 Architecture Notes

The system uses **LLM summarization** approach:
1. Load course data from CSV
2. Generate standardized summaries using LLM
3. Compare all source courses against target catalog in single LLM call
4. Parse structured JSON responses for matches
5. Return ranked results with explanations

Alternative approaches (RAG, embeddings) can be added to `core/matcher.py` if needed.

## 🤝 Integration with ProcessMaker

This is a standalone Python microservice. The frontend team should:
1. Call `POST /data/load` on startup
2. Use `POST /match/single` or `POST /match/batch` for evaluations
3. Display results with similarity scores and rationales

## 📄 License

Internal use - ProcessMaker / Duke AIPI Capstone Project
