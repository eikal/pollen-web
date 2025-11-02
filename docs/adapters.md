# Adapter contract and example

This document describes the minimal adapter contract required by the provisioning orchestration service. Adapters implement the methods defined in `backend/src/adapters/interface.ts` and are responsible for talking to provider APIs or running provider-specific provisioning steps.

Required methods
- validateConfig(config): Validate a provider-specific configuration object.
- create(config, params, idempotencyKey): Provision resources inside a customer account and return connection metadata.
- status(instanceId): Return job/instance status (PENDING/RUNNING/SUCCESS/FAILED/CANCELLED).
- destroy(instanceId): Tear down provisioned resources.
- credentials(instanceId): Return credentials or a reference to credentials for the provisioned instance.

Design notes
- Adapters must be idempotent when given the same idempotency key.
- Adapters should avoid returning long-lived credentials; prefer short-lived tokens or references to secret manager entries.
- Adapters should surface partial results where applicable so the orchestration system can present helpful remediation steps for failed partial provisioning.

Example
- See `backend/src/adapters/example/index.ts` for a minimal mock adapter demonstrating the contract.
