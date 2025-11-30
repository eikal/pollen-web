# Implementation Plan: Database Access & UX Polishing

**Branch**: `003-db-access-ux` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-db-access-ux/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable end users to securely access their uploaded data via database credentials displayed in a Settings panel, implement Excel multi-sheet upload selection, polish UI with consistent design system (Tailwind 8px spacing scale, typography hierarchy, semantic colors), separate upload form to dedicated page, provide guidance linking "Your Tables" to DB access, define free plan scope with premium CTA, and fix Settings redirect issues. Technical approach: extend existing Node.js/TypeScript backend with per-user PostgreSQL role creation, enhance Next.js frontend with new Settings/Upload pages following established design tokens, integrate ExcelJS sheet enumeration into upload pipeline.

## Technical Context

**Language/Version**: Node.js 18 LTS, TypeScript 5.x (backend, frontend)  
**Primary Dependencies**: Express (backend API), Next.js 14 (frontend), React, Tailwind CSS, ExcelJS (Excel parsing), Papa Parse (CSV), Multer (uploads), pg (PostgreSQL client), BullMQ (job queue)  
**Storage**: PostgreSQL 14+ with per-user schema isolation (`user_<uuid>` pattern)  
**Testing**: Jest (backend unit/integration), React Testing Library (frontend components)  
**Target Platform**: Web application (Linux server backend, browser frontend)  
**Project Type**: Web (backend + frontend split)  
**Performance Goals**: <500ms API response time for credential retrieval, <2s for Excel sheet enumeration, 60fps UI interactions  
**Constraints**: Per-user credentials must be cryptographically secure, UI must meet WCAG 2.1 AA accessibility, design system tokens must eliminate arbitrary px values  
**Scale/Scope**: Support 10k+ concurrent users, handle Excel files up to 10MB with 20+ sheets, maintain <100ms incremental UI rendering

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (Constitution template is generic placeholder; no specific gates defined for this project)

**Post-Design Re-Check**: ✅ PASS (Phase 1 artifacts generated; no new complexity violations introduced)

**Notes**: The constitution file `.specify/memory/constitution.md` contains only template placeholders. No specific architectural principles, testing requirements, or complexity gates are defined. This feature proceeds without constitution violations as no enforceable rules exist. Phase 1 design (data-model.md, contracts/openapi.yaml, quickstart.md) complete and follows existing project patterns (REST API, PostgreSQL, React/Next.js UI).

**Action Required**: If project-specific constitution principles are defined in the future, re-evaluate this plan for compliance.

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

```text
backend/
├── src/
│   ├── api/
│   │   ├── data-access.ts          # NEW: DB credentials endpoints (GET, POST reset)
│   │   └── uploads.ts               # MODIFIED: Add Excel sheet enumeration endpoint
│   ├── services/
│   │   ├── user-credentials.ts      # NEW: PostgreSQL role creation & password management
│   │   ├── file-parser.ts           # MODIFIED: Add sheet parameter support
│   │   ├── queue.ts                 # MODIFIED: Add sheet field to UploadJobData
│   │   └── job-processor.ts         # MODIFIED: Forward sheet to parser
│   ├── middleware/
│   │   └── auth.ts                  # EXISTING: JWT authentication
│   └── models/
│       └── (existing models)
└── tests/
    ├── unit/
    │   └── user-credentials.test.ts # NEW: Test role creation, password reset
    └── integration/
        └── data-access.test.ts      # NEW: Test credential retrieval flow

frontend/
├── pages/
│   ├── settings/
│   │   └── index.tsx                # NEW: Settings page with Data Access panel
│   ├── upload.tsx                   # NEW: Dedicated upload page
│   └── my-data.tsx                  # MODIFIED: Add guidance panel linking to Settings
├── components/
│   ├── DataAccessPanel.tsx          # NEW: Credentials display with copy buttons
│   ├── GuidancePanel.tsx            # NEW: DB access guidance widget
│   ├── UploadWizard.tsx             # MODIFIED: Add Excel sheet selector
│   └── Nav.tsx                      # MODIFIED: Add Upload link, Settings route
└── tests/
    └── components/
        └── DataAccessPanel.test.tsx # NEW: Test credential display & copy actions
```

**Structure Decision**: Web application structure with backend (Node.js/Express API) and frontend (Next.js) separation. All new code follows existing patterns: backend services handle business logic, API routes expose REST endpoints, frontend pages/components implement UI. TypeScript used throughout for type safety.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: N/A (No constitution violations detected)
