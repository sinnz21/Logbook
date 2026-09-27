import { useEffect, useState } from 'react';
import { searchPatients } from '../../api/patients';
import { initialsOf, patientMeta } from '../../lib/format';
import Icon from '../Icon';

/**
 * The design's roster lookup: a search field with its own Search button, and
 * matches listed as avatar rows with a "Use" action. Queries GET /api/patients
 * as the nurse types (debounced), so the button is a convenience, not a
 * requirement.
 */
export default function PatientSearch({ onPick, placeholder = 'Search by ID number or full name', actionLabel = 'Use' }) {
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
        <div className="search-field">
          <Icon name="search" size={17} className="ic" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
        </div>
        <button type="button" className="btn btn-primary">Search</button>
      </div>

      {q.length >= 2 && result.loading && <div className="sub" style={{ marginBottom: 10 }}>Searching…</div>}
      {showResults && result.error && <div className="login-error">Roster search failed: {result.error}</div>}
      {showResults && !result.error && (
        <div className="roster-results">
          {result.items.length === 0 ? (
            <div className="roster-row">
              <span className="sub">No match. Fill in the details below to register on the spot.</span>
            </div>
          ) : (
            result.items.map((p) => (
              <div className="roster-row" key={p.patientId}>
                <div className="who">
                  <div className="avatar sm">{initialsOf(p.fullName)}</div>
                  <div>
                    <div className="nm">{p.fullName}</div>
                    <div className="sub">{patientMeta(p) || 'No details on file'}</div>
                  </div>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { onPick(p); setQuery(''); }}>
                  {actionLabel}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
