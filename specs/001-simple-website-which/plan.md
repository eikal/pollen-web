# Implementation Plan: One-Click DWH (Feature 001 - simple-website-which)

**Branch**: `001-simple-website-which` | **Date**: 2025-10-31 | **Spec**: `spec.md`
**Input**: Feature specification: `specs/001-simple-website-which/spec.md`

## Summary

Build a small customer-facing website with pages (About, Pricing, Authentication, Products, Services) and a "one-click DWH" onboarding flow that provisions a managed cloud data warehouse into the customer's cloud account. The product will ship prescriptive bundled offerings to simplify choices for non-technical users:

- Basic Plan: provisioned DWH in customer's account + ETL tool with three starter templates (DB clone with delta, Excel/CSV import, API ingestion) + BI tool with starter dashboards. Use open-source building blocks (Airbyte, dbt, Metabase/Superset) where possible.
- Premium Plan: everything in Basic plus data catalog (DataHub/Amundsen), API gateway (Kong/Tyk), and a federation/query layer (Trino) to virtualize queries across sources.

The v1 plan delivers: SSO-based authentication, an onboarding flow to grant provisioning permissions, a pluggable adapter model for DWH providers, starter ETL templates, and a pre-configured BI instance.

Measurable v1 outcomes:
- Provisioning success (instance created and connection returned) for at least one provider within 10 minutes for 90% of attempts.
- Successful SSO login and organization-level RBAC for provisioning tested with one identity provider (Azure AD or Google Workspace).
- Basic website pages (About, Pricing, Products, Services) with working nav and an authenticated onboarding flow.
- Starter ETL templates executed successfully (mock sources) and a starter dashboard populated after provisioning.

## Technical Context

This plan assumes a web application with a backend API responsible for provisioning and orchestration, and a frontend for customer-facing pages and onboarding.

- Language / Runtime: Node.js (backend) + React (frontend) — RECOMMENDED (final choice in Phase 0 research).  
- Primary Dependencies (proposed): Express/Fastify or Next.js API routes; React/Next.js for frontend; provider SDKs (snowflake-sdk, @google-cloud/bigquery, aws-sdk).  
- Storage: small relational DB for metadata (Postgres recommended) to store feature flags, org config, provisioning records (no customer data stored in our DB by default).  
- Auth: OIDC/OAuth SSO integrations (Azure AD, Google, Okta).  
- Testing: unit tests (Jest), integration tests (Playwright / Cypress for e2e), contract tests for provisioning adapters.  
- Deployment: containerized services (Docker) deployable to cloud (AWS/GCP/Azure) — specifics deferred to infra team.  

Performance & Constraints:
- Provisioning operations are long-running and must be implemented asynchronously with polling and webhook support where available.  
- Security: must never store long-lived plaintext credentials; use short-lived tokens or explicit customer-provided service accounts/roles; all secrets stored in a secret manager.  

## Phase plan (high level)

Phase 0 — Research (1 week)
- Confirm final tech stack (Node/React recommended) and provider SDK choices.  
- Identify exact provisioning flows for Snowflake, BigQuery, Redshift and required permissions.  
- Create data-model.md (metadata schema for org, provisioning jobs, adapters).  

Phase 1 — MVP (2–3 sprints)
- Implement core backend service with adapter interface and Snowflake adapter.  
- Implement SSO/OAuth sign-in and org onboarding flow (role/service-account instructions).  
- Frontend: pages (About, Pricing, Products, Services) and a guarded onboarding page with provider selection and provisioning wizard.  
- Tests: unit + integration tests for adapter, onboarding flow, auth.  
- ETL: Install/configure Airbyte (or run embedded connectors) and implement three starter templates and a simple UI wizard for scheduling.
- BI: Provision a Metabase or Superset instance and create a starter dashboard template connected to the provisioned DWH.

Phase 2 — Providers & Hardening (2 sprints)
- Add BigQuery and Redshift adapters.  
- Add telemetry, logging, observability (metrics for provisioning time/failure).  
- Security review and automated rotation docs for issued credentials.  
- Add Data Catalog integration and API Gateway options for Premium plan.  
- Implement federation/query layer (Trino) for Premium users and ensure role isolation and query governance.

Phase 3 — Ops & Pricing (ongoing)
- Billing/pricing integration, production rollout, and SLA targets.  

## Project Structure (recommended)

```
backend/
├── src/
│   ├── adapters/           # DWH adapters (snowflake, bigquery, redshift)
│   ├── api/                # REST / GraphQL endpoints
│   ├── auth/               # SSO/OIDC integrations
│   ├── services/           # provisioning orchestration, jobs
│   └── models/             # DB models for orgs, jobs, adapters
frontend/
├── src/
│   ├── pages/              # About, Pricing, Products, Services, Onboarding
│   └── components/
infra/
├── docker/                 # containers and deployment manifests
specs/001-simple-website-which/
├── spec.md
├── plan.md
├── data-model.md
└── tasks.md
```

## Acceptance Criteria (v1)

- A logged-in org admin (via SSO) can complete the onboarding flow and provision a Snowflake instance in their account (or create necessary role/service account and verify connectivity).  
- The provisioning job records a final state (SUCCESS/FAILED) and returns connection details (hostname, port, user, method) to the UI.  
- Secrets are not persisted as long-lived plaintext; any credentials are short-lived or stored encrypted and rotatable.  
- Automated tests cover the adapter interface and mock provisioning flows.  

## Risks & Mitigations

- Risk: Provider onboarding complexity (varies by provider). Mitigation: Phase 0 research and implement adapter interface to isolate provider-specific code.  
- Risk: Security/compliance concerns with provisioning into customer accounts. Mitigation: Require customer to create least-privilege roles/service accounts and document steps; do not store long-lived credentials.  
- Risk: Long-running provisioning operations failure modes. Mitigation: Implement retries, idempotency, and clear error reporting with a rescue/retry UI.

## Next immediate tasks

- Create `data-model.md` capturing metadata schema for orgs, provisioning jobs, adapter configs.  
- Create `tasks.md` containing prioritized tasks, owners, and estimates (P1 tasks: adapter interface, Snowflake adapter, SSO onboarding, frontend pages, DB schema).  

## Notes

- This plan intentionally defers pricing, billing, and detailed infra decisions to Phase 2/3.  
- The spec's Clarifications section is the authoritative record for the selected deployment model, auth choice, and provider strategy.

