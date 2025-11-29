"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleAdapter = void 0;
// Example (mock) adapter implementation for local testing and contract demonstration
class ExampleAdapter {
    async validateConfig(config) {
        // basic validation example
        if (!config)
            throw new Error('Adapter config required');
    }
    async create(config, params) {
        // mock a provisioning operation
        const id = `example-${Date.now()}`;
        const result = {
            instanceId: id,
            connection: {
                host: 'example.local',
                database: params.instanceName || 'default',
                meta: { provider: 'example' }
            },
            metadata: { createdAt: new Date().toISOString() },
            created: true
        };
        // in real adapter we'd call provider SDKs here
        return result;
    }
    async status(instanceId) {
        // always return success + simple progress for mock
        return { status: 'SUCCESS', progress: { current: 1, total: 1 } };
    }
    async destroy(instanceId) {
        // mock destroy
        return;
    }
    async credentials(instanceId) {
        return { user: 'example_user', token: 'short-lived-token' };
    }
}
exports.ExampleAdapter = ExampleAdapter;
exports.default = ExampleAdapter;
