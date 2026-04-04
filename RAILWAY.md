# Deploying Course Co-Pilot on Railway

## Option A — Single service (Dockerfile)

This repo ships a **Dockerfile** that builds the React app and runs **one** Python process: the UI at `/` and FastAPI under **`/api`** (same layout as local Vite’s `/api` proxy).

1. Create a **new project** on Railway → **Deploy from GitHub** → select `courseCopilot`.
2. Root `railway.toml` uses **DOCKERFILE** (no Railpack needed for this path).
3. Set **environment variables** (at least `OPENAI_API_KEY` for the transcript pipeline).
4. Open your **public URL** — SPA and `/api/docs` load on the same host.

**Health check:** `GET /health` (see `railway.toml`). Detailed API health: `GET /api/health`.

## Option B — Two services (matches `render.yaml`)

When you want **separate** API and frontend URLs (e.g. Railpack for API only):

1. **API service** — repository **root** as service root. Use Railpack or set start command to  
   `uvicorn api.main:app --host 0.0.0.0 --port $PORT`  
   Set `OPENAI_API_KEY` and other vars from `.env.example`.

2. **Frontend service** — service root **`frontend`** (important so Railpack does not pick Python at repo root).  
   Use `frontend/railway.toml`: build is **`npm run build` only** (avoid a second `npm ci` or Vite can hit `EBUSY` on `node_modules/.vite`). Start with `npm run start` (serves `dist/`).  
   Set **`VITE_API_URL`** on the **frontend** service **before** deploy — Vite inlines it at **build** time. Use your public API base URL with **no trailing slash** (see `frontend/src/api/client.js`). For a dedicated API service (routes at `/pipeline/...` on the host root), use `https://your-api.up.railway.app`. Wrong or missing values often show up as SSE failing and the UI falling back to a long non-streaming request.

3. **API service CORS** — On the **API** service, set **`CORS_ALLOWED_ORIGINS`** to your frontend public URL(s), comma-separated (e.g. `https://your-app.up.railway.app,http://localhost:5173`). This avoids invalid `*` + credentials behavior and keeps cross-origin `fetch`/axios working. Omit it only if you are fine with allow-all and no credentialed cookie CORS.

**Health checks:** API `GET /health`; frontend `GET /` (see `frontend/railway.toml`).

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No | Railway sets automatically for the API service. |
| `OPENAI_API_KEY` | For transcript / research | Pipeline and agents (`core.config`). |
| `DEBUG` | No | Use `false` in production. |
| `DEFAULT_CSV_PATH` | No | CSV inside container; default `data/syllabus_dataset.csv`. |
| `VITE_API_URL` | Split frontend only | Baked in at **build**; browser → API origin (no trailing slash). |
| `CORS_ALLOWED_ORIGINS` | Split API recommended | Comma-separated frontend URL(s); see Option B step 3. |
| `VITE_SUPABASE_*` | Optional | Student/coordinator workflows (see `frontend/.env.example`). |

Optional tuning: `TOP_N_MATCHES`, `SIMILARITY_THRESHOLD`, model names — see `core/config.py`.

### Hugging Face / sentence-transformers

First request may download embedding weights. Set `HF_HOME` or `TRANSFORMERS_CACHE` if you use a Railway volume.

## Troubleshooting

- **“No start command detected”** — Match **root directory** to service type (repo root vs `frontend`), or set Start Command in the UI to match `railway.toml`.
- **`EBUSY: rmdir ... node_modules/.vite`** — Frontend build must be **`npm run build` only**, not `npm ci` again before build.

## Custom domain

Railway → **Settings → Networking**; point DNS as instructed. Same-origin `/api` needs no extra app config; split deploy needs `VITE_API_URL` set to the API host.
