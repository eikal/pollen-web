import Adapter, { AdapterConfig, ProvisionParams, ProvisionResult, Credentials, JobStatus } from '../interface'

// Example (mock) adapter implementation for local testing and contract demonstration
export class ExampleAdapter implements Adapter {
  async validateConfig(config: AdapterConfig): Promise<void> {
    // basic validation example
    if (!config) throw new Error('Adapter config required')
  }

  async create(config: AdapterConfig, params: ProvisionParams): Promise<ProvisionResult> {
    // mock a provisioning operation
    const id = `example-${Date.now()}`
    const result: ProvisionResult = {
      instanceId: id,
      connection: {
        host: 'example.local',
        database: params.instanceName || 'default',
        meta: { provider: 'example' }
      },
      metadata: { createdAt: new Date().toISOString() }
    }
    // in real adapter we'd call provider SDKs here
    return result
  }

  async status(instanceId: string): Promise<JobStatus> {
    // always return success for mock
    return 'SUCCESS'
  }

  async destroy(instanceId: string): Promise<void> {
    // mock destroy
    return
  }

  async credentials(instanceId: string): Promise<Credentials> {
    return { user: 'example_user', token: 'short-lived-token' }
  }
}

export default ExampleAdapter
