import { useEffect, useState } from 'react';
import { searchPatients } from '../../api/patients';
import { patientMeta } from '../../lib/format';

/**
 * The Figma's "Search roster by name or ID..." box. Queries GET /api/patients
 * as the nurse types and lists matches with a Use button.
 */
export default function PatientSearch({ onPick, placeholder = 'Search roster by name or ID...', actionLabel = 'Use' }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState({ query: '', items: [], error: null, loading: false });

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      setResult((r) => ({ ...r, loading: true }));
      searchPatients(q, { perPage: 8 })
        .then((res) => !cancelled && setResult({ query: q, items: res.items, error: null, loading: false }))
        .catch((e) => !cancelled && setResult({ query: q, items: [], error: e.message, loading: false }));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const q = query.trim();
  const showResults = q.length >= 2 && result.query === q;

  return (
    <>
      <div className="roster-search">
        <span className="ic">⌕</span>
        <input type="text" placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {q.length >= 2 && result.loading && <div className="sub" style={{ marginBottom: '10px' }}>Searching…</div>}
      {showResults && result.error && <div className="login-error">Roster search failed: {result.error}</div>}
      {showResults && !result.error && (
        <div className="roster-results">
          {result.items.length === 0 ? (
            <div className="roster-row"><span className="sub">No match — fill in the details below to register a new patient.</span></div>
          ) : (
            result.items.map((p) => (
              <div className="roster-row" key={p.patientId}>
                <div><div className="nm">{p.fullName}</div><div className="sub">{patientMeta(p) || 'No details on file'}</div></div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { onPick(p); setQuery(''); }}>{actionLabel}</button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
