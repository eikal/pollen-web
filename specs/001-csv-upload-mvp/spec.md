# Feature Specification: CSV/Excel Upload to PostgreSQL (MVP Phase 1)

**Feature ID**: `001-csv-upload-mvp`  
**Created**: 2025-11-13  
**Last Updated**: 2025-11-29  
**Status**: Active Development  
**Phase**: MVP - Direct data upload and basic table management

**Scope**: Self-service CSV/Excel file upload to isolated PostgreSQL schemas with basic ETL operations (insert, upsert, delete, drop, truncate). Free tier: 20 tables max, 1GB storage limit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload First CSV/Excel File (Priority: P1)
A non-technical user signs in, uploads a CSV or Excel file, selects a target table name, and sees the data loaded into their isolated schema in the shared Postgres warehouse.

**Why this priority**: Core value proposition - getting data into a queryable warehouse in minutes.

**Independent Test**: From sign-up to first successful data load in ≤5 minutes; table appears in user's table list; data queryable via simple preview.

**Acceptance Scenarios**:
1. **Given** a new user with empty schema, **When** user uploads valid CSV with headers, **Then** system infers column types, creates table in user's schema (e.g., `user123.sales`), and loads all rows.
2. **Given** uploaded file exceeds 50MB, **When** user attempts upload, **Then** system rejects with message: "File too large. Please split into smaller files or compress."
3. **Given** CSV with malformed rows, **When** upload completes, **Then** system shows count of successfully loaded rows and count of skipped rows with error details.

---

### User Story 2 - Upsert Data by Key Column (Priority: P2)
User uploads a CSV to update existing table data using a specified key column (e.g., `product_id`). Matching rows are updated; new rows are inserted.

**Why this priority**: Enables incremental data updates without manual SQL.

**Independent Test**: Upload initial dataset, then upload updated CSV with same key column; verify existing rows updated and new rows added; no duplicates created.

**Acceptance Scenarios**:
1. **Given** existing table with `product_id` column, **When** user uploads CSV and selects "Upsert by product_id", **Then** rows with matching IDs are updated, new IDs are inserted.
2. **Given** CSV contains rows with NULL in key column, **When** upsert operation runs, **Then** system skips NULL-key rows and displays count: "Skipped 5 rows with NULL key values."
3. **Given** key column doesn't exist in target table, **When** user selects it, **Then** operation fails with message: "Key column 'product_id' not found in table."

---

### User Story 3 - Delete Rows by ID List (Priority: P3)
User wants to remove specific rows from a table by providing a list of IDs via comma-separated input.

**Why this priority**: Supports data cleanup without SQL knowledge.

**Independent Test**: User enters "123, 456, 789" in delete ID field; verifies 3 rows removed; other data untouched.

**Acceptance Scenarios**:
1. **Given** a table with ID column, **When** user enters comma-separated IDs (e.g., "10, 20, 30") and confirms, **Then** system deletes matching rows and shows "Deleted 3 rows."
2. **Given** ID list contains non-existent IDs, **When** delete runs, **Then** system reports: "Deleted 2 of 5 IDs (3 not found)."
3. **Given** malformed ID input (e.g., "abc, 123"), **When** user submits, **Then** validation error: "Invalid ID format. Use numbers separated by commas."

---

### User Story 4 - Drop and Truncate Tables (Priority: P4)
User needs to completely remove a table (drop) or clear all data while keeping structure (truncate).

**Why this priority**: Essential table lifecycle management for non-technical users.

**Independent Test**: User drops test table; table disappears from list. User truncates table; structure remains but row count = 0.

**Acceptance Scenarios**:
1. **Given** a table in user's schema, **When** user selects "Drop Table" and confirms, **Then** table is deleted and removed from table list.
2. **Given** a table with data, **When** user selects "Truncate Table" and confirms, **Then** all rows deleted but table structure preserved.
3. **Given** drop/truncate action, **When** user confirms, **Then** system requires secondary confirmation: "This action cannot be undone. Type table name to confirm."

---

### User Story 5 - Monitor Storage Usage (Priority: P5)
User on free plan (1GB limit) views current storage consumption and receives warning when approaching limit.

**Why this priority**: Prevents unexpected failures and prompts upgrade path.

**Independent Test**: User at 850MB sees warning banner; at 1GB upload blocked with upgrade prompt.

**Acceptance Scenarios**:
1. **Given** user has consumed 850MB of 1GB, **When** dashboard loads, **Then** warning displays: "Storage 85% full (850MB/1GB). Consider upgrading or deleting unused tables."
2. **Given** user at 1GB limit, **When** attempting new upload, **Then** operation blocked with message: "Storage limit reached. Please delete tables or upgrade to continue."
3. **Given** user deletes large table, **When** storage recalculated, **Then** updated usage reflects freed space within 1 minute.

---

### Edge Cases
- Duplicate table name on upload → System appends timestamp suffix (e.g., `sales_20251115_143022`) and notifies user.
- Excel file with multiple sheets → System processes only first sheet by default; offers sheet selector in UI.
- CSV with inconsistent column counts → System pads short rows with NULLs and logs warning.
- Concurrent uploads to same table → Queue operations sequentially; show "Processing..." status.
- Storage quota check race condition → Pessimistic locking: reserve space before upload starts.
- Non-UTF8 encoding in CSV → Attempt auto-detection (Latin-1 fallback); fail with encoding hint if unreadable.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST accept CSV and Excel (.xlsx) file uploads up to 50MB per file.
- **FR-002**: System MUST create a dedicated Postgres schema per user (e.g., `user123`) for table isolation in shared database.
- **FR-003**: System MUST enforce free plan limits: maximum 20 tables per user, 1GB total storage across all tables.
  - Display quota in multiple locations: persistent header widget ("X MB / Y GB (Z%)"), pre-upload warning on /uploads page, quota banner on /my-data page with table count.
  - Block uploads exceeding quota with business-friendly error message.
  - Calculate quota from user schema size (pg_total_relation_size aggregated).
- **FR-004**: System MUST infer column data types from uploaded files (text, integer, decimal, date, boolean).
- **FR-005**: System MUST support INSERT operation: create new table and load all rows from uploaded file.
- **FR-006**: System MUST support UPSERT operation: update existing rows by key column, insert new rows.
- **FR-007**: System MUST reject rows with NULL values in the specified upsert key column and report skipped row count.
- **FR-008**: System MUST support DELETE operation: remove rows matching comma-separated ID list provided by user.
- **FR-009**: System MUST support DROP TABLE operation with double confirmation (require typing table name).
- **FR-010**: System MUST support TRUNCATE TABLE operation: delete all rows while preserving table structure.
- **FR-021**: System MUST provide unified ETL operations interface where users select operation type (insert, upsert, delete) from single page; DROP and TRUNCATE accessible as actions from table list.
- **FR-022**: System MUST include only MVP-scoped pages in navigation: /uploads (primary), /my-data (table list), /auth (login/signup); non-MVP pages (products, services, environment, instances) removed from codebase or commented out.
- **FR-023**: System MUST implement ETL operations interface using refactored ETLWizard.tsx component (or renamed equivalent) with operation type selector; component should support INSERT, UPSERT, DELETE operations from single form.
- **FR-024**: System MUST display storage quota status in: (1) persistent navigation header widget showing current usage/limit/percentage, (2) /uploads page with pre-upload validation warnings, (3) /my-data page banner showing table count and storage usage.
- **FR-011**: System MUST display storage usage dashboard showing consumed/total storage (e.g., "850MB / 1GB").
- **FR-012**: System MUST warn users at 80% storage capacity (800MB of 1GB).
- **FR-013**: System MUST block new uploads when storage limit (1GB) reached and display upgrade prompt.
- **FR-014**: System MUST recalculate storage usage within 1 minute after table deletion or truncation.
- **FR-015**: System MUST provide table list view showing table name, row count, size (MB), last updated timestamp.
- **FR-016**: System MUST allow users to preview table data (first 100 rows) without external SQL client.
- **FR-017**: System MUST log all ETL operations (upload, upsert, delete, drop, truncate) with user ID, timestamp, status, row counts.
- **FR-018**: System MUST handle Excel files with multiple sheets by processing first sheet only (sheet selector deferred to future phase).
- **FR-019**: System MUST provide business-friendly error messages (e.g., "Column mismatch" instead of "SQL error 42P01").
- **FR-020**: System MUST queue concurrent operations on same table sequentially to prevent conflicts.

### Non-Functional Requirements
- **NFR-001**: File upload processing MUST complete within 30 seconds for files up to 10MB (p95 latency).
- **NFR-002**: Upsert operation MUST process ≥1,000 rows/second on shared Postgres (baseline target).
- **NFR-003**: Storage quota check MUST use pessimistic locking to prevent race conditions during concurrent uploads.
- **NFR-004**: System MUST support UTF-8 and Latin-1 encoding with automatic detection fallback.
- **NFR-005**: Schema isolation MUST prevent cross-user table access (enforced via Postgres RLS or connection-level search_path).
- **NFR-006**: Uploaded files MUST be deleted from temporary storage within 5 minutes after successful processing.
- **NFR-007**: System MUST log failed operations with stack trace to backend logs (not shown to user).

### Key Entities
- **User Schema**: Postgres schema (e.g., `user123`) containing all tables for a single user; created on first upload.
- **Table**: User-created table within their schema (name, column definitions, row count, size_mb, created_at, updated_at).
- **ETL Operation**: Audit log entry (id, user_id, operation_type: insert|upsert|delete|drop|truncate, table_name, status: success|failed, rows_affected, error_message, created_at).
- **Storage Quota**: Per-user tracking (user_id, total_tables, total_size_mb, limit_mb: 1024, last_calculated_at).
- **Upload Session**: Temporary record during file processing (session_id, user_id, filename, file_size_bytes, status: uploading|processing|completed|failed, progress_pct).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: First table created (CSV upload → table visible) within ≤5 minutes from account sign-up for ≥80% of users.
- **SC-002**: Upsert operation completes successfully on first attempt for ≥70% of users (no key column confusion).
- **SC-003**: Delete-by-ID operation used by ≥40% of active users within first 30 days.
- **SC-004**: Zero data loss incidents due to concurrent operation conflicts (queuing effectiveness).
- **SC-005**: ≥90% of uploads succeed without manual support intervention (error handling clarity).
- **SC-006**: Storage warning (80% threshold) triggers upgrade consideration by ≥15% of warned users within 7 days.
- **SC-007**: Table preview feature used by ≥60% of users before connecting external BI tool (validates self-service value).

## Assumptions
- Users are familiar with CSV/Excel structure (headers, rows, columns) but not SQL.
- Shared Postgres instance can handle 100+ concurrent users with schema-level isolation.
- Free plan storage (1GB) sufficient for typical small business datasets (5-10 tables, 50k-200k rows total).
- Background job orchestration (Airflow) available but UI exposure deferred to post-MVP phase.
- Type inference heuristics (first 100 rows sampling) acceptable for 90% of use cases.

## Constraints
- Shared Postgres cluster: no user gets root or superuser access.
- File size hard limit: 50MB to prevent memory exhaustion on upload processing.
- Free plan caps: 20 tables, 1GB storage (enforced pre-upload to avoid partial failures).
- No real-time collaboration: operations are single-user sequential.
- Excel processing limited to first sheet only (multi-sheet support requires additional UI complexity).

## Risks & Mitigations
- **Risk**: Type inference errors cause data load failures. **Mitigation**: Provide manual column type override UI; log inference decisions for debugging.
- **Risk**: Storage quota race conditions allow over-limit uploads. **Mitigation**: Pessimistic locking with pre-flight quota reservation.
- **Risk**: Large Excel files (40-50MB) cause timeout during parsing. **Mitigation**: Stream processing with progress indicator; fail fast if parsing exceeds 20 seconds.
- **Risk**: Users accidentally drop critical tables. **Mitigation**: Require typing exact table name for drop confirmation; consider soft-delete with 7-day recovery window (deferred).
- **Risk**: Shared Postgres performance degradation under heavy load. **Mitigation**: Connection pooling, query timeout enforcement (30s), per-user query rate limiting (future).

## Out of Scope (Deferred to Later Phases)
- **Onboarding wizard**: Users land directly on /uploads page after login
- **Connection wizard**: External data sources (Google Sheets, MySQL, APIs) - Phase 2
- **Data products UI**: Dashboards, reports, calculators - Phase 4
- **Scheduled refreshes**: Automated ETL jobs via Airflow - Phase 3
- **Private cloud provisioning**: Dedicated warehouse instances - Phase 5
- **Real-time sync**: CDC/streaming ingestion - Phase 6
- **SQL query builder**: Complex query interface - Phase 7
- **Multi-sheet Excel**: Sheet selector and multi-import - Phase 9
- **Team features**: RBAC, shared workspaces - Phase 10
- **REST API**: Programmatic data upload endpoints - Phase 8

## Glossary
- **User Schema**: PostgreSQL schema (namespace) isolating one user's tables (e.g., `user_abc123`)
- **ETL Operation**: Data manipulation action (insert, upsert, delete, drop, truncate)
- **Upsert**: Merge operation updating existing rows by key and inserting new rows
- **Storage Quota**: Per-user data size limit (1GB free tier)
- **Table Preview**: Read-only view of first 100 rows for validation
- **Upload Session**: Temporary processing state tracking file-to-table conversion

## Completion Signals
- All functional requirements (FR-001 to FR-024) implemented and verified
- Upload → Insert, Upsert, Delete, Drop, Truncate flows working end-to-end
- Storage quota enforcement blocks uploads at 100% capacity in all test scenarios
- Multi-user concurrent operation handling validated (no race conditions)
- Business-friendly error messages user-tested with non-technical users

## Future Phases (Out of Current Scope)
- **Phase 2**: External data source connectors (Google Sheets, databases)
- **Phase 3**: Scheduled/automated data refreshes with Airflow UI exposure
- **Phase 4**: Dashboards, reports, and data products
- **Phase 5**: Private cloud DWH provisioning (paid plans)
- **Phase 6**: Real-time CDC/streaming data ingestion
- **Phase 7**: Advanced SQL query builder and collaboration features
- **Phase 8**: API access for programmatic uploads
- **Phase 9**: Multi-sheet Excel processing
- **Phase 10**: RBAC and team workspace features

## Development History

### 2025-11-13: Initial Planning
- Drafted comprehensive feature spec
- Defined multi-tenant architecture with schema isolation

### 2025-11-15: MVP Scope Simplification
- Removed onboarding wizard (direct /uploads entry)
- Deferred external connectors to Phase 2
- Focused on core upload-to-table flow

### 2025-11-28: UI/UX Refinement
- Unified ETL operations interface
- Added persistent storage quota widget in header
- Removed non-MVP navigation pages
- Defined quota display locations (header, uploads, my-data)

### 2025-11-29: Specification Cleanup
- Renamed to Phase 1 MVP
- Reorganized out-of-scope items into future phases
- Clarified completion criteria
