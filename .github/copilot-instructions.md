# Pollen Web - AI Coding Assistant Guide

**Last Updated**: 2025-12-11  
**Project**: Self-service data platform for CSV/Excel uploads → PostgreSQL tables

## Stack Overview
- **Backend**: Node.js 18 + TypeScript 5 + Express 4.x (port 4000)
- **Frontend**: React 18 + Vite (port 3000) - NOT Next.js despite references
- **Database**: PostgreSQL 15 (Docker) with per-user schema isolation (`user_<uuid>`)
- **Queue**: Redis 6 + BullMQ (async file processing)
- **Auth**: JWT-based with bcrypt password hashing

## Architecture: Request-Response + Background Jobs

**Two-Process Model**:
1. **[auth-server.js](backend/auth-server.js)**: Express API server
   - Handles HTTP requests (auth, file uploads, table queries)
   - Enqueues jobs to Redis via [job-processor.ts](backend/src/services/job-processor.ts)
   - Returns `202 Accepted` with `sessionId` for async operations

2. **[worker.js](backend/worker.js)**: BullMQ worker
   - Processes background jobs (CSV/Excel parsing, schema inference, data loading)
   - Concurrency: 5 jobs, 3 retries with exponential backoff
   - Updates `upload_sessions` table with progress

**Data Isolation**: Each user gets a PostgreSQL schema (`user_abc123`) managed by [schema-service.ts](backend/src/services/schema-service.ts). All tables created in user's isolated schema.

**File Upload Flow**:
```
POST /api/uploads → multer saves file → enqueue job → return 202
                ↓
Worker picks job → parse CSV/Excel → infer types → CREATE TABLE → COPY data
                ↓
Update session status → client polls GET /api/uploads/:sessionId
```

## Business-First Language (CRITICAL)

**Target Audience**: Non-technical business users who don't know SQL or database administration.

**Terminology Rules** (from [business-glossary.md](../docs/business-glossary.md)):
- Use "Data Workspace" NOT "Instance" or "DWH"
- Use "Data Flow" NOT "ETL Pipeline" or "ETL Job"
- Use "Setting up..." NOT "Provisioning"
- Use "Records" or "Items" NOT "Rows processed"
- NEVER show technical status codes in UI - translate to business language

**Error Message Pattern**: State problem in business terms + actionable next step
```typescript
// ❌ BAD: "Connection failed: authentication error"
// ✅ GOOD: "Your database needs reconnection. Click here to update your password."
```

See [business-glossary.md](../docs/business-glossary.md) for complete term mapping.

## Project Structure

```text
backend/
├── auth-server.js      # Express API server (port 4000) - main HTTP endpoint
├── worker.js           # BullMQ background worker (separate process)
├── src/
│   ├── api/            # Express routes: uploads.ts, quota.ts, data-access.ts
│   ├── services/       # job-processor.ts, schema-service.ts, file-parser.ts
│   ├── middleware/     # auth.ts (JWT), upload-limits.ts (multer)
│   └── models/         # UploadSession.ts, Table.ts (DB query helpers)
├── migrations/         # SQL schema migrations (run with run-migrations.ps1)
└── tests/              # Jest tests (adapter.test.js, etl.test.js)

frontend/
├── src/App.tsx         # Main React app (Vite, NOT Next.js)
├── components/         # UploadWizard, TableList, DataAccessPanel, etc.
└── lib/                # auth.ts, api/ (fetch wrappers)

docs/
├── business-glossary.md   # Business ↔ technical term mappings (REFERENCE THIS)
├── ai-prompts.md          # AI assistant behavior guide
└── mvp-use-cases.md       # User scenarios with acceptance criteria
```

## Commands

**Quick Start (PowerShell)**:
```powershell
.\start-dev.ps1       # Starts Docker, backend, worker, frontend in one command
```

**Manual Development**:
```powershell
# 1. Start Docker (Postgres + Redis)
cd backend
docker-compose up -d

# 2. Run migrations
.\run-migrations.ps1           # Basic migrations
.\run-migrations.ps1 -Seed     # With demo data

# 3. Start backend API (port 4000)
cd backend
npm run dev           # Compiles TypeScript, runs auth-server.js

# 4. Start worker (separate terminal)
cd backend
npm run dev:worker    # Compiles TypeScript, runs worker.js

# 5. Start frontend (port 3000)
cd frontend
npm run dev           # Vite dev server
```

**Database**:
```powershell
cd backend
.\run-migrations.ps1           # Apply schema migrations
.\run-migrations.ps1 -Seed     # Apply + seed demo data
node scripts/set-test-passwords.js  # Set test user passwords
```

**Testing**:
```powershell
cd backend
npm test              # Jest unit tests
npm run test:etl      # ETL integration tests
npm run test:adapter  # Adapter tests
```

## Code Style & Conventions

**TypeScript**:
- Strict mode enabled (`tsconfig.json`)
- Prefer `async/await` over promises
- Use parameterized queries: `pool.query('SELECT * FROM users WHERE id = $1', [userId])`
- Export service functions, not classes (see [schema-service.ts](../backend/src/services/schema-service.ts))

**React**:
- Functional components + hooks only
- TypeScript for all props
- Components live in `frontend/components/` (not `src/components/`)
- Vite for bundling, NOT Next.js (despite some outdated references)

**API Design**:
- RESTful routes: `/api/uploads`, `/api/quota`, `/api/data-access`
- All routes protected with `authenticateJWT` middleware
- Return `202 Accepted` + `sessionId` for async operations
- Error responses: `{ success: false, errorCode: 'UPPER_SNAKE', message: 'Business-friendly text' }`

**Database Patterns**:
- Per-user schema isolation: `user_abc123.my_table`
- Helper models in `backend/src/models/`: `UploadSession.ts`, `Table.ts`
- Migrations in `backend/migrations/*.sql` (numbered sequentially)

**Error Messages**:
- ALWAYS use business-friendly language (see [business-glossary.md](../docs/business-glossary.md))
- Include actionable next steps
- Bad: "Authentication failed: invalid token"
- Good: "Your session expired. Please log in again to continue."

## Critical Workflows

**Adding New API Endpoint**:
1. Create route file in `backend/src/api/my-route.ts`
2. Export default Express router
3. Import and mount in `auth-server.js`: `app.use('/api/my-route', myRouter)`
4. Add `authenticateJWT` middleware: `router.get('/', authenticateJWT, handler)`

**Adding Background Job**:
1. Define job data interface in `job-processor.ts`
2. Add job type to queue in API route: `queue.add('my-job', data)`
3. Add handler in `processUploadJob()` or create new processor
4. Worker automatically picks up jobs (no code changes needed in `worker.js`)

**Schema Changes**:
1. Create new migration: `backend/migrations/00X_description.sql`
2. Run: `.\run-migrations.ps1` (PowerShell)
3. Migration runs sequentially, tracks progress in `migrations` table

**Frontend Component Patterns**:
- Auth state: Use `lib/auth.ts` `getUser()`, `setAuthToken()`
- API calls: Import from `lib/api/` (e.g., `lib/api/uploads.ts`)
- Loading states: Show spinner + business-friendly message ("Setting up your data...")
- Polling: Use `setInterval` with cleanup in `useEffect` return

## Integration Points

**User Authentication Flow**:
```
POST /auth/signup → bcrypt hash → INSERT INTO users
POST /auth/login → bcrypt.compare → jwt.sign() → return token
Frontend stores token → Authorization: Bearer <token> header
```

**File Upload → Table Creation**:
```typescript
// 1. API receives file (auth-server.js)
POST /api/uploads → multer saves → enqueue job → 202 response

// 2. Worker processes (worker.js → job-processor.ts)
Worker picks job → file-parser.ts (CSV/Excel) → schema inference
                → schema-service.ts (CREATE TABLE in user schema)
                → COPY data from CSV
                → Update upload_sessions.status = 'completed'

// 3. Frontend polls (client-side)
GET /api/uploads/:sessionId (every 2s) → show progress
```

**Schema Isolation**:
- New user signup: `schema-service.ensureUserSchema(userId)` creates `user_abc123` schema
- All user tables: `CREATE TABLE user_abc123.my_table (...)`
- Queries always include user ID: `schemaService.getSchemaName(userId) + '.table_name'`

**Storage Quota Enforcement**:
- Pre-upload check: `checkQuotaBeforeUpload` middleware (multer)
- Post-upload: `storage-service.ts` queries `pg_total_relation_size()`
- Free tier: 1GB, 20 tables max (configurable in `backend/src/api/quota.ts`)

## Common Issues

**"File not found" errors in worker**:
- Multer saves uploads to `backend/uploads/` (not `/tmp`)
- Verify `UPLOAD_DIR` env var or check `upload-limits.ts` default

**Worker not processing jobs**:
- Ensure Redis is running: `docker ps | grep redis`
- Check worker logs: Worker shows "Job completed" on success
- Verify queue name matches: `upload-queue` in both API and worker

**Migration fails with "already exists"**:
- Migrations track state in `migrations` table
- To reset: `DELETE FROM migrations WHERE version = X;` then re-run

**Frontend shows 401 Unauthorized**:
- Check token in localStorage: `localStorage.getItem('auth_token')`
- Verify JWT_SECRET matches between auth-server.js and middleware
- Token expires in 7 days - check `jwt.sign({ ... }, SECRET, { expiresIn: '7d' })`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
