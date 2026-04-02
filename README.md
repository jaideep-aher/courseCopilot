# Course Co-Pilot

**AI-Powered Transfer Credit Evaluation System**

Course Co-Pilot helps students, academic advisors, and admissions offices evaluate transfer credit equivalency between universities. Upload a transcript PDF, pick a target school, and get AI-driven recommendations in minutes — not weeks.

## Features

- **Transcript PDF Parsing**: GPT-4o vision extracts courses from any transcript format (scanned or digital)
- **Autonomous Web Research**: AI agents search the web for course details and catalog pages in real time
- **LLM-Based Scoring**: Courses are compared on content overlap, learning outcomes, level, prerequisites, and credits
- **Re-Research Feedback Loop**: Low-confidence results are automatically re-researched for higher accuracy
- **Real-Time Progress**: SSE streaming shows each agent's live status during evaluation
- **Source Verification**: Every matched course includes a link to the official catalog page
- **React Frontend**: Clean, modern UI for uploading transcripts and viewing results

## Architecture

The system uses a **multi-agent pipeline** coordinated by an Orchestrator:

```
Transcript PDF
     │
     ▼
┌──────────────┐
│ Parser Agent │  GPT-4o vision reads all pages, extracts structured course data
└──────┬───────┘
       ▼
┌──────────────────┐
│ Research Agent   │  Autonomous web search + scraping to enrich source courses
│ (source mode)    │  and discover target equivalents
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Research Agent   │  Searches target university's catalog for equivalent courses
│ (target mode)    │
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Evaluation Agent │  LLM scores each source→target pair (0-100) on 5 dimensions
└──────┬───────────┘
       │
       ▼  low confidence?
┌──────────────────┐
│  Orchestrator    │  Re-sends to Research Agent → re-scores → finalizes
└──────────────────┘
       │
       ▼
  Recommendations (approve / review / deny)
```

### Agent Details

| Agent | Model | Tools | Job |
|-------|-------|-------|-----|
| **Parser** | GPT-4o (vision) | pdf2image, pdfplumber | Extract courses from transcript PDF pages |
| **Research** | GPT-4o-mini | web_search, scrape_webpage | Autonomously search & scrape course info |
| **Evaluation** | GPT-4o-mini | — (pure analysis) | Score course pairs on 5 dimensions |
| **Orchestrator** | — | Coordinates agents | Sequence agents, filter courses, re-research loop |

## Project Structure

```
courseCopilot/
├── api/
│   └── main.py                  # FastAPI app, routes, SSE streaming
├── core/
│   ├── agents.py                # Multi-agent system (Parser, Research, Eval, Orchestrator)
│   ├── config.py                # Pydantic settings from .env
│   ├── data_loader.py           # CSV course data loader
│   ├── matcher.py               # LLM-based similarity scoring
│   ├── pipeline.py              # TransferPipeline (wires agents to API)
│   ├── research_agent.py        # WebSearchAgent + tool implementations
│   └── catalog_cache.py         # In-memory catalog cache with TTL
├── models/
│   └── schemas.py               # Pydantic models (Course, Match, Transcript, etc.)
├── utils/
│   ├── transcript_parser.py     # PDF → structured transcript (vision + text fallback)
│   ├── catalog_scraper.py       # University catalog web scraper
│   └── converters.py            # Data format converters
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   └── TranscriptUploadPage.jsx
│   │   ├── components/transcript/
│   │   │   ├── FileUpload.jsx
│   │   │   ├── ProgressTracker.jsx
│   │   │   ├── ResultsDisplay.jsx
│   │   │   └── CourseMatchCard.jsx
│   │   ├── hooks/
│   │   │   └── useTranscriptEval.js
│   │   └── api/
│   │       └── client.js
│   ├── vite.config.js           # Vite + proxy to backend
│   └── package.json
├── data/
│   └── syllabus_dataset.csv     # Pre-loaded course dataset (304 courses)
├── requirements.txt
├── .env.example
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### 3. Start the Servers

```bash
# Terminal 1 — Backend (port 8000)
python api/main.py

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

### 4. Use It

1. Upload a transcript PDF
2. Enter the target university name (e.g. Duke, MIT, Stanford)
3. Click **Evaluate Transfer Credits**
4. Watch real-time progress as each agent works
5. Review results with scores, shared topics, differences, and catalog links

## API Endpoints

### Transcript Evaluation (Primary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pipeline/transcript-evaluate` | Evaluate transcript PDF (returns full result) |
| `POST` | `/pipeline/transcript-evaluate-stream` | Same, but with SSE progress streaming |

Both accept `multipart/form-data` with:
- `file` — transcript PDF
- `target_university` — target school name (e.g. "Duke")

### Pipeline Evaluation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pipeline/evaluate` | Evaluate manually specified courses against a target university |

### Legacy CSV-Based Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/data/load` | Load CSV dataset |
| `GET` | `/courses` | List all courses |
| `POST` | `/match/single` | Match a single course from the CSV dataset |
| `POST` | `/match/batch` | Match multiple courses |
| `POST` | `/evaluate` | Full evaluation from CSV |

## Configuration

All settings are managed via environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | **Required.** OpenAI API key |
| `SCORING_MODEL` | `gpt-4o-mini` | Model for course similarity scoring |
| `VISION_MODEL` | `gpt-4o` | Model for transcript PDF parsing |
| `RESEARCH_MODEL` | `gpt-4o-mini` | Model for web research agent |
| `TOP_N_MATCHES` | `3` | Number of top matches to return per course |
| `SIMILARITY_THRESHOLD` | `0.3` | Minimum similarity score (0-1) |
| `MAX_CONCURRENT_RESEARCH` | `2` | Parallel web research tasks |
| `RESEARCH_TIMEOUT_SECONDS` | `30` | Timeout per research call |
| `DEBUG` | `true` | Enable debug logging |

## Tech Stack

**Backend**: Python, FastAPI, OpenAI API, pdfplumber, pdf2image, BeautifulSoup, Pydantic

**Frontend**: React 19, Vite 7, Tailwind CSS 4, Axios

**AI Models**: GPT-4o (vision), GPT-4o-mini (research + scoring)

## Security Notes

- Never commit `.env` files with API keys
- Transcripts may contain PII — handle securely
- Use HTTPS in production
- CORS is configured for local development; restrict in production

## License

Internal use — ProcessMaker / Duke AIPI Capstone Project
