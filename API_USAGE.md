# Course Co-Pilot API Usage Guide

## Quick Start

1. **Start the API server:**
   ```bash
   cd course_copilot
   python -m uvicorn api.main:app --reload --port 8000
   ```

2. **Load the Duke catalog:**
   ```bash
   curl -X POST "http://localhost:8000/data/load" \
     -H "Content-Type: application/json" \
     -d '{"csv_path": "data/Dataset.csv"}'
   ```

3. **Match a custom syllabus** (most common use case):
   See examples below ↓

---

## Two Main Endpoints

### 1. `/match/custom` - Match EXTERNAL syllabi ⭐ **PRIMARY USE CASE**

**When to use:** Student submits their syllabus from another university and you want to find Duke equivalents.

**Example:**
```bash
curl -X POST "http://localhost:8000/match/custom" \
  -H "Content-Type: application/json" \
  -d '{
    "course_title": "Introduction to Data Science",
    "source_university": "Stanford",
    "target_university": "Duke",
    "course_description": "Learn data analysis, ML, and visualization with Python",
    "knowledge_points": "python; machine learning; statistics; data visualization; pandas",
    "category": "Computer Science",
    "prerequisites": "Basic programming"
  }'
```

**Response:**
```json
{
  "source_course": {
    "course_title": "Introduction to Data Science",
    "university": "Stanford"
  },
  "top_matches": [
    {
      "target_course": {
        "course_title": "Data Science Fundamentals",
        "university": "Duke"
      },
      "similarity_percentage": 85,
      "confidence_level": "high",
      "topic_overlap": ["python", "machine learning", "statistics"],
      "recommendation_rationale": "Strong match with 85% similarity..."
    }
  ],
  "best_match_found": true
}
```

### 2. `/match/single` - Match courses WITHIN the dataset

**When to use:** Both source and target courses are already in `Dataset.csv` (for testing or bulk processing).

**Example:**
```bash
curl -X POST "http://localhost:8000/match/single" \
  -H "Content-Type: application/json" \
  -d '{
    "source_course_id": "Stanford_Finance_258_123",
    "target_university": "Duke"
  }'
```

---

## Custom Syllabus Fields

### Required:
- `course_title` - Course name
- `source_university` - Where the course is from
- `target_university` - Where to transfer (usually "Duke")

### Optional (but recommended for accuracy):
- `course_description` - Detailed course description
- **`knowledge_points`** - **Semicolon-separated keywords** (most important!)
  - Example: `"python; machine learning; statistics; data visualization"`
- `category` - Department/subject (e.g., "Computer Science", "Economics")
- `prerequisites` - Required prior knowledge
- `textbooks_materials` - Books or materials used
- `course_code` - Official course code (e.g., "CS 109")

**Pro tip:** More information = better matches! The `knowledge_points` field has a **25% weight** in the matching algorithm.

---

## Python Example

```python
import requests

# Load Duke catalog
requests.post(
    "http://localhost:8000/data/load",
    json={"csv_path": "data/Dataset.csv"}
)

# Match custom syllabus
syllabus = {
    "course_title": "Intermediate Macroeconomics",
    "source_university": "Harvard",
    "target_university": "Duke",
    "course_description": "Advanced analysis of national economic systems...",
    "knowledge_points": "macroeconomics; GDP; inflation; monetary policy; fiscal policy",
    "category": "Economics",
    "prerequisites": "Principles of Economics"
}

response = requests.post(
    "http://localhost:8000/match/custom",
    json=syllabus
)

result = response.json()
if result['best_match_found']:
    best_match = result['top_matches'][0]
    print(f"Best match: {best_match['target_course']['course_title']}")
    print(f"Similarity: {best_match['similarity_percentage']}%")
```

---

## Running Demos

### Demo 1: Custom Syllabus Matching (Recommended)
```bash
python demo_custom_match.py
```
Shows how to match external syllabi against Duke catalog.

### Demo 2: Dataset-to-Dataset Matching
```bash
python demo_api.py
```
Shows how to match courses within the dataset.

---

## For Your Frontend/Website

Your teammate should use **`/match/custom`** with this workflow:

1. **Student fills out a form** with:
   - Course title ✓
   - University name ✓
   - Description (optional but recommended)
   - Topics/keywords (optional but recommended)

2. **Frontend sends POST to `/match/custom`**

3. **Display results** showing:
   - Top 3 Duke course matches
   - Similarity scores
   - Shared topics
   - Recommendation rationale

4. **Student/advisor reviews** and approves transfer credit

---

## API Documentation

Full interactive docs with all endpoints:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Testing

```bash
# Check API is running
curl http://localhost:8000/

# Health check
curl http://localhost:8000/health

# Get statistics
curl http://localhost:8000/statistics
```
