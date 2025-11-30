# Implementation Plan: Database Access & UX Polishing

**Branch**: `003-db-access-ux` | **Date**: 2025-11-30 | **Spec**: `specs/003-db-access-ux/spec.md`
**Input**: Feature specification from `specs/003-db-access-ux/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable secure DB access for end users with clear credentials and guidance; support Excel multi-sheet uploads; separate and polish upload UI; add DB guidance from Your Tables; define free plan scope and premium CTA; fix settings redirect; deliver production-grade UI. Technical approach leverages existing per-user schema isolation and adds a Data Access panel, Excel sheet enumeration, navigation/UX adjustments, and guardrails for destructive actions.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18 LTS, TypeScript 5.x (backend, frontend)
**Primary Dependencies**: Express, Next.js, Multer, Papa Parse, ExcelJS, pg
**Storage**: PostgreSQL 14+ with per-user schema isolation (`user_<uuid>`)  
**Testing**: Jest for backend; React Testing Library/Jest for frontend
**Target Platform**: Web (Windows dev env, Dockerized DB)
**Project Type**: Web app (frontend + backend)  
**Performance Goals**: Upload preview within 2s for 10k rows; UI interactions <100ms perceived
**Constraints**: Free plan quotas; destructive actions require confirmation; auth-protected Settings
**Scale/Scope**: MVP: single-tenant app with per-user schema; 5 ETL ops

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

NEEDS CLARIFICATION: Constitution file is a template without concrete gates. Proceed with standard gates: test-first mindset, clarity over implementation detail, user-value focus.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── src/
│   ├── api/           # Add data-access route if needed (read-only credential view)
│   ├── services/      # Credential generation/reset service
│   └── models/        # User schema metadata
└── tests/

frontend/
├── components/
│   ├── DataAccessPanel.tsx
│   ├── UploadForm.tsx (moved to dedicated page)
│   └── GuidancePanel.tsx (Your Tables → DB access)
├── pages/
│   ├── upload.tsx     # Dedicated upload page
│   └── settings.tsx   # Fix redirect behavior
└── tests/
```

**Structure Decision**: Use existing backend/frontend split; add Settings → Data Access UI and dedicated upload page; minimal backend additions for credential management.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
