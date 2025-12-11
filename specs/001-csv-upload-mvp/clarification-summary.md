# UI Scope Clarification Summary

**Feature**: 001-csv-upload-mvp (MVP)  
**Session Date**: 2025-11-28  
**Method**: speckit.clarify.prompt.md workflow  
**Questions Asked**: 5 of 5 (max limit)

---

## Session Overview

**Problem Identified**: UI components in codebase (OnboardingWizard, ConnectionWizard, ETLWizard, pages for products/services/environment/instances) did not align with the 5 user stories defined in spec.md. This created ambiguity about which UI elements belong in this MVP phase.

**Resolution Approach**: Systematically clarified UI scope boundaries through 5 targeted questions, integrating answers directly into spec.md after each response.

---

## Clarifications Recorded

### Q1: Primary Entry Point
- **Question**: Which UI flow should be the primary entry point for users in this MVP?
- **Options**: (A) Onboarding wizard, (B) Direct upload page, (C) Table list page
- **Answer**: **B - Direct upload page** - users go straight to /uploads after login (no wizard)
- **Impact**: 
  - OnboardingWizard.tsx explicitly marked as out of scope
  - Updated "Out of Scope" section to clarify no onboarding wizard in MVP
  - Removed ambiguity about first-time user flow

---

### Q2: ETL Operations Organization
- **Question**: Should all ETL operations be available from a single unified interface or separate pages?
- **Options**: (A) Single unified page, (B) Separate pages per operation, (C) Mixed approach
- **Answer**: **A - Single ETL operations page** with operation type selector (dropdown/tabs for insert/upsert/delete; drop/truncate as table actions)
- **Impact**:
  - Added new requirement **FR-021**: Unified ETL operations interface
  - Clarified that DROP and TRUNCATE are table-level actions, not separate ETL operations
  - Reduced UI complexity by consolidating insert/upsert/delete into single form

---

### Q3: Non-MVP Pages Disposition
- **Question**: What should happen to non-MVP pages (products.tsx, services.tsx, environment.tsx, instances/[id].tsx)?
- **Options**: (A) Keep with redirect, (B) Remove entirely, (C) Keep with disabled UI
- **Answer**: **B - Remove or comment out entirely** - keep only MVP-scoped pages
- **Impact**:
  - Added new requirement **FR-022**: Only /uploads, /my-data, /auth pages in navigation
  - Explicitly listed non-MVP pages to be removed in "Out of Scope" section
  - Simplified codebase to match spec scope exactly

---

### Q4: ETLWizard Component Usage
- **Question**: How should the existing ETLWizard.tsx component be used?
- **Options**: (A) Repurpose as unified interface, (B) Remove and build new, (C) Describe relationship
- **Answer**: **A - Repurpose ETLWizard** as unified ETL operations interface (rename to ETLOperationsPage.tsx or similar)
- **Impact**:
  - Added new requirement **FR-023**: Implement ETL operations using refactored ETLWizard
  - Avoided duplicate effort by reusing existing component
  - Clarified component's role in FR-021 unified interface

---

### Q5: Storage Quota Display Location
- **Question**: Where should storage quota information be displayed in the UI?
- **Options**: (A) Nav header only, (B) Upload page only, (C) Table list only, (D) All locations
- **Answer**: **D - All of the above** - header widget + contextual warnings on /uploads + quota banner on /my-data
- **Impact**:
  - Enhanced **FR-003** with detailed display requirements
  - Added new requirement **FR-024**: Multi-location quota display specification
  - Ensured quota visibility at decision points (header=always, /uploads=pre-upload, /my-data=post-upload)

---

## Spec Changes Summary

### Sections Modified
1. **Clarifications** (new section): Added Session 2025-11-28 with 5 Q&A pairs
2. **Out of Scope (Explicit)**: Added entries for onboarding wizard, connection wizard, non-MVP pages
3. **Functional Requirements**: 
   - Enhanced FR-003 (storage quota enforcement) with display details
   - Added FR-021 (unified ETL operations interface)
   - Added FR-022 (MVP-only page navigation)
   - Added FR-023 (ETLWizard refactoring)
   - Added FR-024 (multi-location quota display)

### New Requirements Count
- **4 new functional requirements** (FR-021 to FR-024)
- **1 enhanced requirement** (FR-003 expanded with display specifications)
- **3 explicit out-of-scope entries** (onboarding wizard, connection wizard, non-MVP pages)

---

## Coverage Analysis

| Category | Status | Coverage Details |
|----------|--------|------------------|
| **UI Entry Points** | ✅ Resolved | Primary entry point clarified (/uploads), onboarding wizard out of scope |
| **Page Structure** | ✅ Resolved | Only /uploads, /my-data, /auth pages; non-MVP pages removed |
| **ETL Interface** | ✅ Resolved | Single unified page with operation selector (FR-021, FR-023) |
| **Component Reuse** | ✅ Resolved | ETLWizard.tsx repurposed as unified interface |
| **Quota Display** | ✅ Resolved | Multi-location display specified (header + uploads + my-data) |
| **Navigation Flow** | ✅ Resolved | Login → /uploads (no wizard), table list at /my-data |
| **Data Model** | ⏭️ Deferred | No ambiguities identified in 5 user stories |
| **API Contracts** | ⏭️ Deferred | Upload/ETL endpoints match user stories |
| **Error Handling** | ⏭️ Deferred | Business-friendly messages already specified in FR-019 |
| **Performance** | ⏭️ Deferred | NFRs already defined (upload <30s, upsert 1k rows/s) |

**Resolved**: 6 of 6 UI-related ambiguities  
**Deferred**: 4 categories (no critical gaps found in 5-question limit)

---

## Remaining Ambiguities (Low Priority)

These were **not** addressed due to 5-question limit but may need clarification in implementation phase:

1. **Operation History Display**: FR-017 requires ETL operation logging, but UI placement not specified (could be on /my-data page as tab or separate modal)
2. **Table Preview UI**: FR-016 requires first 100 rows preview, but interaction model unclear (modal vs inline vs dedicated page)
3. **Error Message Styling**: FR-019 requires business-friendly errors, but visual design not specified (toast, banner, inline)
4. **Multi-Sheet Excel Selector**: FR-018 says first sheet only, but unclear if UI shows sheet name or just assumes first

**Recommendation**: These are **implementation details** that don't block spec approval. Can be clarified during UI wireframing or resolved by frontend team using standard patterns.

---

## Next Steps

### Immediate Actions
1. **Remove non-MVP components**: Delete or comment out OnboardingWizard.tsx, ConnectionWizard.tsx
2. **Remove non-MVP pages**: Delete products.tsx, services.tsx, environment.tsx, instances/[id].tsx
3. **Refactor ETLWizard**: Rename to ETLOperationsPage.tsx and implement operation type selector UI
4. **Add quota widgets**: Implement header widget, /uploads pre-upload warning, /my-data quota banner

### Spec Approval Checklist
- [x] All 5 user stories have independent test scenarios
- [x] UI scope aligned with user stories (FR-021 to FR-024)
- [x] Out-of-scope items explicitly documented
- [x] Entry point and navigation flow clarified
- [x] Component reuse strategy defined

### Ready for /speckit.plan?
**Yes** - No blocking ambiguities remain. The spec now clearly defines:
- Which UI components belong in MVP (UploadWizard, TableList, TablePreview, SchemaPreview, refactored ETLWizard)
- Which components are out of scope (OnboardingWizard, ConnectionWizard, non-MVP pages)
- How ETL operations are organized (single unified interface)
- Where quota information appears (header + uploads + my-data)

Proceed to `npm run speckit.plan` to break down implementation tasks.

---

## Appendix: Full Clarifications Text (as recorded in spec.md)

```markdown
## Clarifications

### Session 2025-11-28 (UI Scope Clarification)
- Q: Which UI flow should be the primary entry point for users in this MVP? → A: Direct upload page - users go straight to /uploads after login (no wizard).
- Q: Should all ETL operations be available from a single unified interface or separate pages? → A: Single ETL operations page with operation type selector (dropdown/tabs for insert, upsert, delete; drop/truncate as table actions).
- Q: What should happen to non-MVP pages (products, services, environment, instances)? → A: Remove or comment out entirely - keep only MVP-scoped pages.
- Q: How should ETLWizard.tsx component be used? → A: Repurpose as unified ETL operations interface (rename to ETLOperationsPage.tsx or similar); implement operation type selector UI within this component.
- Q: Where should storage quota information be displayed? → A: Multiple locations - persistent widget in navigation header showing "X MB / Y GB (Z%)" + contextual warnings on /uploads page (pre-upload validation) + quota banner on /my-data page with table count.
```
