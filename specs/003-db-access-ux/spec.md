# Feature: Database Access & UX Polishing

## Summary
Enable end users to securely access their own uploaded data in the database with clear credentials and guidance; improve UI to avoid overlaps, separate the upload form into its own page, clarify actions/buttons, and provide a clear path from "Your Tables" to the database connection details. Add Excel multi-sheet upload testing support, define free plan scope with a premium contact CTA, fix settings page redirect issue, and design UI for production readiness.

## Goals
- Users can obtain DB credentials and connect to their personal data workspace.
- Upload supports Excel multi-sheet selection with predictable results.
- UI avoids visual overlap, clarifies actions, and separates upload into a dedicated page.
- From "Your Tables" users can discover how to connect to the DB.
- Define free plan scope and present a premium upgrade contact option.
- Resolve settings → login redirect issue.
- Polish UI for production quality.

## Non-Goals
- Advanced role-based permissions beyond per-user schema.
- Cross-workspace joins or shared datasets.
- BI dashboards; focus is access + uploads + table management.

## Actors
- End User: uploads files, manages tables, connects to DB.
- Admin/Support: assists with credential recovery; handles premium inquiries.

## User Scenarios & Testing
1. Obtain DB Credentials
   - User navigates to Settings → Data Access.
   - Sees: host, port, database, schema (per-user), username, password.
   - Copies credentials; connects via a standard SQL client.
   - Success when query against `user_<id>.*` returns rows.

2. Connect via External Client
   - User opens DBeaver or psql.
   - Enters credentials; tests `SELECT COUNT(*) FROM user_<id>.sales_data;`.
   - Verifies access limited to their schema.

3. Excel Multi-Sheet Upload
   - User uploads `employees.xlsx` with 2+ sheets.
   - UI prompts sheet selection; preview shows chosen sheet.
   - Creates table; re-uploads selecting a different sheet creates another table or updates depending on chosen operation.

4. Upload UX Clarity
   - Upload form lives on `Upload` page; no overlapping panels.
   - Buttons labeled: Upload, Preview, Create Table, Upsert, Truncate, Drop.
   - Disabled states and confirmations for destructive actions.

5. From Your Tables → DB Access
   - User opens Your Tables; a sidebar/info panel explains how to connect to DB and links to Settings → Data Access.

6. Free Plan & Premium CTA
   - Free plan limits displayed: storage, table count, operations.
   - Premium section offers "Contact Us" CTA that opens a contact form or mailto.

7. Settings Redirect Fix
   - Authenticated user clicking Settings remains on Settings; unauthenticated users are redirected to Login.

## Functional Requirements
FR1. Data Access Panel
- Provide a Data Access section under Settings showing: host, port, database name, schema name, username, password.
- Display a copy-to-clipboard control for each field.
- Include client instructions and sample commands.

FR2. Schema Isolation
- Each user’s tables reside in a dedicated schema named `user_<uuid>` (or equivalent unique identifier).
- Credentials grant access limited to the user’s schema.

FR3. Credential Retrieval
- If a user lacks or forgets credentials, provide a regenerate/reset flow with confirmation.
- Show business-friendly messaging and security warnings.

FR4. Excel Multi-Sheet Support
- Detect all sheets in uploaded Excel files.
- Require user to select a sheet before preview.
- Persist selected sheet in upload session and use it for table creation/upsert.

FR5. Upload Page Separation
- Move upload form into a dedicated page reachable from navigation.
- Prevent UI overlap by using clear layout spacing and sections.

FR6. Action Labels & Confirmations
- Standardize action labels: Create Table, Upsert (by key), Delete Rows, Truncate Table, Drop Table.
- Confirmations required for destructive actions (delete/truncate/drop).

FR7. Your Tables → DB Guidance
- Add a guidance area explaining how to find DB credentials and connect.
- Provide a direct link to Settings → Data Access.

FR8. Free Plan Scope & Premium CTA
- Display free plan limits prominently: storage quota, table count limit, and allowed operations.
- Include a "Contact Us" CTA for premium; opens contact form or mailto to support.

FR9. Settings Redirect Behavior
- If user is authenticated, Settings loads successfully.
- If not authenticated, redirect to Login.
- Log and surface business-friendly error messages for unexpected failures.

FR10. Production UI Polish
- Ensure responsive design across devices.
- Avoid overlapping components; spacing tokens consistent.
- Accessible labels and focus states for interactive elements.

## Success Criteria
- 95% of users locate and copy DB credentials in under 30 seconds.
- 90% of uploads with multi-sheet Excel correctly prompt sheet selection and proceed to table creation without error.
- 0% of authenticated Settings navigations result in unintended login redirects.
- Upload page achieves a task completion rate (create table) above 85% without assistance.
- Free plan limits and premium CTA are visible on Your Tables and Settings; 100% visibility during usability checks.

## Key Entities
- User
- Upload Session (includes selected sheet for Excel)
- Table (within `user_<id>` schema)
- Storage Quota

## Assumptions
- Users have standard SQL client tools available (DBeaver, psql).
- Per-user credentials can be generated and stored securely.
- Schema name `user_<uuid>` matches current design intent.
- Free plan limits: 1GB storage, up to 20 tables, basic operations (insert, upsert, delete, truncate, drop).

## Clarifications
- [NEEDS CLARIFICATION: Should sheet selection allow creating multiple tables at once from one Excel file, or single-sheet per upload only?]
- [NEEDS CLARIFICATION: Premium CTA target — contact form vs. mailto vs. scheduling link?]
- [NEEDS CLARIFICATION: Credential regeneration policy — rotate username/password or only password reset?]

## User Guidance: Connect to Your Data
Provide step-by-step instructions within Settings → Data Access:
1. Copy `Host`, `Port`, `Database`, `Schema`, `Username`, `Password`.
2. Example with DBeaver: create a new PostgreSQL connection, paste values, test connection.
3. Example with psql:
   - `psql -h <HOST> -p <PORT> -U <USERNAME> -d <DATABASE>`
   - Then: `SET search_path TO user_<uuid>; SELECT * FROM sales_data LIMIT 5;`
4. Security: Do not share credentials; rotate if compromised.

## Risks
- Users may leak credentials; mitigate with rotation and reminders.
- Multi-sheet complexity may confuse users; mitigate with clear UX.
- Redirect bug may be intermittent; add telemetry for reproduction.

## Dependencies
- Auth system for Settings access control.
- Upload pipeline supporting Excel parsing with sheet enumeration.
- UI components for Data Access, Upload page, and guidance panels.
