/**
 * React hooks for API calls with loading/error states.
 */

import { useState, useEffect } from 'react';
import * as connectionsAPI from './connections';
import * as productsAPI from './products';
import type { DataSourceConnection, DataProduct, SchemaPreview, RefreshJob } from './types';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch connections with freshness for an organization.
 */
export function useConnections(
  orgId: string,
  workspaceId?: string
): UseQueryResult<DataSourceConnection[]> {
  const [data, setData] = useState<DataSourceConnection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    connectionsAPI
      .listConnections(orgId, workspaceId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, workspaceId, refetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchTrigger((prev) => prev + 1),
  };
}

/**
 * Fetch schema preview for a connection.
 */
export function useConnectionSchema(connectionId: string | null): UseQueryResult<SchemaPreview> {
  const [data, setData] = useState<SchemaPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!connectionId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    connectionsAPI
      .getConnectionSchema(connectionId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [connectionId, refetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchTrigger((prev) => prev + 1),
  };
}

/**
 * Fetch data products for an organization.
 */
export function useProducts(orgId: string, workspaceId?: string): UseQueryResult<DataProduct[]> {
  const [data, setData] = useState<DataProduct[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    productsAPI
      .listProducts(orgId, workspaceId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId, workspaceId, refetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchTrigger((prev) => prev + 1),
  };
}

/**
 * Hook for triggering refresh with loading state.
 */
export function useRefreshProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<RefreshJob | null>(null);

  const trigger = async (productId: string) => {
    setLoading(true);
    setError(null);
    setJob(null);

    try {
      const result = await productsAPI.triggerRefresh(productId);
      setJob(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { trigger, loading, error, job };
}

export default {
  useConnections,
  useConnectionSchema,
  useProducts,
  useRefreshProduct,
};
