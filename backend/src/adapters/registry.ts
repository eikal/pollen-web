/**
 * Adapter Registry: Manages pluggable data source adapters.
 * Provides registration and lookup for adapter implementations.
 */

import Adapter from './interface';

const registry: Map<string, Adapter> = new Map();

/**
 * Register a new adapter by key.
 * @param key - Unique adapter identifier (e.g., 'csv', 'google_sheets')
 * @param adapter - Adapter implementation conforming to Adapter interface
 */
export function registerAdapter(key: string, adapter: Adapter): void {
  if (registry.has(key)) {
    throw new Error(`Adapter with key "${key}" is already registered`);
  }
  registry.set(key, adapter);
}

/**
 * Retrieve an adapter by key.
 * @param key - Adapter identifier
 * @returns Adapter instance or undefined if not found
 */
export function getAdapter(key: string): Adapter | undefined {
  return registry.get(key);
}

/**
 * List all registered adapter keys.
 * @returns Array of adapter keys
 */
export function listAdapters(): string[] {
  return Array.from(registry.keys());
}

/**
 * Check if an adapter is registered.
 * @param key - Adapter identifier
 * @returns true if registered, false otherwise
 */
export function hasAdapter(key: string): boolean {
  return registry.has(key);
}

/**
 * Clear all registered adapters (for testing).
 */
export function clearAdapters(): void {
  registry.clear();
}
