import { useCallback, useEffect, useState } from 'react';
import { listVisits, listVisitsBetween } from '../api/visits';

/** Every visit that started within a clinic-day range (inclusive), refetchable. */
export function useVisitsInRange(from, to) {
  const [state, setState] = useState({ visits: [], loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listVisitsBetween(from, to)
      .then((visits) => {
        if (!cancelled) setState({ visits, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { ...state, reload };
}

/** One page of the full (unfiltered) visit list, backend-paginated. */
export function useVisitsPage({ page = 1, perPage = 50 } = {}) {
  const [state, setState] = useState({ items: [], total: 0, page, perPage, loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listVisits({ page, perPage })
      .then((res) => {
        if (!cancelled) setState({ ...res, loading: false, error: null });
      })
      .catch((e) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    return () => {
      cancelled = true;
    };
  }, [page, perPage, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { ...state, reload };
}
