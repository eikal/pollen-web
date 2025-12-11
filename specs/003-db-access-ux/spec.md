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
- Display each credential field with: left-aligned label (text-sm font-medium text-gray-600 uppercase tracking-wide) above value, inline copy button (right-aligned, text-xs px-3 py-1.5), consistent spacing (space-y-4 between fields).
- Use code/monospace font (font-mono) for credential values.
- Include helper text below fields explaining usage (text-xs text-gray-600).
- Provide client instructions and sample CLI commands in code blocks with dark background (bg-gray-900) and syntax highlighting (text-green-400).

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
- Use semantic colors for actions: blue-600 for Create/Upsert (primary), red-600 for Delete/Truncate/Drop (destructive), with appropriate hover states and focus rings.
- Confirmations required for destructive actions (delete/truncate/drop) using modal dialogs with clear warning messages.
- Action buttons should be visually heavier: font-semibold, shadow-sm, with sufficient padding (px-4 py-2.5 minimum).

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
- Use consistent spacing based on Tailwind's 8px base unit scale (p-2/4/6/8/12 for padding, m-2/4/6/8/12 for margins).
- Apply typography scale for visual hierarchy: text-3xl/2xl for page titles (font-bold), text-xl for section headers (font-semibold), text-base for body text (font-medium), text-sm for labels (font-medium), text-xs for helper text (font-normal).
- Use semantic color palette: blue-600 for primary actions, green-600 for success states, red-600 for destructive actions, yellow-50/600 for warnings, gray-50/100/600/900 for neutral UI elements.
- Structure form fields with left-aligned labels above inputs, helper text below inputs, and consistent vertical spacing (space-y-2 for field groups).
- Position copy buttons inline with credential values (right-aligned, text-xs, minimal padding px-3 py-1.5).
- Avoid overlapping components; apply spacing tokens consistently throughout all UI sections.
- Accessible labels and focus states (focus:ring-2 focus:ring-blue-500) for interactive elements.
- Make important elements visually heavier: page titles use text-3xl + font-bold, primary action buttons use font-semibold + shadow-sm.

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

### Session 2025-11-30
- Q: What spacing base unit should the UI design system use to eliminate random px values? → A: 8px base unit using Tailwind's default scale (spacing-2 = 8px, -4 = 16px, -6 = 24px, -8 = 32px, -12 = 48px)
- Q: What typography scale should establish visual weight hierarchy (titles, labels, body text)? → A: Tailwind text scale: text-sm (12px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px) with font-medium/semibold/bold weights
- Q: What color palette should be used for semantic states and UI consistency? → A: Tailwind's default palette with semantic mapping: blue-600 primary actions, green-600 success, red-600 destructive, yellow-50/600 warnings, gray-50/100/600/900 neutrals
- Q: How should form fields be structured to avoid floating elements and maintain left-alignment? → A: Stack layout: left-aligned label (text-sm font-medium) above input, helper text (text-xs text-gray-600) below input, consistent vertical spacing (space-y-2 for field groups)
- Q: Should copy buttons be inline with credential fields or separate action buttons? → A: Inline: small button positioned on the same row as the value (right-aligned), using text-xs with minimal padding (px-3 py-1.5) to maintain visual balance

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
