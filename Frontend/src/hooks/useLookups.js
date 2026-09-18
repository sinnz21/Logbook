import { useEffect, useState } from 'react';
import { loadLookups, lookupsSnapshot } from '../api/lookups';

/** Shared reference data (dispositions, patient types, complaints, ...),
 * fetched once and cached — see api/lookups.js for the fallback behavior. */
export function useLookups() {
  const [lookups, setLookups] = useState(lookupsSnapshot());

  useEffect(() => {
    let cancelled = false;
    loadLookups().then((l) => {
      if (!cancelled) setLookups(l);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return lookups;
}
