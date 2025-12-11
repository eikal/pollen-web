# Pollen Web (MVP)

Upload CSV/Excel files to your Data Workspace, preview tables in the browser, and process uploads asynchronously with a worker.

## Stack
- Backend: Node.js 18, TypeScript, Express
- Frontend: Next.js 14, React 18, Tailwind CSS
- Database: PostgreSQL 15 (Docker)
- Queue: Redis 6 (Docker) + BullMQ worker

## Prerequisites
- Windows with PowerShell (commands below use PowerShell syntax)
- Node.js 18+
- Docker Desktop (for Postgres and Redis)

## Quick start (development)

### Option 1: Single command (recommended)

```powershell
.\start-dev.ps1
```

This script automatically:
- Starts Docker containers (Postgres + Redis) if not running
- Launches backend API server (port 4000)
- Launches worker process
- Launches frontend (port 3000)
- Shows combined output from all services
- Press Ctrl+C to stop everything

### Option 2: Manual step-by-step

1) Start Postgres and Redis in Docker

```powershell
cd .\backend
docker-compose up -d
```

2) Install dependencies

```powershell
# Backend deps
cd D:\pollen-web\backend
npm install

# Frontend deps
cd D:\pollen-web\frontend
npm install
```

3) Apply database migrations (optional: seed demo data)

```powershell
cd D:\pollen-web\backend
# Run migrations
.\run-migrations.ps1
# Or run with seed data
.\run-migrations.ps1 -Seed
```

You can also use the helper that waits for Postgres to be healthy, runs migrations, and can optionally start the API server:

```powershell
cd D:\pollen-web\backend
.\docker-start.ps1
# or include seed
.\docker-start.ps1 -Seed
# or also start the API server
.\docker-start.ps1 -StartAuth
```

4) Start the backend API server

```powershell
cd D:\pollen-web\backend
npm run dev    # builds TypeScript and starts auth-server.js on port 4000
```

**Role**: Handles HTTP requests (auth, uploads, table listings). Queues file processing jobs to Redis.

5) Start the worker (separate terminal)

```powershell
cd D:\pollen-web\backend
npm run dev:worker    # builds TypeScript and starts worker.js
```

**Role**: Processes background jobs from Redis queue (parses CSV/Excel, infers schema, loads data into Postgres).

6) Start the frontend (Next.js)

```powershell
cd D:\pollen-web\frontend
npm run dev    # http://localhost:3000
```

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Uploads API: http://localhost:4000/api/uploads

## MVP user flow
1. Sign up/login in the app (stores JWT locally)
2. Go to "My Data" (path: `/uploads`)
3. Upload a CSV/Excel file
4. The worker parses and loads into your schema; preview rows in the UI

## Environment variables
The backend uses these variables with sensible dev defaults (see `backend/auth-server.js` and `backend/src/services/config.ts` if present):
- PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
- REDIS_URL (defaults to `redis://localhost:6379`)
- JWT_SECRET (dev default provided)

When using Docker Compose, Postgres is available on port 5432 and Redis on 6379.

## Troubleshooting
- Postgres version mismatch (data dir was initialized by 15):
  - Compose uses `postgres:15`. If you ever switch versions or corrupt the data dir:
  ```powershell
  cd D:\pollen-web\backend
  docker-compose down -v   # WARNING: deletes all DB data
  docker-compose up -d
  ```
- Backend cannot find compiled files in `dist`:
  - Use `npm run dev` or run `npm run build` before `npm run start:auth` / `npm run start:worker`.
- CORS or auth errors in frontend:
  - Ensure backend is running on port 4000 and that you have a JWT in local storage (login via the app).

## Related Documentation
- **[BUSINESS_INTENT.md](BUSINESS_INTENT.md)** — Product vision, target audience, business principles (MUST update when scope/strategy changes)
- **[docs/business-glossary.md](docs/business-glossary.md)** — Canonical business terminology mappings
- **[docs/ai-prompts.md](docs/ai-prompts.md)** — AI assistant behavior guidelines
- **[specs/001-csv-upload-mvp/spec.md](specs/001-csv-upload-mvp/spec.md)** — Current MVP functional specification

## Keeping this README up to date
- The `scripts` in `backend/package.json` and `frontend/package.json` are the source of truth for how to run services.
- When adding new services or changing ports, update this README and add a short note under "Quick start" and "URLs".
- For DB schema changes, add a migration under `backend/migrations/` and ensure `run-migrations.ps1` applies it.
- **When business scope or product strategy changes, update `BUSINESS_INTENT.md` first, then sync this README if technical setup changes.**
