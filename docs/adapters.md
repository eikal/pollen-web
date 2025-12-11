# Adapter contract and example

This document describes the minimal adapter contract required by the provisioning orchestration service. Adapters implement the methods defined in `backend/src/adapters/interface.ts` and are responsible for talking to provider APIs or running provider-specific provisioning steps.

## Required Methods

| Method | Purpose | Idempotency | Error Signals |
|--------|---------|------------|---------------|
| `validateConfig(config)` | Pre-flight validation of provider config | N/A | Throw with message (errorCode=VALIDATION) |
| `create(config, params, idempotencyKey?)` | Provision resources or return existing | MUST return same instance with `created=false` on repeat key | Throw retriable or permanent errors (`RETRYABLE` / `PERMANENT`) |
| `status(instanceId)` | Return structured status + progress | Read-only | Include `errorCode` + `message` on failure |
| `destroy(instanceId)` | Tear down resources safely | MUST be idempotent | Throw only if not found or permission |
| `credentials(instanceId)` | Return short-lived or referenced creds | Avoid exposing static secrets | Throw `AUTH` when permission denied |

## Data Structures (see `interface.ts`)

`ProvisionResult`:
```ts
interface ProvisionResult {
	instanceId: string
	connection: Record<string, any>
	metadata?: Record<string, any>
	created: boolean           // false on idempotent re-run
	idempotencyKey?: string    // echo if provided
}
```

`StatusDetail`:
```ts
interface StatusDetail {
	status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
	errorCode?: 'VALIDATION' | 'RETRYABLE' | 'PERMANENT' | 'AUTH' | 'LIMIT' | 'INTERNAL'
	message?: string
	progress?: { current: number; total: number }
	raw?: Record<string, any>
}
```

## Idempotency Strategy
1. Caller supplies an `idempotencyKey` on `create()`.
2. Adapter checks for existing resources tagged/stored under that key.
3. If found, return identical `instanceId` and set `created=false`.
4. Keys should expire or be garbage-collected after a safe window to prevent unbounded growth.

## Error Model
Use exceptions with a structured shape (custom Error subclass or properties) the orchestration layer can map:
```ts
class AdapterError extends Error {
	constructor(public errorCode: StatusDetail['errorCode'], message: string, public raw?: any) { super(message) }
}
```
Categories:
- `VALIDATION`: User misconfiguration; never retried automatically.
- `RETRYABLE`: Transient provider/network issue; orchestrator may retry with backoff.
- `PERMANENT`: Non-recoverable (unsupported region, quota reached with no auto-increase). Requires user intervention.
- `AUTH`: Authentication/authorization failure to provider.
- `LIMIT`: Rate or service limits (may be retriable later).
- `INTERNAL`: Unexpected adapter failure (bug, unhandled condition).

## Credentials Guidance
- Prefer returning ephemeral credentials (tokens with TTL) or a secret manager reference (`vaultPath`, `awsSecretArn`).
- Never return long-lived plaintext unless explicitly requested in a secure path.

## Progress Reporting
During longer provisioning flows, populate `progress.current` and `progress.total` to drive UI progress bars.

## Example Adapter
See `backend/src/adapters/example/index.ts` for a mock implementation reflecting the latest interface additions.

## Future Extensions
- Pause/resume operations will introduce `pause(instanceId)` / `resume(instanceId)` (see T023).
- Cost metrics endpoint may require `estimateCosts(instanceId)`.
- Credential rotation: a future `rotateCredentials(instanceId)` method.
