# Add-Asset Marketing Tasks (Exposure + Plan Fit)

Goal: Surface all six asset types on marketing pages with clear plan recommendations and CTAs into the app.

Asset types to expose
- Manual file upload (one-time CSV/Excel)
- Scheduled file refresh (recurring uploads)
- External database connection (Postgres/MySQL/SQL Server)
- Cloud storage import (Google Drive/Sheets, Dropbox, S3)
- API/Webhook source (Shopify/Stripe/HubSpot-style)
- Query materialization (scheduled SQL snapshot)

Plan recommendations (marketing copy)
- Free: Manual file upload; preview & basic table actions. Position other asset types as “Upgrade to unlock automation.”
- Starter ($49): Scheduled file refresh (1 schedule), Query materialization (daily), Light cloud file import (Google Sheets/Drive CSV). No DB/API sources.
- Professional ($199): Adds external DB connections, full cloud storage imports (Drive/Dropbox/S3), Multiple schedules, Priority processing.
- Enterprise (Custom): Adds API/webhook sources, advanced adapters, SSO/RBAC, custom SLAs, private deployments.

Tasks
- Copy: Update marketing sections to list all six asset types with the above plan mapping using business-friendly terms (Data Workspace, Data Flow, etc.).
- Home: Add “Data sources we support” strip highlighting all six types with plan badges. File: frontend/components/marketing/Home.tsx.
- Pricing: Add feature matrix rows for each asset type with plan availability; include upgrade nudges for Free. File: frontend/components/marketing/Pricing.tsx.
- Products: Add a dedicated “Data Assets” section with cards per asset type + plan fit. File: frontend/components/marketing/Products.tsx.
- Services: Add onboarding copy for “We set up your Data Flows” mapping to each asset type; note managed setup for Enterprise. File: frontend/components/marketing/Services.tsx.
- CTA wiring: Ensure buttons link to in-app views (`Data Assets`, `Upload`, `Connections`) once available; for now, anchor to top-of-page sections.
- Terminology: Follow docs/business-glossary.md (business language, avoid status codes). Keep sizes/limits in business terms (e.g., “1GB data volume” not “storage in MB”).
- Future hook: Leave room for scheduled refresh toggle on marketing pages so we can gate by plan without redesign.
