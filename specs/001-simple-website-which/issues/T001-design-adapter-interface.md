# T001 - Design adapter interface

**Estimate:** 1d
**Owner:** @backend
**Labels:** enhancement, backend, adapter

## Summary
Define a pluggable adapter contract for DWH provisioning so multiple providers (Snowflake, BigQuery, Redshift) can be supported with minimal friction.

## Goals
- Provide a clear TypeScript interface describing required methods.
- Define error/idempotency contract and expected behavior for retries.
- Provide an example adapter skeleton implementing the interface.

## Acceptance criteria
- `docs/adapters.md` exists and documents the adapter interface and error model.
- Example adapter skeleton added under `backend/src/adapters/example` that compiles and includes unit tests asserting contract behavior.

## Checklist
- [ ] Create `docs/adapters.md` with interface definition and examples
- [ ] Add TypeScript interface file `backend/src/adapters/interface.ts`
- [ ] Create `backend/src/adapters/example` skeleton implementation
- [ ] Add unit tests validating contract expectations

## Notes
- Interface should include: create(config, idempotencyKey), status(jobId), destroy(instanceId), credentials(instanceId), validateConfig(config)
- Specify JSON schemas for adapter config where applicable.
