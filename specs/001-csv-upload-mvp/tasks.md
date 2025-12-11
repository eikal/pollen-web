# Tasks: CSV/Excel Uploads MVP (Clarified Scope)

Feature: 001-csv-upload-mvp
- Inputs: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api-spec.yaml`
- Scope: Direct upload entry, unified ETL UI, MVP pages only (`/uploads`, `/my-data`, auth), quota shown in header + uploads + my-data.

Format: `- [ ] T### [P?] [US#?] Description (file/path)`

---

## Phase 1: Scope & Cleanup

- [x] T001 [P] Remove/hide non-MVP pages from nav (`frontend/components/Nav.tsx`) and routes (comment out unused pages under `frontend/pages/` per spec Out-of-Scope).
- [x] T002 [P] Repurpose unified ETL UI: ensure `frontend/components/UploadWizard.tsx` supports insert/upsert modes and session polling copy uses business language.
- [x] T003 [P] Header quota widget: add `StorageQuotaBar` to header and wire to `/api/quota` (`frontend/components/Nav.tsx`, `frontend/components/StorageQuotaBar.tsx`).
- [x] T004 Align terminology per business glossary across UI strings (Uploads → My Data context where applicable).

Checkpoint: Navigation shows only MVP; Uploads and My Data visible, header quota placeholder present.

---

## Phase 2: Backend Endpoints (MVP-aligned)

- [x] T005 [P] Quota API: implement GET `/api/quota` (`backend/src/api/quota.ts`) using `storage-service.getQuota`.
- [x] T006 [P] Mount quota router in server (`backend/auth-server.js` import `dist/api/quota` and `app.use('/api/quota', quotaRouter)`).
- [x] T007 Validate uploads API supports operationType insert/upsert (already in `backend/src/api/uploads.ts`); ensure error messages are business-friendly.
- [x] T008 [P] Add delete rows: DELETE `/api/uploads/tables/:table/rows?ids=1,2,3` in `backend/src/api/uploads.ts` calling `etl-service.deleteRows` with id list parsing.
- [x] T009 [P] Add drop table: DELETE `/api/uploads/tables/:table` in `backend/src/api/uploads.ts` calling `etl-service.dropTable`.
- [x] T010 [P] Add truncate table: DELETE `/api/uploads/tables/:table/data` in `backend/src/api/uploads.ts` calling `etl-service.truncateTable`.
- [x] T011 [P] Ensure preview/list endpoints are stable and paginated caps enforced (`backend/src/api/uploads.ts`).

Checkpoint: `/api/uploads/*` and `/api/quota` provide all MVP operations.

---

## Phase 3: Frontend Pages (Unified ETL UI)

- [x] T012 [US1] Uploads page: finalize `frontend/pages/uploads.tsx` to use `UploadWizard` for insert/upsert; poll session list; show quota warnings.
- [ ] T013 [US1] UploadWizard: add key column selector for upsert (`frontend/components/UploadWizard.tsx`).
- [x] T014 [US1] Table list: wire `frontend/components/TableList.tsx` to `/api/uploads/tables` and add actions menu placeholders (preview, drop, truncate, delete rows).
- [x] T015 [US1] Table preview: wire `frontend/components/TablePreview.tsx` to `/api/uploads/tables/:table/preview`.
- [x] T016 [US5] Header quota widget: implement `frontend/components/StorageQuotaBar.tsx` and `frontend/lib/api/getQuota`.
- [x] T017 [US4] Confirm dialog for destructive actions (`frontend/components/ConfirmDialog.tsx`).
- [x] T018 [US3] Delete rows UI: light form/modal in UploadWizard or My Data to input ID list and call DELETE rows endpoint.
- [x] T019 [US4] Drop/truncate actions on table list (uses ConfirmDialog).
- [x] T020 Copy pass: ensure business-friendly messages across forms and errors.

Checkpoint: Users can upload (insert/upsert), view tables, preview, and see quota; destructive actions wired.

---

## Phase 4: Jobs & Quota Maintenance

- [ ] T021 [P] Ensure worker processes insert/upsert flows (verify `backend/worker.js` uses `queue` and `job-processor`).
- [ ] T022 [P] Quota recalculation after table writes/deletes using `storage-service` hooks where missing.
- [ ] T023 [P] Schedule optional periodic quota recalc (simple interval in worker for dev) using `storage-service.recalculateQuota`.

Checkpoint: Quota stays accurate after operations; optional periodic recalc in dev.

---

## Phase 5: Error Handling & Tests

- [ ] T024 [P] Global error mapping to business messages (`backend/src/middleware/error-handler.ts`) and ensure routers use it.
- [ ] T025 [P] Add basic backend integration tests: upload → list → preview → upsert → delete → drop (`backend/tests/integration/etl-upload-flow.test.js`).
- [ ] T026 [P] Add unit tests for `file-parser`, `etl-service.deleteRows` id parsing edge cases (`backend/tests/unit/*.test.ts`).
- [ ] T027 [P] Frontend smoke tests for UploadWizard happy path (React Testing Library).

Checkpoint: Happy paths covered; errors are user-friendly.

---

## Phase 6: Polish

- [ ] T028 [P] Table name validation on client/server (pattern: `^[a-z][a-z0-9_]{0,62}$`).
- [ ] T029 [P] Performance log for p95 upload + upsert timings on server logs.
- [ ] T030 [P] Docs: quickstart additions for My Data + quota bar (`specs/001-csv-upload-mvp/quickstart.md`).

---

## User Stories Mapping

- US1: Upload first CSV/Excel and see data (insert) — T012, T014, T015, T021, T025.
- US2: Upsert by key column — T013, T012, T021, T025.
- US3: Delete rows by ID list — T008, T018, T025, T026.
- US4: Drop/Truncate tables — T009, T010, T017, T019, T025.
- US5: View storage usage and warnings — T005, T006, T016, T012.

---

## Parallelization Notes

- Backend endpoints (T005–T011) can be split among two devs; quota and destructive ops are independent.
- Frontend work (T012–T020) mostly component-level and parallelizable.
- Tests and polish (T024–T030) can run in parallel after endpoints stabilize.

---

## Summary

- Total tasks: 30
- MVP critical path: T005–T007, T012–T016, T021, T025
- Pages in scope: `/uploads`, `/my-data`, auth
- Visible quota: header + Uploads + My Data

All tasks follow the strict checklist format and reference actual files in this repo to minimize drift.
