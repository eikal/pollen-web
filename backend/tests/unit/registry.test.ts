/**
 * Unit tests for adapter registry.
 */

import { registerAdapter, getAdapter, listAdapters, hasAdapter, clearAdapters } from '../../src/adapters/registry';
import Adapter from '../../src/adapters/interface';

// Mock adapter
const mockAdapter: Adapter = {
  validateConfig: async () => {},
  create: async () => ({
    instanceId: 'test-instance',
    connection: {},
    created: true
  }),
  status: async () => ({
    status: 'SUCCESS'
  }),
  destroy: async () => {},
  credentials: async () => ({})
};

describe('Adapter Registry', () => {
  beforeEach(() => {
    clearAdapters();
  });

  describe('registerAdapter', () => {
    it('should register a new adapter', () => {
      registerAdapter('test-adapter', mockAdapter);
      expect(hasAdapter('test-adapter')).toBe(true);
    });

    it('should throw error when registering duplicate key', () => {
      registerAdapter('test-adapter', mockAdapter);
      expect(() => registerAdapter('test-adapter', mockAdapter))
        .toThrow('Adapter with key "test-adapter" is already registered');
    });
  });

  describe('getAdapter', () => {
    it('should retrieve registered adapter', () => {
      registerAdapter('csv', mockAdapter);
      const adapter = getAdapter('csv');
      expect(adapter).toBe(mockAdapter);
    });

    it('should return undefined for unregistered adapter', () => {
      const adapter = getAdapter('nonexistent');
      expect(adapter).toBeUndefined();
    });
  });

  describe('listAdapters', () => {
    it('should list all registered adapter keys', () => {
      registerAdapter('csv', mockAdapter);
      registerAdapter('sheets', mockAdapter);
      
      const keys = listAdapters();
      expect(keys).toContain('csv');
      expect(keys).toContain('sheets');
    });
  });

  describe('hasAdapter', () => {
    it('should return true for registered adapter', () => {
      registerAdapter('csv', mockAdapter);
      expect(hasAdapter('csv')).toBe(true);
    });

    it('should return false for unregistered adapter', () => {
      expect(hasAdapter('nonexistent')).toBe(false);
    });
  });
});
