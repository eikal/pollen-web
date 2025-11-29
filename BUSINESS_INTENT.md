# Pollen: Business Intention & Vision

**Last Updated**: 2025-11-20  
**Current Phase**: MVP (001-csv-upload-mvp)  
**Status**: Active Development

---

## Executive Summary

**Pollen** is a self-service data platform that empowers business users to upload, manage, and preview their CSV/Excel data without requiring SQL knowledge or data engineering expertise. The MVP delivers a streamlined "upload-to-table" experience with intelligent schema inference, multi-user isolation, and storage quota management.

**Target Users**: Small business owners, operations managers, and analysts who need to centralize spreadsheet data but lack technical database skills.

**Core Value Proposition**: 
> "From spreadsheet to queryable database in under 5 minutes—no SQL, no setup complexity."

---

## Core Mission

**Empower non-technical business users to work with data without needing SQL knowledge or dedicated data engineering teams.**

Pollen makes data accessible by:
1. Simplifying data loading (CSV/Excel → queryable tables with automatic type inference)
2. Providing business-friendly interfaces instead of technical jargon
3. Eliminating manual infrastructure setup (no cloud credentials, no connection strings)
4. Transparent quota management with predictable costs

---

## Target Audience

### Primary Segment (MVP Focus)
- **Small Business Operations Teams**: 5-50 employees, managing order data, inventory, customer lists
- **Characteristics**: 
  - Familiar with Excel/Google Sheets but no SQL knowledge
  - Budget-conscious (< $100/mo acceptable)
  - Need centralized data but can't justify full data engineering hire
  - Time-sensitive (need insights in hours, not weeks)

### Secondary Segments (Post-MVP)
- **Business analysts** in larger organizations needing ad-hoc data exploration
- **Startup analytics teams** with rapid experimentation needs
- **Non-profit program managers** tracking grants, donors, compliance
- **Freelance consultants** consolidating client data

### Anti-Personas (Not Target Users)
- Enterprise data teams with existing Snowflake/BigQuery contracts
- Companies requiring real-time streaming (our MVP is batch-only)
- Organizations needing complex data governance/lineage tracking
- Highly technical data engineers who prefer command-line tools

---

## Business Problem Being Solved Being Solved

### Current Pain Points
1. **Data Fragmentation**: Business data scattered across multiple Excel files, Google Sheets, and local CSVs with no centralized source of truth
2. **Manual Data Updates**: Teams manually copy-paste data between systems, leading to errors and version conflicts
3. **Technical Barriers**: Existing data warehouses (Snowflake, BigQuery, Redshift) require SQL knowledge and DevOps expertise
4. **High Setup Friction**: Traditional ETL tools demand weeks of configuration and dedicated data engineers
5. **Cost Barriers**: Enterprise data platforms price out small teams with usage-based billing and minimum commitments

### Solution Approach (MVP)
- **Zero-Setup Database**: Shared PostgreSQL warehouse with automatic schema-per-user isolation (e.g., `user123.sales`)
- **Intelligent Type Inference**: Automatically detect column types from uploaded files (text, number, date, boolean)
- **Self-Service Operations**: Business-friendly UI for insert, upsert, delete, truncate, and drop without writing SQL
- **Transparent Storage Management**: Real-time quota tracking with warnings at 80% capacity (free plan: 1GB, 20 tables)
- **Async Processing**: Background worker handles file parsing and data loading without blocking the UI
- **Business-Friendly Language**: "My Data" not "Instances", "Data Flow" not "ETL Pipeline" (see `docs/business-glossary.md`)

---

## Product Principles

1. **Business language first**: Never show technical jargon unless absolutely necessary. "Your workspace is ready" not "Instance provisioned successfully."

2. **Self-service over support tickets**: Users should complete 90% of tasks without contacting support. Clear error messages with actionable next steps.

3. **Fail-safe operations**: Require confirmation for destructive actions (drop table). Prevent accidental data loss.

4. **Progressive disclosure**: Start simple (upload CSV), reveal advanced features (upsert, delete by ID) as users gain confidence.

5. **Transparent limits**: Show storage usage upfront. Warn at 80%, block at 100% with clear upgrade path.

---

## MVP Scope (Current Phase)

**In Scope**:
- CSV/Excel file upload (up to 50MB)
- Automatic schema inference and table creation
- Basic ETL operations: insert, upsert, delete, drop, truncate
- Table preview (first 100 rows)
- Storage quota management (1GB free plan, 20 tables max)
- Per-user schema isolation in shared PostgreSQL
- Business-friendly error messages

**Out of Scope (Future)**:
- Scheduled/automated data refreshes
- Real-time streaming data
- Multi-sheet Excel processing
- Advanced SQL query builder
- API access for programmatic uploads
- Custom dashboards/visualizations
- Role-based access control for teams

---

## Success Metrics & KPIs

### Product Metrics (MVP)
- **Activation Rate**: % of signups who upload first file within 7 days → Target: ≥ 60%
- **Time to Value**: Median minutes from signup to first successful table preview → Target: ≤ 5 min
- **Feature Adoption**:
  - Upsert usage: ≥ 40% of users within 30 days
  - Delete-by-ID usage: ≥ 30% of users
  - Table preview usage: ≥ 80% before connecting external BI tool
- **Reliability**: Upload success rate → Target: ≥ 90% without support intervention
- **Engagement**: Weekly active tables (tables accessed in last 7 days) → Target: ≥ 50% of total tables

### Business Metrics
- **Customer Acquisition Cost (CAC)**: Target < $50 for free-to-paid conversion
- **Free-to-Paid Conversion**: % of users upgrading within 90 days of hitting storage warning → Target: ≥ 15%
- **Churn Rate**: Monthly churn for paid plans → Target: < 5%
- **Net Revenue Retention (NRR)**: Expansion revenue from storage upgrades → Target: ≥ 110%

### Technical Health Metrics
- **Upload Latency (p95)**: ≤ 30 seconds for files up to 10MB
- **Upsert Throughput**: ≥ 1,000 rows/second on shared Postgres
- **Error Rate**: Failed operations requiring support escalation → Target: < 2%
- **Storage Quota Accuracy**: ± 1% deviation from actual table sizes

---

## Architectural Strategy

### Why Shared PostgreSQL?
- **Cost**: Single database instance supports 100+ users with schema isolation
- **Simplicity**: No provisioning delays, instant access
- **Familiarity**: PostgreSQL's type system and tooling widely understood
- **Scalability path**: Can migrate power users to dedicated instances later

### Why Schema Isolation?
- **Security**: Users cannot access each other's tables
- **Performance**: Easier to monitor and optimize per-user workloads
- **Flexibility**: Can move schemas to dedicated instances without code changes

### Why Background Worker?
- **Responsiveness**: File uploads don't block UI
- **Reliability**: Retries and error handling without user waiting
- **Scalability**: Horizontal scaling via multiple worker instances

---

## Business Terminology (Summary)

**Always use business-friendly terms in UI/UX:**

| Technical | Business-Friendly |
|-----------|-------------------|
| Instance | Data Workspace, Data Hub |
| ETL Pipeline | Data Flow, Data Connection |
| ETL Job | Data Update, Sync |
| BI Dashboard | Insights, Analytics |
| Schema | Data Structure, Table Layout |
| Provisioning | Setting up, Creating |
| Query | Question, Analysis |

**Full mapping**: See `docs/business-glossary.md`

---

## Business Model & Monetization Strategy

### Free Plan (MVP)
- **Limits**: 1GB total storage, 20 tables maximum
- **Target**: Individual users, small teams (1-3 people)
- **Constraint**: Shared PostgreSQL instance with namespace isolation
- **Conversion Hook**: Storage warnings at 80% trigger upgrade prompts

### Future Paid Plans (Post-MVP)
- **Starter** ($49/mo): 10GB storage, 100 tables, priority support
- **Professional** ($199/mo): 50GB storage, unlimited tables, scheduled refreshes, API access
- **Enterprise** (Custom): Private cloud DWH provisioning (Snowflake/BigQuery/Redshift), SSO, RBAC, SLA

### Revenue Drivers
1. Storage upgrades (primary monetization path)
2. Advanced ETL features (scheduled refreshes, multi-sheet Excel, CDC streaming)
3. Private cloud infrastructure provisioning
4. Professional services for migration/onboarding

---

## Competitive Landscape

### Direct Competitors
| Product | Strengths | Weaknesses (Our Opportunity) |
|---------|-----------|------------------------------|
| **Airtable** | Beautiful UI, spreadsheet-like UX | Poor SQL query support, expensive at scale |
| **Google BigQuery** | Scalable, powerful | Requires SQL knowledge, complex billing |
| **Retool Database** | Developer-friendly | Too technical for business users |
| **Mozart Data** | Managed ETL, Snowflake integration | High pricing ($500+/mo), overkill for small teams |

### Differentiation Strategy
1. **Business-First Language**: "Data Workspace" not "instance", "Data Flow" not "ETL pipeline" (see `docs/business-glossary.md`)
2. **Free Plan with Real Value**: 1GB usable storage vs. competitors' 100MB trials
3. **Zero-Config Onboarding**: No cloud provider credentials, no connection strings—just upload and go
4. **Transparent Pricing**: Storage-based limits (not row-based) easier to estimate costs
5. **Non-Technical UX**: No SQL required for 90% of operations

### Positioning Statement
**vs. Spreadsheets**: More robust, collaborative, queryable. No file size limits or corruption risk.

**vs. Enterprise BI Tools** (Tableau, Power BI): Faster setup, lower cost, no training required. Trade-off: fewer advanced features.

**vs. Cloud DWH** (Snowflake, BigQuery): No infrastructure knowledge needed. Trade-off: shared resources, lower scale.

**vs. Low-Code Tools** (Airtable, Notion): More data-centric, better for analytics vs. project management.

---

## Risk Register

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Shared Postgres performance degradation** | High | Medium | Connection pooling, query timeouts (30s), per-user rate limiting |
| **Type inference errors causing load failures** | Medium | High | Manual type override UI, detailed inference logging for debugging |
| **Storage quota race conditions** | High | Low | Pessimistic locking with pre-flight space reservation |
| **Users accidentally drop critical tables** | High | Medium | Double confirmation (type table name), soft-delete with 7-day recovery |
| **Large Excel files (40-50MB) timeout** | Medium | Medium | Stream processing, fail fast if parsing > 20 seconds, progress indicator |
| **Free plan abuse (spam signups)** | Medium | Medium | Rate limiting, CAPTCHA on signup, email verification |
| **Competitive pricing pressure** | High | Low | Differentiate on UX simplicity, not price; focus on business-friendly language |

---

## Product Vision & Roadmap

### Current State (MVP - Q4 2025)
**Scope**: CSV/Excel upload → Shared Postgres table → Preview in browser

**Core Features**:
- User authentication (JWT-based sign-up/login)
- File upload (CSV/Excel, max 50MB)
- Schema inference (first 1000 rows sampling)
- Basic ETL operations (insert, upsert by key column, delete by ID list, drop, truncate)
- Storage quota tracking (warn at 80%, block at 100%)
- Table preview (first 100 rows)
- Multi-user schema isolation (`user123`, `user456` separate namespaces)

**Success Criteria**:
- Time to first table created: ≤ 5 minutes (P80)
- Upsert operation success rate: ≥ 70% first attempt
- Zero data loss from concurrent operations
- 90% upload success without support intervention

### Phase 2 (Q1 2026) - Enhanced ETL
- Scheduled automatic refreshes (daily/weekly/monthly)
- Multi-sheet Excel support
- CSV encoding auto-detection (UTF-8, Latin-1, Windows-1252)
- Column type override UI (manual corrections to inference)
- Soft-delete with 7-day recovery window

### Phase 3 (Q2 2026) - Connectivity Expansion
- Database connectors (MySQL, PostgreSQL, SQL Server)
- REST API file uploads (programmatic access)
- Webhook triggers for data updates
- Google Sheets live sync
- Shopify/Stripe integration templates

### Phase 4 (Q3 2026) - Analytics & Insights
- No-code query builder ("Filter sales > $1000 in last 30 days")
- Pre-built dashboard templates (e-commerce, SaaS metrics, finance)
- Export to Google Sheets / Excel
- Scheduled email reports
- AI-powered data insights ("Your top product category grew 15% this month")

### Phase 5 (Q4 2026) - Auto-Generated Web Forms
**Business Value**: Transform uploaded data models into data entry interfaces without code

**Core Features**:
- **Smart Form Generation**: Automatically create web forms from Excel/CSV schema
  - Infer input types from columns (text → input, date → datepicker, boolean → checkbox, dropdown from enum values)
  - Apply validation rules from data patterns (email format, number ranges, required fields)
  - Support nested relationships (e.g., "Order" form with embedded "Order Items" repeater)
- **Business Logic Builder**: No-code conditional rules ("Show shipping address if 'Requires Delivery' = Yes")
- **Form Templates**: Pre-configured forms for common business processes (customer intake, product catalog, expense reports)
- **Submission Handling**: Form entries automatically insert/upsert into source tables
- **Mobile-Responsive**: Auto-generated forms work on desktop, tablet, mobile
- **Shareable Links**: Public form URLs with configurable access (open, password-protected, authenticated)

**Use Cases**:
- Small business owners create customer intake forms from their CRM spreadsheet structure
- Event organizers generate registration forms based on attendee data model
- Operations teams build inventory submission forms from product catalog schema
- HR departments create onboarding forms mirroring employee data tables

**Success Metrics**:
- Time to create first form: ≤ 3 minutes from CSV upload
- Form submission-to-database latency: ≤ 2 seconds
- Form adoption rate: ≥ 50% of users create at least one form within 30 days of feature launch
- Mobile form completion rate: ≥ 70% of submissions succeed on mobile devices

**Technical Approach**:
- React-based form renderer with JSON schema configuration
- Automatic validation from column constraints (NOT NULL → required, data type → input validation)
- Webhook support for external integrations (submit form → trigger Zapier/Make automation)
- Form versioning tied to table schema changes (warn users if schema updated after form created)

### Long-Term Vision (2027+)
- Private cloud DWH provisioning (one-click Snowflake/BigQuery setup)
- Collaborative workspaces (team permissions, shared tables)
- Data governance (lineage tracking, PII detection, audit logs)
- Embedded analytics (white-label dashboards for SaaS products)
- Advanced form features (multi-step wizards, file uploads in forms, e-signature integration)

---

## Key Assumptions & Validation Plan

### Critical Assumptions
1. **Assumption**: Business users understand CSV structure (headers, rows) but not SQL  
   **Validation**: User testing with 5 non-technical beta users; measure SQL query attempts in logs

2. **Assumption**: 1GB storage sufficient for typical small business use cases  
   **Validation**: Analyze actual table sizes from beta users; track when users hit 80% warning

3. **Assumption**: Shared Postgres can handle 100+ concurrent users with schema isolation  
   **Validation**: Load testing with 200 simulated users; monitor query latency and connection pool

4. **Assumption**: Type inference from first 1000 rows accurate for 90% of files  
   **Validation**: Track manual type override usage; analyze failed uploads due to type mismatches

5. **Assumption**: Users willing to pay $49/mo when hitting free plan limits  
   **Validation**: Measure conversion rate from 80% storage warning to upgrade click-through

### Known Constraints
- **Shared Postgres Performance**: Row-level locking during concurrent upserts may cause slowdowns (future: partition tables by user_id)
- **File Size Limit (50MB)**: Memory-based parsing prevents larger files (future: streaming parser)
- **No Real-Time Sync**: Batch uploads only; CDC streaming deferred to Phase 3
- **Single-Sheet Excel**: Multi-sheet requires UI complexity (deferred to Phase 2)

---

## Strategic Priorities

### Q4 2025 (Current)
1. ✅ **Ship MVP**: CSV/Excel upload → Postgres table → Preview (5-minute setup)
2. **Beta User Onboarding**: 10 paying pilot customers with weekly feedback sessions
3. **Core Reliability**: 90% upload success rate, zero data loss incidents
4. **Business-Friendly UX**: Validate terminology with non-technical users (avoid SQL jargon)

### Q1 2026
1. **Scheduled Refreshes**: Automated daily/weekly updates (unlock recurring use cases)
2. **Multi-Sheet Excel**: Process all sheets or let users select (removes manual workaround)
3. **Paid Plan Launch**: Starter tier at $49/mo with credit card payments
4. **Customer Support Playbook**: Self-service docs + live chat for paid users

### Q2 2026
1. **Database Connectors**: MySQL, PostgreSQL direct sync (expand beyond files)
2. **API Access**: Programmatic uploads for power users
3. **Referral Program**: 20% lifetime discount for referrals → viral growth loop

---

## Maintenance Instructions

### When to Update This Document
- **Scope Changes**: New features added/removed from roadmap → Update "Product Vision" section
- **Market Shifts**: New competitor analysis or pivot in target segment → Update "Competitive Landscape"
- **Metrics Refinement**: Success criteria adjusted based on data → Update "Success Metrics & KPIs"
- **Strategic Pivots**: Change in monetization model or pricing → Update "Business Model" section
- **Terminology Updates**: Business language adjustments → Sync with `docs/business-glossary.md`

### Review Cadence
- **Monthly**: Review KPIs and adjust targets if needed
- **Quarterly**: Validate assumptions against actual user data; update roadmap phases
- **Post-Feature Launch**: Update "Current State" and success criteria
- **Annual**: Full strategic review with leadership team

### Ownership
- **Primary Owner**: Product Manager
- **Contributors**: Engineering Lead (technical feasibility), Marketing (messaging alignment), Support (customer pain points)
- **Approval**: CEO/Founder for major pivots or roadmap changes

---

## Document History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-21 | Added Phase 5 roadmap: Auto-generated web forms from Excel/CSV data models | AI Assistant |
| 2025-11-20 | Enhanced with comprehensive business model, competitive analysis, success metrics, and maintenance plan | AI Assistant |
| 2025-11-20 | Initial creation based on MVP spec (001-csv-upload-mvp) | AI Assistant |
| TBD | Phase 2 features finalized | Product Team |
| TBD | Paid plan pricing validated with beta cohort | Finance/Product |

---

## Related Documents

- `docs/business-glossary.md` — Canonical business ↔ technical term mappings
- `docs/ai-prompts.md` — AI assistant behavior guidelines
- `specs/001-csv-upload-mvp/spec.md` — Current MVP functional specification
- `README.md` — Technical setup and running instructions
- `.github/copilot-instructions.md` — Development guidelines and tech stack
