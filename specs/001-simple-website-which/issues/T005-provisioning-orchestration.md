# T005 - Provisioning orchestration service

**Estimate:** 3d
**Owner:** @backend
**Labels:** backend, orchestration, jobs

## Summary
Implement a job orchestration service responsible for provisioning workflows: queueing jobs, dispatching adapter calls, tracking state and retries, and updating `ProvisioningJob` records.

## Acceptance criteria
- Job worker processes `ProvisioningJob` records and transitions states correctly.
- Retries, idempotency, and failure recording are implemented.
- Audit logs capture job lifecycle events.

## Checklist
- [ ] Define job state machine and persistence schema
- [ ] Implement queue/worker (Bull or DB-polling prototype)
- [ ] Implement retry/backoff with idempotency handling
- [ ] Add logging and correlation IDs for tracing
- [ ] Add unit and integration tests for job lifecycle

## Notes
- Start with a simple DB-polling worker to reduce infra dependencies; swap to Bull/Redis if needed for scale.
