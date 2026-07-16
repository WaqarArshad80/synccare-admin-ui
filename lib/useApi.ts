'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the request. */
  refetch: () => void;
}

/**
 * Minimal data-fetching hook for client components. Pass a stable-ish fetcher
 * (wrap in useCallback if it closes over changing values). For anything larger,
 * reach for TanStack Query — this keeps the scaffold dependency-free.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load data.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, loading, error, refetch };
}
