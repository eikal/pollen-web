# T006 - Metadata DB schema & migrations

**Estimate:** 1d
**Owner:** @backend
**Labels:** db, migrations

## Summary
Create SQL migration files and tests for the metadata schema: Organization, User, AdapterConfig, ProvisioningJob, ProvisionedInstance, AuditLog, Plan, ETLTemplate, ETLJob.

## Acceptance criteria
- Migrations run successfully in local dev environment
- Seed script creates a sample org and sample ETL templates
- CI runs migration tests successfully

## Checklist
- [ ] Write SQL migration files (or ORM migrations)
- [ ] Add migrations to CI pipeline (migration check step)
- [ ] Create seed script for local dev
- [ ] Add tests to verify schema and constraints

## Notes
- Use Postgres with JSONB for flexible params/results. Follow `data-model.md` for fields and constraints.
