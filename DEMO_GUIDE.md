# Course Co-Pilot Demo Guide

## What You Have Now ✓

A **working transfer credit evaluation system** that:
1. Accepts **custom syllabi** from students (any university)
2. Matches them against **Duke's course catalog** (260 courses from 5 universities)
3. Returns **top 3 similar courses** with similarity scores and explanations
4. Uses **local ML models** - no external API costs!

---

## The Two Main Use Cases

### Use Case 1: Students Submit Their Syllabi ⭐ **MAIN USE CASE**

**Endpoint:** `POST /match/custom`

**What it does:** Student provides their course information → System finds matching Duke courses

**Example Request:**
```json
{
  "course_title": "Introduction to Machine Learning",
  "source_university": "Stanford",
  "target_university": "Duke",
  "course_description": "ML fundamentals including supervised/unsupervised learning and neural networks",
  "knowledge_points": "machine learning; supervised learning; unsupervised learning; neural networks",
  "category": "Computer Science",
  "prerequisites": "Linear algebra, programming"
}
```

**When to use:** This is what your website will use! Students fill out a form, your frontend sends this request, and you show them the Duke course matches.

---

### Use Case 2: Match Courses Within the Dataset

**Endpoint:** `POST /match/single`

**What it does:** Match courses that are already in `Dataset.csv` against each other

**Example:**
```json
{
  "source_course_id": "Stanford_Finance_258",
  "target_university": "Duke"
}
```

**When to use:** For testing, demos, or batch processing courses already in your database.

---

##How to Run Everything

### 1. Start the API Server
```bash
cd course_copilot
python -m uvicorn api.main:app --reload --port 8000
```

### 2. Test Custom Matching (Primary Use Case)
```bash
python demo_custom_match.py
```

### 3. View API Documentation
Open in browser: http://localhost:8000/docs

---

## For Your Demo

### Quick Demo Script:

1. **Show the dataset:**
   ```bash
   python standalone.py data/Dataset.csv --stats
   ```
   *"We have 260 courses from 5 universities including Duke, Harvard, Stanford..."*

2. **Show custom syllabus matching:**
   ```bash
   python demo_custom_match.py
   ```
   *"A student submits their Stanford course → We find Duke equivalents"*

3. **Show the API docs:**
   Open http://localhost:8000/docs
   *"Your teammate can integrate this with the website easily"*

4. **Explain the algorithm:**
   - Semantic similarity (40%) - meaning and context
   - Keyword matching (20%) - specific terms
   - Knowledge points (25%) - structured topics ← **NEW!**
   - Rules (15%) - course level, category, prerequisites
   - **No API costs** - everything runs locally!

---

## Important Technical Details

### The Matching Algorithm

```
Final Score =
  40% × Semantic Similarity (sentence embeddings)
+ 20% × Keyword Similarity (TF-IDF)
+ 25% × Knowledge Points Overlap (structured keywords) ← Enhanced!
+ 15% × Structural Rules (category, level, prerequisites)
```

### Similarity Thresholds
- **80%+** = Strong match → Recommended for full credit
- **60-79%** = Moderate match → May qualify for partial credit
- **<60%** = Limited similarity → Not recommended

### Model Details
- **Sentence Transformer:** all-MiniLM-L6-v2 (~80MB)
- **Runs locally** on CPU (no GPU needed)
- **Processing time:** ~0.5-1s per course
- **No API keys required!**

---

## What Your Teammate Needs

### Backend API Endpoints

**1. Load Data (call once on startup):**
```
POST /data/load
{
  "csv_path": "data/Dataset.csv"
}
```

**2. Match Custom Syllabus (main endpoint):**
```
POST /match/custom
{
  "course_title": "...",
  "source_university": "...",
  "course_description": "...",
  "knowledge_points": "...",
  ...
}
```

**3. Health Check:**
```
GET /health
```

### Frontend Flow

```
Student Form → Collect course info → POST /match/custom → Display top 3 matches
```

### Example Integration (JavaScript/React):
```javascript
async function matchCourse(syllabusData) {
  const response = await fetch('http://localhost:8000/match/custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_title: syllabusData.title,
      source_university: syllabusData.university,
      course_description: syllabusData.description,
      knowledge_points: syllabusData.topics.join('; '),
      category: syllabusData.category,
      target_university: 'Duke'
    })
  });

  const result = await response.json();

  // Display top matches
  result.top_matches.forEach(match => {
    console.log(match.target_course.course_title);
    console.log(match.similarity_percentage + '%');
    console.log(match.recommendation_rationale);
  });
}
```

---

## Files Overview

### Core Files
- `api/main.py` - FastAPI backend (your teammate uses this)
- `local_matcher.py` - Matching algorithm
- `data/Dataset.csv` - Duke catalog + comparison data (260 courses)

### Demo/Test Files
- `demo_custom_match.py` - Test custom syllabus matching ⭐
- `demo_api.py` - Test dataset-to-dataset matching
- `standalone.py` - CLI tool for quick testing

### Documentation
- `API_USAGE.md` - API endpoint documentation
- `ENHANCEMENTS.md` - Technical details of the algorithm
- `DEMO_GUIDE.md` - This file!

---

## Troubleshooting

### "No matches found"
- Check if the target university has courses loaded
- Lower the similarity threshold (currently 30%)
- Provide more syllabus details (especially `knowledge_points`)

### "Data not loaded"
- Call `POST /data/load` before matching
- Server resets on restart, need to reload data

### Model loading slow
- First request is slow (loads ML model ~80MB)
- Subsequent requests are fast (model cached)
- Consider preloading on server startup

---

## Next Steps for Production

1. **Deploy the API** (AWS/GCP/Azure)
2. **Add authentication** (API keys for your frontend)
3. **Cache results** (Redis for common queries)
4. **Batch processing** (handle multiple syllabi at once)
5. **Admin dashboard** (manage courses, view analytics)
6. **Email notifications** (send results to advisors)

---

## Questions for Demo

**Q: How accurate is it?**
A: Conservative but accurate - uses structured keywords (100% coverage), semantic embeddings, and rule-based scoring. Better at avoiding false positives than LLM-based approaches.

**Q: Why not use ChatGPT/Claude API?**
A: Manager requirement - no external costs. Our in-house system is free, fast, and works offline!

**Q: Can it handle other universities?**
A: Yes! Dataset includes Harvard, Stanford, UC Berkeley. Easy to add more universities.

**Q: What if course info is incomplete?**
A: System works with minimal info (just title) but accuracy improves with more details (description, topics, prerequisites).

**Q: Can advisors override recommendations?**
A: Yes - system provides recommendations, but final approval is manual (show in your UI).

---

## Contact / Support

- API Documentation: http://localhost:8000/docs
- GitHub Issues: (add your repo link)
- Team Lead: (your name/contact)

---

**Good luck with your demo! 🎓**
