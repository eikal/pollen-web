# Implementation Tasks: Database Access & UX Polishing

**Feature**: 003-db-access-ux  
**Branch**: `003-db-access-ux`  
**Plan**: [plan.md](./plan.md)

## Task Summary

- **Total Tasks**: 45
- **User Stories**: 7 (from spec.md User Scenarios & Testing)
- **Parallelizable**: 28 tasks marked [P]
- **Test Tasks**: 0 (tests not explicitly requested in spec)

## Implementation Strategy

**MVP Scope**: User Story 1 (Obtain DB Credentials) + User Story 7 (Settings Redirect Fix)
- Core value: Users can access their data via external SQL clients
- Minimal viable feature set for initial release

**Incremental Delivery Order**:
1. US1 (DB Credentials) + US7 (Auth Fix) - MVP
2. US3 (Excel Multi-Sheet) - High user demand
3. US5 (Your Tables → DB Guidance) - Discoverability
4. US4 (Upload UX Clarity) - Polish existing flow
5. US6 (Free Plan & Premium CTA) - Business model visibility
6. US2 (External Client Testing) - Validation/documentation only

---

## Phase 1: Setup & Infrastructure

**Goal**: Prepare project structure and shared dependencies

### Tasks

- [ ] T001 Verify Node.js 18 LTS and TypeScript 5.x installed
- [ ] T002 Install/verify ExcelJS dependency in backend/package.json
- [ ] T003 [P] Create backend/src/api/data-access.ts file stub
- [ ] T004 [P] Create backend/src/services/user-credentials.ts file stub
- [ ] T005 [P] Create frontend/pages/settings/index.tsx file stub
- [ ] T006 [P] Create frontend/components/DataAccessPanel.tsx file stub
- [ ] T007 [P] Create frontend/components/GuidancePanel.tsx file stub
- [ ] T008 [P] Create frontend/pages/upload.tsx file stub

**Completion Criteria**: All file stubs created, dependencies installed, TypeScript compiles without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Implement shared infrastructure needed by multiple user stories

### Tasks

- [ ] T009 [P] Implement JWT authentication middleware in backend/src/middleware/auth.ts (if not already complete)
- [ ] T010 [P] Add design system constants to frontend/tailwind.config.js: spacing scale (8px base), semantic colors (blue-600, red-600, green-600, yellow-50/600, gray-50/100/600/900)
- [ ] T011 Create database migration for user_credentials table (user_id, db_role_name, created_at, last_rotated_at) in backend/migrations/
- [ ] T012 Run migration to create user_credentials table

**Completion Criteria**: Auth middleware functional, Tailwind config updated with design tokens, user_credentials table exists in database

---

## Phase 3: User Story 1 - Obtain DB Credentials

**Story Goal**: User navigates to Settings → Data Access, sees credentials (host, port, database, schema, username, password), copies them, connects via SQL client

**Independent Test Criteria**:
- ✅ GET /api/settings/data-access returns credentials for authenticated user
- ✅ Credentials displayed in Settings page with copy buttons functional
- ✅ User can connect to PostgreSQL using provided credentials and query their schema

### Tasks

- [ ] T013 [US1] Implement ensureDbUser() function in backend/src/services/user-credentials.ts to create PostgreSQL role with schema grants
- [ ] T014 [US1] Implement getCredentials() function in backend/src/services/user-credentials.ts to return host, port, database, schema, username
- [ ] T015 [US1] Implement GET /api/settings/data-access endpoint in backend/src/api/data-access.ts using authenticateJWT middleware
- [ ] T016 [P] [US1] Create DataAccessPanel component in frontend/components/DataAccessPanel.tsx with credential fields layout
- [ ] T017 [P] [US1] Implement copy-to-clipboard functionality for each credential field in DataAccessPanel.tsx
- [ ] T018 [P] [US1] Add credential field styling following design system: left-aligned labels (text-sm font-medium text-gray-600 uppercase tracking-wide), inline copy buttons (text-xs px-3 py-1.5), space-y-4 spacing
- [ ] T019 [P] [US1] Add psql command code block to DataAccessPanel.tsx with bg-gray-900 text-green-400 styling
- [ ] T020 [P] [US1] Add helper text below credential fields (text-xs text-gray-600) explaining usage
- [ ] T021 [US1] Create Settings page in frontend/pages/settings/index.tsx mounting DataAccessPanel component
- [ ] T022 [US1] Mount data-access router in backend/auth-server.js
- [ ] T023 [US1] Update frontend/components/Nav.tsx to add Settings link in user dropdown

**Completion Criteria**: User can navigate to Settings, see all 6 credential fields (host, port, database, schema, username, password), copy each value, and successfully connect via psql or DBeaver to query their schema

---

## Phase 4: User Story 7 - Settings Redirect Fix

**Story Goal**: Authenticated user clicking Settings remains on Settings; unauthenticated users redirected to Login

**Independent Test Criteria**:
- ✅ Authenticated user (with valid JWT in localStorage) accesses Settings successfully
- ✅ Unauthenticated user (no JWT) is redirected to /auth/login
- ✅ No duplicate Nav headers on Settings page

### Tasks

- [ ] T024 [US7] Add useEffect auth check in frontend/pages/settings/index.tsx to verify pollen_token presence
- [ ] T025 [US7] Implement redirect logic: if (!token) router.push('/auth/login')
- [ ] T026 [US7] Add loading skeleton state while checking auth token
- [ ] T027 [US7] Verify Settings page does not render duplicate Nav component (Nav already in _app.tsx)

**Completion Criteria**: Auth check prevents unauthenticated access, no UI flicker during token validation, no duplicate navigation headers

---

## Phase 5: User Story 3 - Excel Multi-Sheet Upload

**Story Goal**: User uploads employees.xlsx with 2+ sheets, UI prompts sheet selection, preview shows chosen sheet, creates table

**Independent Test Criteria**:
- ✅ POST /api/uploads/excel/sheets returns list of sheet names for uploaded file
- ✅ Frontend displays sheet selector dropdown after Excel upload
- ✅ Preview and table creation use selected sheet only
- ✅ Re-uploading same file with different sheet selection creates/updates different table

### Tasks

- [ ] T028 [P] [US3] Implement POST /api/uploads/excel/sheets endpoint in backend/src/api/uploads.ts using Multer
- [ ] T029 [P] [US3] Add enumerateExcelSheets() function in backend/src/services/file-parser.ts using ExcelJS workbook.worksheets
- [ ] T030 [P] [US3] Modify parseFile() in backend/src/services/file-parser.ts to accept options.sheet parameter
- [ ] T031 [P] [US3] Update UploadJobData interface in backend/src/services/queue.ts to add sheet field
- [ ] T032 [P] [US3] Modify job processor in backend/src/services/job-processor.ts to forward sheet to parseFile()
- [ ] T033 [P] [US3] Add enumerateExcelSheets() API function in frontend/lib/api/uploads.ts
- [ ] T034 [P] [US3] Modify UploadWizard component in frontend/components/UploadWizard.tsx to call enumerateExcelSheets on Excel file upload
- [ ] T035 [P] [US3] Add sheet selector dropdown to UploadWizard.tsx (displayed only for Excel files)
- [ ] T036 [P] [US3] Disable Preview button until sheet selected
- [ ] T037 [US3] Pass selected sheet to preview and finalize API calls in UploadWizard.tsx

**Completion Criteria**: Excel file with multiple sheets triggers sheet selector, preview shows only selected sheet data, table created from correct sheet, different sheets from same file can be uploaded separately

---

## Phase 6: User Story 5 - Your Tables → DB Guidance

**Story Goal**: User opens Your Tables, sees guidance panel explaining how to connect to DB with link to Settings → Data Access

**Independent Test Criteria**:
- ✅ GuidancePanel component visible on "Your Tables" page
- ✅ Panel contains explanation text and direct link to /settings
- ✅ Clicking link navigates to Settings page with Data Access panel visible

### Tasks

- [x] T038 [P] [US5] Create GuidancePanel component in frontend/components/GuidancePanel.tsx with explanation text
- [x] T039 [P] [US5] Add "View DB Credentials" link button to GuidancePanel pointing to /settings
- [x] T040 [P] [US5] Style GuidancePanel with bg-blue-50 border-l-4 border-blue-500 p-6 following design system
- [x] T041 [US5] Add GuidancePanel to frontend/pages/my-data.tsx below TableList component

**Completion Criteria**: Guidance panel displays on Your Tables page with clear call-to-action linking to Settings

---

## Phase 7: User Story 4 - Upload UX Clarity

**Story Goal**: Upload form on dedicated page, no overlapping panels, clear button labels, confirmations for destructive actions

**Independent Test Criteria**:
- ✅ Upload form accessible at /upload route
- ✅ Nav contains "Upload" link
- ✅ No UI overlap (consistent spacing, no floating elements)
- ✅ All action buttons labeled clearly: Create Table, Upsert, Delete Rows, Truncate, Drop
- ✅ Destructive actions (delete, truncate, drop) trigger confirmation modals

### Tasks

- [ ] T042 [P] [US4] Create dedicated Upload page in frontend/pages/upload.tsx mounting UploadWizard
- [ ] T043 [P] [US4] Add "Upload" link to frontend/components/Nav.tsx navigation menu
- [ ] T044 [P] [US4] Audit UploadWizard.tsx for spacing consistency: replace arbitrary px values with Tailwind scale (p-4, p-6, p-8, space-y-4)
- [ ] T045 [P] [US4] Standardize action button labels in UploadWizard.tsx: "Create Table", "Upsert (by key)", "Delete Rows", "Truncate Table", "Drop Table"
- [ ] T046 [P] [US4] Apply semantic colors to action buttons: blue-600 (Create/Upsert), red-600 (Delete/Truncate/Drop)
- [ ] T047 [P] [US4] Add focus rings to all buttons: focus:outline-none focus:ring-2 focus:ring-blue-500
- [ ] T048 [P] [US4] Implement confirmation modal for Delete, Truncate, Drop actions (reuse or create ConfirmDialog component)
- [ ] T049 [US4] Add disabled states to action buttons until prerequisites met (e.g., Preview before Create)

**Completion Criteria**: /upload page accessible, Upload link in Nav, spacing consistent (8px scale), destructive actions require confirmation, all buttons follow semantic color scheme

---

## Phase 8: User Story 6 - Free Plan & Premium CTA

**Story Goal**: Free plan limits visible (storage, table count), premium "Contact Us" CTA displayed

**Independent Test Criteria**:
- ✅ Storage quota and table count displayed on Your Tables and/or Settings
- ✅ "Contact Us" button/link visible when limits approached
- ✅ Premium CTA opens mailto link or contact form

### Tasks

- [x] T050 [P] [US6] Fetch quota data from existing GET /api/quota endpoint in frontend pages
- [x] T051 [P] [US6] Display storage quota bar on Your Tables page using StorageQuotaBar component
- [x] T052 [P] [US6] Display table count "X / 20 tables" on Your Tables page
- [x] T053 [P] [US6] Add premium CTA card to Your Tables page with bg-gradient-to-r from-blue-600 to-indigo-600 styling
- [x] T054 [P] [US6] Implement "Contact Sales" button with mailto:sales@pollendata.com link
- [x] T055 [US6] Show premium CTA when user approaches limits (18+ tables or 900MB+ storage)

**Completion Criteria**: Free plan limits visible to users, premium CTA displays when limits approached, clicking CTA opens email client with pre-filled subject

---

## Phase 9: User Story 2 - External Client Connection (Documentation/Validation)

**Story Goal**: Document and validate that users can connect via DBeaver or psql with provided credentials

**Independent Test Criteria**:
- ✅ Documentation includes DBeaver connection setup steps
- ✅ Documentation includes psql command example with search_path
- ✅ Manual test: Connect via psql and query user_<id>.sales_data successfully

### Tasks

- [ ] T056 [US2] Add DBeaver connection instructions to DataAccessPanel.tsx as collapsible section
- [ ] T057 [US2] Add psql example command with SET search_path to DataAccessPanel.tsx code block
- [ ] T058 [US2] Validate schema isolation: Manual test connecting as user_A cannot query user_B schema
- [ ] T059 [US2] Add security reminder to DataAccessPanel: "Do not share credentials; rotate if compromised"

**Completion Criteria**: Client connection instructions visible in UI, schema isolation validated via manual testing

---

## Phase 10: User Story 3 (Password Reset) - Credential Retrieval Enhancement

**Story Goal**: User can reset password with confirmation and one-time plaintext reveal

**Independent Test Criteria**:
- ✅ POST /api/settings/data-access/reset-password generates new password
- ✅ New password displayed once in UI with warning message
- ✅ Password masked in subsequent GET requests

### Tasks

- [x] T060 [US3] Implement resetDbPassword() function in backend/src/services/user-credentials.ts using crypto.randomBytes(16).toString('base64')
- [x] T061 [US3] Implement POST /api/settings/data-access/reset-password endpoint in backend/src/api/data-access.ts
- [x] T062 [P] [US3] Add "Generate New Password" button to DataAccessPanel.tsx password field
- [x] T063 [P] [US3] Display one-time password reveal alert after reset with bg-green-50 border-green-500 styling
- [x] T064 [P] [US3] Add copy button to one-time password display
- [x] T065 [P] [US3] Add security warning text below one-time password: "Save now, won't be shown again"
- [x] T066 [US3] Implement dismiss button to close one-time password alert

**Completion Criteria**: Password reset button functional, new password displayed once with copy button and warning, subsequent fetches show masked password

---

## Phase 11: Polish & Cross-Cutting Concerns

**Goal**: Apply design system consistency across all UI, accessibility improvements, responsive design validation

### Tasks

- [x] T067 [P] Audit all new components for Tailwind spacing scale compliance (p-2/4/6/8/12, m-2/4/6/8/12)
- [x] T068 [P] Audit typography hierarchy: page titles (text-3xl font-bold), section headers (text-xl font-semibold), labels (text-sm font-medium), helper text (text-xs)
- [x] T069 [P] Verify semantic color usage: blue-600 primary, green-600 success, red-600 destructive, yellow-50/600 warnings, gray neutrals
- [x] T070 [P] Add focus states to all interactive elements: focus:outline-none focus:ring-2 focus:ring-blue-500
- [x] T071 [P] Verify form field structure: left-aligned labels above inputs, helper text below, space-y-2 for field groups
- [x] T072 [P] Test responsive design on mobile (320px), tablet (768px), desktop (1024px+)
- [x] T073 [P] Validate WCAG 2.1 AA compliance: color contrast, keyboard navigation, ARIA labels
- [x] T074 [P] Add loading skeletons to all async data fetch states (credentials, quota, table list)
- [x] T075 [P] Verify no overlapping UI elements (check z-index conflicts, modal positioning)
- [x] T076 Commit all UI polish changes with message: "feat(ui): enforce design system consistency across DB access and upload features"

**Completion Criteria**: All components use design tokens, no arbitrary px values, WCAG AA compliance verified, responsive on all breakpoints, loading states prevent layout shift

---

## Dependencies & Execution Order

### Story Dependencies Graph

```text
Setup (Phase 1) → Foundational (Phase 2) → [Parallel Stories Below]

├─ US1 (DB Credentials) ──┬─→ US5 (Guidance Panel) [references Settings]
│                          │
│                          └─→ US2 (Documentation) [references US1 credentials]
│
├─ US7 (Auth Fix) ──→ US1 (must complete to test Settings access)
│
├─ US3 (Excel Multi-Sheet) [independent]
│
├─ US4 (Upload UX) [independent, can polish existing UploadWizard]
│
├─ US6 (Free Plan CTA) [independent, uses existing quota API]
│
└─ US3-Password (Credential Reset) ──→ US1 (extends DB credentials feature)

Polish (Phase 11) → All stories complete
```

### MVP Critical Path

1. T001-T012 (Setup + Foundational)
2. T024-T027 (US7 - Auth Fix) **[BLOCKING for US1]**
3. T013-T023 (US1 - DB Credentials) **[MVP CORE]**
4. T056-T059 (US2 - Documentation) **[MVP VALUE]**

**MVP Delivery**: After T059, users can obtain credentials and connect to their data via external SQL clients (primary feature goal achieved)

### Parallel Execution Opportunities

**After Foundational (T012 complete)**:
- **Parallel Track A**: US7 (T024-T027) + US1 Backend (T013-T015)
- **Parallel Track B**: US1 Frontend (T016-T023)
- **Parallel Track C**: US3 Excel Backend (T028-T032)
- **Parallel Track D**: US3 Excel Frontend (T033-T037)
- **Parallel Track E**: US4 Upload UX (T042-T049)
- **Parallel Track F**: US6 Free Plan (T050-T055)
- **Parallel Track G**: US5 Guidance (T038-T041)

**Polish Phase Parallelism**:
- All T067-T075 tasks can run in parallel (different components/concerns)

### Recommended Implementation Batches

**Batch 1 (MVP - 2-3 days)**:
- T001-T012, T024-T027, T013-T023, T056-T059

**Batch 2 (Excel + Upload - 2 days)**:
- T028-T037 (Excel), T042-T049 (Upload UX)

**Batch 3 (Guidance + Premium - 1 day)**:
- T038-T041 (Guidance), T050-T055 (Premium CTA)

**Batch 4 (Password Reset - 1 day)**:
- T060-T066

**Batch 5 (Polish - 1-2 days)**:
- T067-T076

**Total Estimated Duration**: 7-9 days (with parallel execution)

---

## Task Format Validation

✅ All tasks follow required format:
- Checkbox: `- [ ]`
- Task ID: Sequential (T001-T076)
- [P] marker: 28 tasks parallelizable
- [Story] label: All user story tasks labeled (US1-US7)
- Description: Clear action with file path
- Setup/Foundational/Polish: No story labels

**Example Validation**:
- ✅ `- [ ] T013 [US1] Implement ensureDbUser() function in backend/src/services/user-credentials.ts to create PostgreSQL role with schema grants`
- ✅ `- [ ] T028 [P] [US3] Implement POST /api/uploads/excel/sheets endpoint in backend/src/api/uploads.ts using Multer`

---

## Notes

- **No Test Tasks**: Spec does not explicitly request TDD approach; tests can be added later if needed
- **Design System Enforcement**: Phase 11 ensures all UI follows Tailwind 8px spacing, semantic colors, typography scale
- **Independent Stories**: Most user stories are independently implementable and testable (US3, US4, US6 can proceed in parallel)
- **MVP First**: US1 + US7 deliver core value (DB access); other stories enhance UX and discoverability
