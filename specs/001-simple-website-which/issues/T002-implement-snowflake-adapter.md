# T002 - Implement Snowflake adapter

**Estimate:** 3d
**Owner:** @backend
**Labels:** backend, adapter, snowflake, integration

## Summary
Implement a Snowflake adapter conforming to the adapter interface. This adapter should be runnable in a mocked environment and include unit + integration tests.

## Acceptance criteria
- Adapter implements create/status/destroy/credentials methods.
- Unit tests mock Snowflake SDK and pass.
- A mocked end-to-end integration test demonstrates a provisioning job reaching SUCCESS.

## Checklist
- [ ] Implement adapter using `snowflake-sdk` (mockable)
- [ ] Add unit tests for success and error conditions
- [ ] Add integration test harness (mocked or sandbox)
- [ ] Document provider permissions required in `docs/adapters.md`

## Notes
- For v1 we operate inside customer Snowflake accounts by requiring a minimal admin role or service user. Document exact SQL/permission steps.
