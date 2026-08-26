import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { extractErrorMessage } from '@/lib/apiClient';

export interface ApiResource<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Minimal fetch-on-mount hook with abort handling.
 *
 * `fetcher` must be stable (defined at module scope or wrapped in useCallback),
 * otherwise the effect re-runs on every render.
 */
export function useApiResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Keeps the effect from depending on the fetcher identity.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (active) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        // An aborted request is a cleanup, not a failure to report.
        if (!active || axios.isCancel(err) || controller.signal.aborted) return;
        setError(extractErrorMessage(err));
        setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  return { data, isLoading, error, refetch };
}
