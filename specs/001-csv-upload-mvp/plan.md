# Implementation Plan: CSV/Excel to Data Warehouse Service (MVP)

**Branch**: `001-csv-upload-mvp` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-csv-upload-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a simplified data warehouse service that allows non-technical users to upload CSV/Excel files (up to 50MB) to a shared PostgreSQL instance with schema-isolated multi-tenancy. Users can perform basic ETL operations (INSERT, UPSERT, DELETE, DROP, TRUNCATE) through a business-friendly web UI. Free plan enforces 20 table limit and 1GB storage quota with real-time usage tracking.

## Technical Context

**Language/Version**: Node.js 18 LTS, TypeScript 5.0  
**Primary Dependencies**: Express 4.x (backend API), Next.js 14 (frontend), Multer (file uploads), Papa Parse (CSV parsing), ExcelJS (Excel parsing), pg (PostgreSQL client), BullMQ (job queue)  
**Storage**: PostgreSQL 14+ (shared instance with per-user schema isolation)  
**Testing**: Jest (unit tests), Supertest (API integration tests)  
**Target Platform**: Linux server (backend), modern browsers (frontend)  
**Project Type**: Web (frontend + backend)  
**Performance Goals**: ≤30s p95 latency for 10MB file uploads, ≥1,000 rows/sec upsert throughput  
**Constraints**: 50MB max file size, 1GB storage per free user, 20 tables max per user, 30s query timeout  
**Scale/Scope**: 100+ concurrent users on shared PostgreSQL, 5-10 tables average per user, 50k-200k rows typical dataset

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No constitution principles defined)

No project-specific constitution principles are currently defined in `.specify/memory/constitution.md`. This feature proceeds with standard software engineering best practices:
- Test coverage for all user stories
- Business-friendly error messages (FR-019)
- Schema isolation for security (NFR-005)
- Proper error logging (NFR-007)

## Project Structure

### Documentation (this feature)

```text
specs/001-csv-upload-mvp/
├── plan.md                     # ✅ This file (Phase 1 complete)
├── spec.md                     # ✅ Feature specification (clarified)
├── clarification-summary.md    # ✅ UI scope clarifications
├── research.md                 # ✅ Phase 0 output (technical decisions)
├── data-model.md               # ✅ Phase 1 output (entity design)
├── quickstart.md               # ✅ Phase 1 output (developer setup guide)
├── contracts/                  # ✅ Phase 1 output (API contracts)
│   ├── api-spec.yaml           # OpenAPI 3.0 specification
│   └── api-types.ts            # TypeScript type definitions
└── tasks.md                    # ⏭️ Phase 2 output (use /speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── adapters/          # DWH adapters (example/ for template)
│   ├── api/               # REST endpoints (uploads.ts, connections.ts, data-products.ts)
│   ├── middleware/        # Auth, error-handler, upload-limits
│   ├── models/            # Data entities (DataProduct, ETLOperation, StorageQuota, etc.)
│   └── services/          # Business logic (db.ts, config.ts, upload-service, etl-service)
├── tests/
│   ├── unit/              # Model and service tests
│   ├── integration/       # API endpoint tests
│   └── adapter.test.js    # Adapter contract tests
├── migrations/            # PostgreSQL schema migrations
└── worker.js              # BullMQ background job worker

frontend/
├── pages/                 # Next.js pages (uploads.tsx, my-data.tsx, auth/)
├── components/            # React components (UploadWizard, TableList, TablePreview, SchemaPreview, ETLWizard)
├── lib/                   # API client, auth utilities
└── styles/                # Tailwind CSS

docs/
├── adapters.md
├── business-glossary.md
└── ai-prompts.md
```

**Structure Decision**: Web application structure with separate backend (Node.js/Express API) and frontend (Next.js SSR). Backend handles file uploads, ETL operations, and PostgreSQL interactions. Frontend provides business-friendly UI for non-technical users.

## Complexity Tracking

> **No violations identified - N/A**

This feature follows standard web application patterns with no constitutional violations requiring justification. The design uses established patterns:
- Standard web app structure (backend + frontend)
- Schema-level isolation (native PostgreSQL feature)
- Job queue for async processing (industry standard pattern)
- REST API with JWT auth (standard practice)

---

## Phase Completion Summary

### ✅ Phase 0: Research (Complete)
**Output**: `research.md` (pre-existing, validated)
- Technology stack decisions documented
- All "NEEDS CLARIFICATION" items resolved
- Best practices and patterns captured
- Open questions identified for implementation phase

### ✅ Phase 1: Design & Contracts (Complete)
**Outputs**:
1. `data-model.md` - 5 core entities with full schema definitions, ER diagrams, state machines
2. `contracts/api-spec.yaml` - OpenAPI 3.0 spec with 15 endpoints (Upload, Tables, ETL, Quota)
3. `contracts/api-types.ts` - TypeScript interfaces for frontend integration
4. `quickstart.md` - Developer setup guide with test flows and troubleshooting
5. `.github/copilot-instructions.md` - Updated with Node.js 18 + TypeScript 5.0 + PostgreSQL stack

**Key Deliverables**:
- Complete API surface defined (REST endpoints with business-friendly errors)
- Database schema for metadata tables (public schema) + user schema pattern
- Type-safe contracts for frontend-backend integration
- Ready-to-run local development environment

### ⏭️ Phase 2: Task Breakdown (Pending)
**Next Command**: Run `/speckit.tasks` or `npm run speckit.tasks` to generate implementation checklist

**Expected Output**: `tasks.md` with:
- Granular implementation tasks organized by priority
- Database migration scripts
- Component development checklist
- Test scenarios mapped to user stories
- Definition of done for each task

---

## Next Steps

1. **Review Generated Artifacts**:
   - [ ] Validate `data-model.md` entities match requirements
   - [ ] Review `contracts/api-spec.yaml` endpoints
   - [ ] Test `quickstart.md` setup instructions on clean machine

2. **Run Task Planning**:
   ```powershell
   # From repository root
   npm run speckit.tasks
   # Or directly:
   .\.specify\scripts\powershell\generate-tasks.ps1
   ```

3. **Begin Implementation**:
   - Start with database migrations (from `data-model.md`)
   - Implement upload flow endpoints (from `contracts/api-spec.yaml`)
   - Build UI components (UploadWizard, TableList, etc.)
   - Write tests for each user story

---

**Planning Status**: ✅ Complete  
**Branch**: `001-csv-upload-mvp`  
**Plan Path**: `D:\pollen-web\specs\001-csv-upload-mvp\plan.md`  
**Generated Artifacts**: 6 files (research.md, data-model.md, quickstart.md, api-spec.yaml, api-types.ts, updated copilot-instructions.md)
- Schema-level isolation (native PostgreSQL feature)
- Job queue for async processing (industry standard pattern)
- REST API with JWT auth (standard practice)
