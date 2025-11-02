# Data Model: One-Click DWH (Feature 001)

**Date**: 2025-10-31

## Purpose

Define the canonical metadata entities, attributes, relationships, and lifecycle states required to implement the one-click provisioning flow and associated UI/ops features.

## Scale assumptions

- v1 target: < 10k organizations, metadata rows per org << 1M.  
- Provisioning jobs are long-lived but low-volume compared to user traffic.

## Entities

### Organization
- Purpose: top-level tenant representing a customer organization.
- Fields:
  - id: UUID (PK)
  - name: string (unique, indexed)
  - domain: string (optional) — used for SSO mapping
  - created_at: timestamp
  - updated_at: timestamp
  - config: jsonb (optional) — storage for org-level adapter preferences
- Uniqueness: `name` or `domain` per org must be unique.

### User
- Purpose: user account metadata for access control and auditing (we rely on SSO identity assertions for auth).
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK -> Organization.id)
  - subject: string (OIDC subject / unique id from IdP)
  - email: string
  - display_name: string
  - role: enum {admin, member, read_only}
  - created_at, updated_at
- Uniqueness: (org_id, subject) unique.

### AdapterConfig
- Purpose: configuration for a provider adapter for an org (provider selection, connection metadata).
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - provider: enum {snowflake, bigquery, redshift}
  - config: jsonb — provider-specific configuration (e.g., default database names, region)
  - created_at, updated_at
- Uniqueness: (org_id, provider) unique (one config per provider per org).

### ProvisioningJob
- Purpose: track asynchronous provisioning operations.
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - adapter_config_id: UUID (FK) — the adapter used for this job
  - provider: enum {snowflake, bigquery, redshift}
  - requested_by: UUID (FK -> User.id)
  - idempotency_key: string (optional) — to deduplicate requests
  - params: jsonb — input parameters (selected size, region, instance name)
  - status: enum {PENDING, RUNNING, SUCCESS, FAILED, CANCELLED}
  - last_error: text (nullable)
  - result: jsonb (nullable) — contains connection info and metadata on success
  - attempts: int (default 0)
  - created_at, updated_at, finished_at
- Indexes: index on (org_id, status)
- Lifecycle: PENDING -> RUNNING -> SUCCESS/FAILED. Retries allowed from FAILED to RUNNING if idempotent.

### ProvisionedInstance
- Purpose: record the outcome and connection metadata for provisioned warehouses.
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - provider: enum
  - name: string (user visible)
  - connection: jsonb — contains host, port, database, user, connection method (e.g., key, oauth)
  - credential_ref: string (reference to secret manager entry) — DO NOT store plaintext credentials
  - status: enum {ACTIVE, SUSPENDED, DELETED}
  - created_at, updated_at, deleted_at
- Uniqueness: (org_id, name) should be unique.

### AuditLog
- Purpose: immutable event log for provisioning and security-sensitive operations.
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - user_id: UUID (nullable)
  - event_type: string
  - details: jsonb
  - created_at

### Plan
- Purpose: representation of product tier selected by an organization (Basic, Premium).
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - tier: enum {basic, premium}
  - features: jsonb — list of enabled feature flags or components
  - started_at, updated_at

### ETLTemplate
- Purpose: pre-built ETL/ingestion templates users can pick and run.
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK) (nullable for global templates)
  - name: string
  - description: string
  - provider: enum {airbyte, custom}
  - spec: jsonb — connector config skeleton (source, destination, schedule)
  - created_at, updated_at

### ETLJob
- Purpose: track ETL template executions and schedules.
- Fields:
  - id: UUID (PK)
  - org_id: UUID (FK)
  - template_id: UUID (FK -> ETLTemplate.id)
  - params: jsonb
  - status: enum {SCHEDULED, RUNNING, SUCCESS, FAILED}
  - last_run_at, next_run_at
  - result: jsonb
  - created_at, updated_at

## Example JSON schema (ProvisioningJob)

```json
{
  "id": "uuid",
  "org_id": "uuid",
  "provider": "snowflake",
  "requested_by": "uuid",
  "params": {
    "instance_size": "X-Small",
    "region": "us-east-1"
  },
  "status": "PENDING"
}
```

## Relationships

- Organization 1 - * Users
- Organization 1 - * AdapterConfig
- Organization 1 - * ProvisioningJob
- AdapterConfig 1 - * ProvisioningJob
- Organization 1 - * ProvisionedInstance
 - Organization 1 - * Plan
 - Organization 1 - * ETLTemplate
 - ETLTemplate 1 - * ETLJob

## Identity & uniqueness rules

- Organizations identified by UUID; human-friendly `name` and `domain` must be unique.
- Users identified by IdP `subject` plus org mapping.
- ProvisioningJob deduplication via `idempotency_key` when provided.

## Lifecycle / State transitions

- ProvisioningJob:
  - PENDING -> RUNNING (worker picks up job)
  - RUNNING -> SUCCESS (adapter reports success)
  - RUNNING -> FAILED (adapter or infra error)
  - FAILED -> RUNNING (retry by user/operator) if idempotent
  - Any -> CANCELLED (user requested cancel before completion)

- ProvisionedInstance:
  - ACTIVE -> SUSPENDED (manual disable)
  - SUSPENDED -> ACTIVE
  - ACTIVE -> DELETED (manual delete or account cleanup)

## Retention & compliance

- AuditLog: retain for 1 year by default; configurable per org.
- ProvisionedInstance metadata: retain indefinitely while ACTIVE, mark for retention policy on DELETED.
- Credentials secrets: follow cloud provider/regional retention and rotation policies; remove from system if user revokes access.

## Edge cases & failure handling

- Partial provisioning (some resources created): mark job FAILED, capture `result` partial metadata, and provide a rescue flow for cleanup or retry.
- Provider API rate limiting: adapters must surface rate-limit errors and implement exponential backoff/retry with jitter.
- Cross-account permission revoked mid-provisioning: detect via API errors, mark job FAILED with clear remediation steps in `last_error` and `AuditLog`.

## Implementation notes

- Use Postgres with JSONB for flexible provider-specific params and results.
- Add FK constraints with ON DELETE CASCADE where appropriate (e.g., org deletion should cascade or be prevented depending on policy).
- Use GUIDs for public-facing IDs to avoid guessable integer IDs.

## Acceptance/tests

- Unit tests for schema migrations.
- Contract tests ensuring `ProvisioningJob.result` contains necessary connection fields for the UI to render.
- Migration plan and a small seed script for local dev with a sample org and mock adapter config.

