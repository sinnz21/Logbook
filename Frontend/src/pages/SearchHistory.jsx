import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listAllVisits } from '../api/visits';
import Pagination from '../components/Pagination';
import { formatDate, parseApiDate } from '../lib/time';
import { dispensedSummary, SPECIAL_CASE_CLASS, specialCaseCategory } from '../lib/format';

const dash = (v) => v || '—';

/**
 * Collapses a flat visit list into one row per patient — the Figma's result
 * table is patient-shaped ("12 visits · last visit Sep 15"), while the backend
 * only exposes visits. Picked apart here rather than server-side because
 * GET /api/patients doesn't return visit counts yet (see BACKEND_REQUIREMENTS.md).
 */
function groupByPatient(visits) {
  const byPatient = new Map();
  for (const v of visits) {
    const key = v.patientId ?? v.patientNumber ?? v.patientName;
    const row = byPatient.get(key);
    const startedAt = parseApiDate(v.startedAt);
    if (!row) {
      byPatient.set(key, {
        key,
        patientId: v.patientId,
        name: v.patientName,
        type: v.patientTypeName,
        patientNumber: v.patientNumber,
        program: v.program,
        department: v.department,
        visits: [v],
        lastVisit: startedAt,
        flags: [...(v.specialCases || [])],
      });
      continue;
    }
    row.visits.push(v);
    if (startedAt > row.lastVisit) row.lastVisit = startedAt;
    for (const c of v.specialCases || []) {
      if (!row.flags.some((f) => f.caseName === c.caseName)) row.flags.push(c);
    }
  }
  return [...byPatient.values()];
}

function matches(row, f) {
  const q = f.search.trim().toLowerCase();
  if (q && ![row.name, row.patientNumber, row.department, row.program,
    ...row.visits.map((v) => v.chiefComplaint)]
    .some((s) => s && String(s).toLowerCase().includes(q))) return false;
  if (f.patientType && row.type !== f.patientType) return false;
  if (f.department && row.department !== f.department) return false;
  if (f.flag === 'any' && row.flags.length === 0) return false;
  if (f.flag === 'none' && row.flags.length > 0) return false;
  return true;
}

export default function SearchHistory() {
  const { navigate } = useApp();
  const [filters, setFilters] = useState({ search: '', patientType: '', department: '', flag: '' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState({ by: 'last-visit', order: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [openKey, setOpenKey] = useState(null);

  const source = useAsync(
    () => listAllVisits({
      dateFrom: committed.dateFrom || undefined,
      dateTo: committed.dateTo || undefined,
    }),
    [committed.dateFrom, committed.dateTo],
  );

  const all = useMemo(() => groupByPatient(source.data || []), [source.data]);

  const results = useMemo(() => {
    const dir = sort.order === 'asc' ? 1 : -1;
    const filtered = all.filter((r) => matches(r, filters));
    return filtered.sort((a, b) => {
      if (sort.by === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort.by === 'visits') return (a.visits.length - b.visits.length) * dir;
      return (a.lastVisit - b.lastVisit) * dir;
    });
  }, [all, filters, sort]);

  const pageRows = results.slice((page - 1) * perPage, page * perPage);
  const opened = results.find((r) => r.key === openKey);

  const optionsFor = (field) => [...new Set(all.map((r) => r[field]).filter(Boolean))].sort();
  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Search &amp; History</h1>
          <div className="sub">Type a name and the whole record comes up</div>
        </div>
      </div>

      <div className="search-hero no-print">
        <input
          type="text"
          placeholder="Search by name, ID number, department or complaint…"
          value={filters.search}
          onChange={setFilter('search')}
        />
        <button className="btn btn-primary" onClick={() => setPage(1)}>Search</button>
      </div>

      <div className="card no-print" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: '0' }}>
          <select style={{ maxWidth: '170px' }} value={filters.patientType} onChange={setFilter('patientType')}>
            <option value="">Patient type: All</option>
            {optionsFor('type').map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={{ maxWidth: '190px' }} value={filters.department} onChange={setFilter('department')}>
            <option value="">Department: All</option>
            {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select style={{ maxWidth: '170px' }} value={filters.flag} onChange={setFilter('flag')}>
            <option value="">Priority flag: All</option>
            <option value="any">Flagged only</option>
            <option value="none">Unflagged only</option>
          </select>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <select style={{ maxWidth: '170px' }} value={sort.by} onChange={(e) => setSort({ ...sort, by: e.target.value })}>
              <option value="last-visit">Sort by: Last visit</option>
              <option value="name">Sort by: Name</option>
              <option value="visits">Sort by: Visits</option>
            </select>
            <select style={{ maxWidth: '150px' }} value={sort.order} onChange={(e) => setSort({ ...sort, order: e.target.value })}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {source.error && <div className="login-error">{source.error}</div>}

      <div className="card" style={{ padding: '18px 20px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Results</h3>
            <div className="sub">
              {source.loading
                ? 'Searching…'
                : `${results.length} patient${results.length === 1 ? '' : 's'} matched${filters.search.trim() ? ` "${filters.search.trim()}"` : ''}`}
            </div>
          </div>
        </div>

        <div className="table-card" style={{ margin: '0 -20px' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>ID Number</th>
                <th>Program / Department</th>
                <th>Visits</th>
                <th>Last Visit</th>
                <th>Flags</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {source.loading ? (
                <tr><td colSpan={8} className="sub empty-cell">Loading records…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="sub empty-cell">No patients matched.</td></tr>
              ) : (
                pageRows.map((r) => (
                  <tr className="rowlink" key={r.key} onClick={() => setOpenKey(r.key === openKey ? null : r.key)}>
                    <td className="nm">{r.name}</td>
                    <td><span className="pill active">{dash(r.type)}</span></td>
                    <td>{dash(r.patientNumber)}</td>
                    <td>{[r.program, r.department].filter(Boolean).join(' · ') || '—'}</td>
                    <td>{r.visits.length}</td>
                    <td className="nowrap">{formatDate(r.lastVisit)}</td>
                    <td>
                      {r.flags.length === 0 ? '—' : r.flags.map((c) => (
                        <span key={c.caseName} className={SPECIAL_CASE_CLASS[specialCaseCategory(c.caseName)]} style={{ marginRight: '4px' }}>
                          {c.caseName}
                        </span>
                      ))}
                    </td>
                    <td className="no-print nowrap" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setOpenKey(r.key === openKey ? null : r.key)}>
                        {r.key === openKey ? 'Hide history' : 'Open history'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          perPage={perPage}
          total={results.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      {opened && (
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Visit history — {opened.name}</h3>
              <div className="sub">Expands under the selected result</div>
            </div>
            <button className="btn btn-ghost btn-sm no-print" onClick={() => navigate('profile', opened.visits[0])}>
              Open full profile
            </button>
          </div>
          <div className="table-card" style={{ margin: '0 -20px -18px' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Chief Complaint</th>
                  <th>Medicines &amp; Supplies</th>
                  <th>Disposition</th>
                  <th>Nurse</th>
                </tr>
              </thead>
              <tbody>
                {[...opened.visits]
                  .sort((a, b) => parseApiDate(b.startedAt) - parseApiDate(a.startedAt))
                  .map((v) => (
                    <tr key={v.visitId}>
                      <td className="nowrap nm">{formatDate(parseApiDate(v.startedAt))}</td>
                      <td>{dash(v.chiefComplaint)}</td>
                      <td>{dispensedSummary(v) || '—'}</td>
                      <td>{v.dispositionName ? <span className="pill active">{v.dispositionName}</span> : '—'}</td>
                      <td>{dash(v.attendingName)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
