# pollen-web Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-11

## Active Technologies
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (001-csv-upload-mvp)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (001-csv-upload-mvp)
- Node.js 18 LTS, TypeScript 5.0 + Express 4.x (backend API), Next.js 14 (frontend), Multer (file uploads), Papa Parse (CSV parsing), ExcelJS (Excel parsing), pg (PostgreSQL client), BullMQ (job queue) (001-csv-upload-mvp)
- PostgreSQL 14+ (shared instance with per-user schema isolation) (001-csv-upload-mvp)

- **Backend**: Node.js + TypeScript + Express (001-simple-website-which)
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS (001-simple-website-which)
- **Database**: PostgreSQL (metadata storage)
- **Auth**: Social login (Google, Microsoft OAuth) + JWT
- **AI**: OpenAI API (conversational assistant)

## Project Philosophy & Business Intent

**Target Audience**: Non-technical business users who work with data but don't know SQL or database administration.

**Core Mission**: Make data accessible without engineering teams. Users upload CSV/Excel files and immediately get queryable tables with business-friendly interfaces.

**Key Principles**:
1. **Business language first**: Use "Data Workspace" not "Instance", "Data Flow" not "ETL Pipeline"
2. **Self-service**: 90% of tasks complete without support tickets
3. **Fail-safe**: Require confirmation for destructive actions (drop table)
4. **Transparent limits**: Show storage quotas upfront, warn before blocking

**Full product vision**: See `BUSINESS_INTENT.md` at repository root.

## Business-Oriented UX Requirements

**Target Audience**: Business users with some technical background but not highly technical.

**Terminology (MUST use)**:
- "Data Workspace" or "Data Hub" (NOT "instance", "DWH")
- "Data Flow" or "Data Connection" (NOT "ETL Pipeline", "ETL Job")
- "Insights" (NOT "BI Dashboard")
- "My Data" (NOT "Products", "Instances")
- Business impact language (NOT technical status codes)

**Reference**: See `docs/business-glossary.md` for complete terminology mapping.

**AI Assistant**: See `docs/ai-prompts.md` for behavior guidelines.

## Project Structure

```text
backend/
├── src/
│   ├── adapters/       # DWH adapters (snowflake, bigquery, redshift)
│   ├── api/            # REST endpoints (auth, workspaces, dataflows, insights, ai-assistant)
│   ├── services/       # Business logic (workspace-orchestrator, ai-service, status-translator)
│   ├── models/         # DB models (organization, user, workspace-job, data-flow)
│   └── worker.js       # Async job worker
├── tests/
│   ├── adapter.test.js
│   ├── etl.test.js
│   └── integration/
└── migrations/         # PostgreSQL schema migrations

frontend/
├── pages/              # Next.js pages (index, about, pricing, my-data, data-flows, insights, onboarding, auth, settings)
├── components/         # React components (Nav, OnboardingWizard, DataFlowWizard, AIAssistant, BusinessMetrics)
└── styles/             # Tailwind CSS

docs/
├── adapters.md
├── business-glossary.md   # Business ↔ technical term mappings
└── ai-prompts.md          # AI assistant behavior guide
```

## Commands

**Backend**:
```bash
cd backend
npm install
npm run dev          # Start dev server (port 4000)
npm test             # Run unit tests
npm run test:etl     # Run ETL integration tests
node worker.js       # Start async worker
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm test             # Run tests
```

**Database**:
```bash
cd backend
npm run migrate      # Run migrations
```

## Code Style

**TypeScript**: Use strict mode, prefer interfaces over types, async/await over promises
**React**: Functional components, hooks, TypeScript props
**API Routes**: RESTful conventions, JWT auth middleware
**Database**: Use parameterized queries, JSONB for flexible schemas
**Error Messages**: ALWAYS use business-friendly language (see `docs/business-glossary.md`)

## Recent Changes
- 001-csv-upload-mvp: Added Node.js 18 LTS, TypeScript 5.0 + Express 4.x (backend API), Next.js 14 (frontend), Multer (file uploads), Papa Parse (CSV parsing), ExcelJS (Excel parsing), pg (PostgreSQL client), BullMQ (job queue)
- 001-csv-upload-mvp: Added Node.js 18 LTS, TypeScript 5.0 + Express 4.x (backend API), Next.js 14 (frontend), Multer (file uploads), Papa Parse (CSV parsing), ExcelJS (Excel parsing), pg (PostgreSQL client), BullMQ (job queue)
- 001-csv-upload-mvp: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
