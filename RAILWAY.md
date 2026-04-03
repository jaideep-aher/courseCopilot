# Deploying on Railway

This repo is a **monorepo** (FastAPI backend at the root + Vite app under `frontend/`). [Railpack](https://railpack.com) needs an explicit **start command** when it detects Python or Node.

## Option A — Two services (matches `render.yaml`)

1. **API service**  
   - **Root directory:** `/` (repository root)  
   - Root `railway.toml` / `railpack.json` / `Procfile` set:  
     `uvicorn api.main:app --host 0.0.0.0 --port $PORT`  
   - Set `OPENAI_API_KEY` (and any other vars from `.env.example`) in Railway variables.

2. **Frontend service**  
   - **Root directory:** `frontend` (important — otherwise Railpack sees Python at the repo root and mis-detects the service).  
   - Uses `frontend/railway.toml`: Railpack runs `npm ci` first; build step is only `npm run build` (avoid a second `npm ci` or Vite’s cache can cause `EBUSY` on `node_modules/.vite`). Start with `npm run start` (serves `dist/` with `serve`).  
   - Set `VITE_API_URL` to your public API URL (e.g. `https://your-api.up.railway.app`) so the browser calls the backend.

## Option B — One service

Use a single Docker-based or custom build that installs Python + Node, builds the SPA, and runs one process. This repo does not ship that by default; Option A is the intended layout.

## Health checks

- API: `GET /health` (configured in root `railway.toml`).  
- Frontend: `GET /` (configured in `frontend/railway.toml`).

## Troubleshooting

- **“No start command detected”** — Ensure the service **root directory** matches the service type (root for API, `frontend` for the static UI), or set **Start Command** manually in the Railway UI to the same values as in `railway.toml`.
- **`EBUSY: rmdir ... node_modules/.vite`** — Usually from running `npm ci` twice (Railpack install + custom build). The frontend `buildCommand` must be `npm run build` only.
