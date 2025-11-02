// Adapter interface for provisioning DWH providers

export type IdempotencyKey = string

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

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
  // validate the config ahead of provisioning
  validateConfig(config: AdapterConfig): Promise<void>

  // create a provisioned instance in customer's account/project
  create(config: AdapterConfig, params: ProvisionParams, idempotencyKey?: IdempotencyKey): Promise<ProvisionResult>

  // check the status of a running provisioning job / instance
  status(instanceId: string): Promise<JobStatus>

  // destroy / tear down provisioned instance
  destroy(instanceId: string): Promise<void>

  // return connection credentials (reference, short-lived token, etc.)
  credentials(instanceId: string): Promise<Credentials>
}

export default Adapter
