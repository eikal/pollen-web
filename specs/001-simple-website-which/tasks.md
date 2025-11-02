# Tasks: One-Click DWH (001 - simple-website-which)

Priority legend: P1 (must-have for MVP), P2 (important, next), P3 (nice-to-have)

## P1 - Core implementation

- T001 - Design adapter interface (backend)
  - Description: Define a pluggable adapter contract for provisioning (create, status, destroy, credentials).
  - Estimate: 1d
  - Owner: @backend
  - Checklist:
    - [ ] Define adapter interface methods: create(), status(), destroy(), credentials(), validateConfig()
    - [ ] Document idempotency and error models
    - [ ] Provide example adapter skeleton in TypeScript
  - Acceptance criteria:
    - Adapter interface doc present in repo (docs/adapters.md)
    - Example adapter skeleton compiles and includes unit tests for the contract

- T002 - Implement Snowflake adapter (backend)
  - Description: Implement the adapter to provision Snowflake objects in the customer's account or project, following the adapter contract.
  - Estimate: 3d
  - Owner: @backend
  - Acceptance: adapter unit tests + mocked end-to-end provisioning test
  - Checklist:
    - [ ] Implement create()/status()/destroy()/credentials() using snowflake-sdk (mocked)
    - [ ] Add unit tests mocking Snowflake responses
    - [ ] Add integration test using a sandbox or mocked end-to-end flow
  - Acceptance criteria:
    - All unit tests pass locally
    - Integration test demonstrates provisioning job reaching SUCCESS in mock environment

- T003 - Authentication: SSO/OAuth integration (backend + frontend)
  - Description: Implement OIDC flows for at least one provider (Azure AD or Google) and org-level RBAC.
  - Estimate: 3d
  - Owner: @auth
  - Acceptance: automated login test and RBAC test
  - Checklist:
    - [ ] Add OIDC configuration and environment variable schema
    - [ ] Implement backend OIDC callback and session creation (JWT or server session)
    - [ ] Implement org admin role assignment and RBAC checks for provisioning APIs
    - [ ] Add e2e test for login + access control
  - Acceptance criteria:
    - SSO login flow works in local dev (stubbed IdP)
    - Provisioning endpoints enforce admin-only access

- T004 - Onboarding wizard (frontend)
  - Description: Create provider selection UI, instructions for granting provisioning permissions, and a submit button to start provisioning.
  - Estimate: 3d
  - Owner: @frontend
  - Acceptance: end-to-end happy-path: SSO login → onboard → provisioning job submitted
  - Checklist:
    - [ ] Implement onboarding pages: provider selection, permission instructions, credential input
    - [ ] Wire onboarding form to backend API to create ProvisioningJob
    - [ ] Add client-side validation and friendly error messages
  - Acceptance criteria:
    - User can complete wizard and see provisioning job created in UI
    - Validation prevents malformed inputs

- T005 - Provisioning orchestration service (backend)
  - Description: Implement job queue, async worker, state machine for provisioning jobs (PENDING, RUNNING, SUCCESS, FAILED).
  - Estimate: 3d
  - Owner: @backend
  - Acceptance: job lifecycle unit tests and recovery tests
  - Checklist:
    - [ ] Define job state machine and persistence model
    - [ ] Implement queue (Bull / RabbitMQ / simple DB polling) and worker skeleton
    - [ ] Implement retry/backoff and idempotency handling
    - [ ] Add audit logging and correlation ids
  - Acceptance criteria:
    - Worker processes jobs and updates job status correctly in DB
    - Retries and idempotency prevent duplicate provisioning

- T006 - Metadata DB schema & migration (Postgres)
  - Description: Create tables for orgs, adapter configs, provisioning jobs, and audit logs.
  - Estimate: 1d
  - Owner: @backend
  - Checklist:
    - [ ] Create SQL migration files for Organization, User, AdapterConfig, ProvisioningJob, ProvisionedInstance, AuditLog
    - [ ] Add indexes and FK constraints per `data-model.md`
    - [ ] Add local seed data and migration test
  - Acceptance criteria:
    - Migrations run successfully in local dev and CI
    - Seed script creates sample org and mock adapter config

- T007 - ETL templates and connectors (Airbyte + UI)
  - Description: Install/configure Airbyte (or embed connectors) and create three starter templates (DB clone with delta, Excel/CSV import, API ingestion). Provide a simple frontend wizard to configure and schedule templates.
  - Estimate: 4d
  - Owner: @backend / @integration
  - Acceptance: end-to-end template run (mock source) and UI scheduling

- T008 - BI integration and starter dashboards (Metabase/Superset)
  - Description: Provision a BI tool instance and ship a starter dashboard for common app metrics; connect to the provisioned DWH automatically after provisioning.
  - Estimate: 3d
  - Owner: @frontend / @backend
  - Acceptance: dashboard populated with sample metrics after provisioning

## P2 - Additional providers & features

- T010 - BigQuery adapter
  - Estimate: 3d
  - Owner: @backend

- T011 - Redshift adapter
  - Estimate: 3d
  - Owner: @backend

- T012 - Telemetry & observability
  - Description: Add metrics (provisioning duration, failure rate), structured logging, and dashboards.
  - Estimate: 2d
  - Owner: @devops

- T013 - Data catalog integration (DataHub / Amundsen)
  - Description: Integrate an open-source data catalog for schema discovery and lineage and connect it to provisioned instances for the Premium plan.
  - Estimate: 4d
  - Owner: @backend / @data

- T014 - API Gateway integration (Kong/Tyk)
  - Description: Provide an API gateway for premium users to expose curated datasets as APIs; include auth patterns and rate limiting.
  - Estimate: 3d
  - Owner: @backend / @infra

- T015 - Federation / query layer (Trino)
  - Description: Implement a federation layer or Trino connector to allow virtualized queries across multiple sources for Premium users.
  - Estimate: 4d
  - Owner: @backend

## P3 - Hardening & polish

- T020 - Pricing & billing integration
  - Estimate: 3d
  - Owner: @product

- T021 - UI/UX polish for public pages
  - Estimate: 2d
  - Owner: @frontend

## Notes

- Owners are placeholders; replace with real assignees.
- Estimates are rough; refine after Phase 0 research.
- Create issues from these tasks and link back to `specs/001-simple-website-which/spec.md`.
