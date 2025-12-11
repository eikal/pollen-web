// Adapter interface for provisioning DWH providers

export type IdempotencyKey = string

// Unified lifecycle states for a provisioning job or instance
export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface StatusDetail {
  status: JobStatus
  // optional machine readable error code (retryable, validation, provider_limit, auth, internal)
  errorCode?: 'VALIDATION' | 'RETRYABLE' | 'PERMANENT' | 'AUTH' | 'LIMIT' | 'INTERNAL'
  // human friendly message for UI
  message?: string
  // partial progress metrics (e.g. createdObjects / totalObjects)
  progress?: {
    current: number
    total: number
  }
  // provider specific raw details for debug / audit
  raw?: Record<string, any>
}

export interface ProvisionParams {
  instanceName?: string
  region?: string
  size?: string
  // provider-specific options
  [key: string]: any
}

export interface ProvisionResult {
  instanceId: string
  connection: Record<string, any>
  metadata?: Record<string, any>
  // indicates whether this invocation created new resources (idempotent re-run returns false)
  created: boolean
  // optional idempotency key echoed back
  idempotencyKey?: IdempotencyKey
}

export interface Credentials {
  // do not store long-lived plaintext in real systems
  token?: string
  user?: string
  password?: string
  details?: Record<string, any>
}

export interface AdapterConfig {
  // provider-specific configuration (filled from AdapterConfig.config JSONB)
  [key: string]: any
}

export interface Adapter {
  /**
   * Validate provider-specific configuration ahead of provisioning.
   * MUST throw a validation error with code 'VALIDATION' for user-fixable issues.
   */
  validateConfig(config: AdapterConfig): Promise<void>

  /**
   * Create or return an existing provisioned instance.
   * Idempotency: If idempotencyKey provided and resources already exist, MUST return the same instanceId
   * and set created=false without creating duplicates.
   */
  create(config: AdapterConfig, params: ProvisionParams, idempotencyKey?: IdempotencyKey): Promise<ProvisionResult>

  /**
   * Return status detail for the instance's provisioning lifecycle.
   * Should surface progress metrics and structured error when FAILED.
   */
  status(instanceId: string): Promise<StatusDetail>

  /**
   * Destroy or schedule destruction of provisioned resources.
   * MUST be idempotent (calling destroy multiple times is safe).
   */
  destroy(instanceId: string): Promise<void>

  /**
   * Return connection credentials or a reference to them.
   * SHOULD avoid returning long-lived secrets; prefer short-lived tokens or vault references.
   */
  credentials(instanceId: string): Promise<Credentials>
}

export default Adapter
