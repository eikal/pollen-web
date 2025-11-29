"use strict";
/**
 * Adapter Registry: Manages pluggable data source adapters.
 * Provides registration and lookup for adapter implementations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAdapter = registerAdapter;
exports.getAdapter = getAdapter;
exports.listAdapters = listAdapters;
exports.hasAdapter = hasAdapter;
exports.clearAdapters = clearAdapters;
const registry = new Map();
/**
 * Register a new adapter by key.
 * @param key - Unique adapter identifier (e.g., 'csv', 'google_sheets')
 * @param adapter - Adapter implementation conforming to Adapter interface
 */
function registerAdapter(key, adapter) {
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
function getAdapter(key) {
    return registry.get(key);
}
/**
 * List all registered adapter keys.
 * @returns Array of adapter keys
 */
function listAdapters() {
    return Array.from(registry.keys());
}
/**
 * Check if an adapter is registered.
 * @param key - Adapter identifier
 * @returns true if registered, false otherwise
 */
function hasAdapter(key) {
    return registry.has(key);
}
/**
 * Clear all registered adapters (for testing).
 */
function clearAdapters() {
    registry.clear();
}
