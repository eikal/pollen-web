import Adapter, { AdapterConfig, ProvisionParams, ProvisionResult, Credentials, StatusDetail } from '../interface'

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
      metadata: { createdAt: new Date().toISOString() },
      created: true
    }
    // in real adapter we'd call provider SDKs here
    return result
  }

  async status(instanceId: string): Promise<StatusDetail> {
    // always return success + simple progress for mock
    return { status: 'SUCCESS', progress: { current: 1, total: 1 } }
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
