import { useCallback, useEffect, useState } from 'react';

/**
 * Generic "fetch on mount, refetch on demand" hook for any async loader that
 * doesn't fit useVisits' shape. Never calls a setter synchronously inside the
 * effect body (see useVisits.js for why that matters).
 */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);
  return { ...state, reload };
}
