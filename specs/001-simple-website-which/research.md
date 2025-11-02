# Phase 0 Research: One-Click DWH (Feature 001)

**Date**: 2025-10-31

## Goal

Deliver actionable, low-risk engineering choices for the One-Click DWH feature so Phase 1 implementation can proceed with minimal rework. This document captures provider-specific provisioning flows, authentication decisions, secrets handling, observability, testing approach, and open questions.

## Executive summary / recommendations

- Backend/Frontend stack recommendation: Node.js (TypeScript) backend + React/Next.js frontend. Benefits: strong ecosystem for SDKs, cross-platform deployment, fast developer iteration.
- Provider approach: Pluggable adapter model. Implement Snowflake adapter first (high enterprise demand), then BigQuery and Redshift using the same adapter contract. Support multi-provider selection in UI.
- Provisioning target: Provision into the customer's cloud/account via a short-lived role or service account; do not require users to hand over long-lived credentials.
- Auth: Primary approach OIDC/OAuth SSO (Azure AD, Google Workspace, Okta) for org admin onboarding. Support SAML if customers require it later.
- Secrets: Use a cloud secret manager or encrypted vault (AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault). Never store plaintext long-lived credentials; prefer short-lived tokens and customer-managed service accounts/roles.

## DWH provider notes

### Snowflake

- Provisioning model options:
  - Create a Snowflake account for the customer is typically a commercial onboarding flow (not generally automated via public SDK); most customers have existing Snowflake accounts. For "provision into customer's account" the flow will be:
    1. Instruct customer to create a user/role with minimal privileges or create an OAuth integration / key that our adapter can use.
    2. Use the Snowflake JDBC/Node SDK to create necessary databases/schemas/roles within the customer's account.
- Permissions needed (example): CREATE DATABASE, CREATE SCHEMA, CREATE ROLE, CREATE USER (if creating-managed users), USAGE on warehouse.
- SDKs/APIs: snowflake-sdk (node), connector for admin operations; Snowflake's Account Admin tasks may require manual steps in some orgs.
- Notes: Snowflake often requires commercial provisioning; prefer to integrate by operating inside an existing customer account.

### BigQuery (GCP)

- Provisioning model:
  - Create dataset(s) and grant IAM roles to a service account.
  - Recommended approach: customer creates a GCP service account with required roles (BigQuery Admin or custom role) and provides the service account key or grants workload identity federation.
- Permissions needed: bigquery.datasets.create, bigquery.tables.create, bigquery.jobs.create, iam.serviceAccounts.getAccessToken.
- SDKs/APIs: @google-cloud/bigquery (node)
- Notes: GCP supports service account impersonation / workload identity which enables secure short-lived access without long-lived keys.

### Redshift (AWS)

- Provisioning model:
  - Options: create Redshift cluster in customer's AWS account (involves significant infra provisioning and cost) OR configure Redshift Spectrum/RA3 and create database/schema objects.
  - More common: provision schemas/tables in an existing Redshift cluster in customer's account using IAM roles/service accounts.
- Permissions needed: Redshift DDL permissions and IAM role allowing cluster modifications or usage, as appropriate.
- SDKs/APIs: aws-sdk (node) for IAM/cluster operations; SQL execution via JDBC/psql drivers.
- Notes: AWS cross-account role setup (assume-role) is a secure pattern for our orchestration service to make one-time privileged calls without storing credentials.

## Authentication & Onboarding

- Primary choice: OIDC/OAuth SSO (Azure AD, Google, Okta). Benefits: enterprise-ready, simplifies org admin workflows and mapping orgs/users.
- Onboarding should require an org admin to sign in and then perform provider-specific setup steps (create service account or assume-role) — present clear, provider-specific instructions and sample CLI/console steps.
- For provider credentials, prefer these patterns (in order):
  1. Workload identity / federated access (no long-lived keys).
  2. Short-lived tokens via Exchange (where supported).
  3. Customer-provided service account keys (stored encrypted; recommend rotation guidance).

## Secrets & Credential Storage

- Do not store long-lived plaintext credentials in repo or DB.
- Use a secrets manager integrated with runtime environment; for local dev, use encrypted local store (e.g., dotfile encrypted or dev vault).
- For customer-provided keys: store metadata and encryption key reference; rotate and delete as soon as possible.
- Document explicit credential rotation and revocation steps in quickstart.

## Orchestration, retries, idempotency

- Provisioning must be implemented as asynchronous jobs with a state machine: PENDING → RUNNING → SUCCESS/FAILED → RETRYABLE/RESOLVED.
- Idempotency: adapters should accept a client-generated idempotency key to avoid duplicate work on retries.
- Retries: exponential backoff with a max attempt count and manual rescue flow for user operations.
- Long-running operations: provide UI status updates, email/webhook notifications, and link to logs/troubleshooting.

## Observability & Telemetry

- Track metrics: provisioning_time_seconds, provisioning_failure_rate, active_jobs, secrets_issue_count.
- Structured logs for adapter actions and external API calls. Correlate logs with provisioning job ids.
- Tracing: instrument backend orchestration with distributed tracing (OpenTelemetry) for diagnosing multi-step provisioning.

## Testing approach

- Unit tests for adapters (mock provider SDKs).  
- Contract tests to validate adapter interface (create/status/destroy flows).  
- End-to-end integration tests: use a sandbox account per provider where possible (e.g., test GCP project, test Snowflake dev account).  
- Security tests: ensure no secrets in plain text in logs; penetration testing in later phases.

## Compliance & Data Protection

- Since provisioned DWH instances will store customer data, we must ensure we do not ingest or store customer data unencrypted.
- Privacy: minimize PII storage in our DB. If any customer connection metadata is stored, store only necessary fields and mark retention policy.

## Open questions (Phase 0 decisions required)

1. Which provider to prioritize definitively for v1 (Snowflake recommended; confirm with product).  
2. Which secret manager to standardize on in infra (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault).  
3. Which identity provider(s) to test SSO with in v1 (Azure AD recommended).  
4. Billing/pricing model for provisioning cost recovery (deferred to Phase 2).

## References

- Snowflake documentation: account admin & roles
- Google Cloud: Workload identity and BigQuery dataset creation
- AWS: Cross-account role and Redshift cluster management
- OpenTelemetry docs

## Open-source tool recommendations

To keep the product accessible and cost-effective for medium businesses, prefer established open-source projects where possible:

- ETL / Ingestion: Airbyte (open-source connectors + CDC support), Singer / Meltano (extract-load-transform patterns), or custom lightweight connectors for Excel/HTTP. Airbyte is recommended for v1 due to broad connector support and a friendly UI.
- Orchestration: Dagster or Apache Airflow (Dagster favoured for developer ergonomics and typed pipelines). Use lightweight scheduling for simple templates.
- Transformations: dbt (well-known, SQL-first transformations) for analytic modeling.
- BI / Dashboards: Apache Superset or Metabase (both OSS; Superset is more feature-rich, Metabase is simpler for non-technical users). For Basic plan, ship a pre-configured Metabase or Superset instance connected to the provisioned DWH.
- Data Catalog / Discovery: DataHub (LinkedIn open-source) or Amundsen for metadata and lineage. DataHub is recommended for richer metadata and schema lineage.
- API Gateway / Federation: Kong (OSS) or Tyk for API gateway; for data federation / query virtualization consider Trino (formerly Presto) or Dremio's OSS components.
- Secrets & Vault: HashiCorp Vault (OSS) or native cloud secret managers (choose based on infra).

## ETL Template details (user-facing)

Design templates so non-technical users can pick a template, provide minimal inputs (source connection, schedule), and run a guided wizard.

- "Clone application DB" template:
  - Options: full snapshot, scheduled incremental (delta) using CDC where supported, or daily incremental sync.
  - Implementation: prefer Airbyte connectors + CDC when available; fall back to scheduled full/append loads with watermark columns.

- "Excel / CSV import" template:
  - UI: upload file or drag-and-drop, automatic schema inference, preview, and validation before load.
  - Implementation: convert to CSV, infer types, write to staging table, run optional dbt model to normalize.

- "API ingestion" template:
  - UI: provide URL, auth method (API key/OAuth), sample payload, and schedule.
  - Implementation: HTTP connector (Airbyte custom connector or lightweight fetcher) with pagination and rate-limit handling; map JSON to relational schema via inferred mapping or user-defined mapping.

## UX notes for non-technical users

- Keep onboarding wizards step-by-step with clear, copyable console or cloud console commands for creating service accounts/roles.
- Provide sensible defaults (region, instance size estimate) and explain cost implications in plain language.
- Offer a one-click "starter dashboard" in the BI tool populated with sample charts derived from common application tables.



