import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listAllVisits } from '../api/visits';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { formatDate, parseApiDate } from '../lib/time';
import { dispensedSummary, SPECIAL_CASE_CLASS, specialCaseCategory } from '../lib/format';

const dash = (v) => v || '—';

const TYPE_PILL = (t = '') =>
  /faculty/i.test(t) ? 'blue' : /student/i.test(t) ? 'teal' : 'grey';
const DISPOSITION_PILL = (name = '') =>
  /hospital|referred/i.test(name) ? 'blue' : /sent home/i.test(name) ? 'amber' : 'teal';

/**
 * Collapses a flat visit list into one row per patient — the design's result
 * table is patient-shaped ("12 visits, last visit Sep 15"), while the backend
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
  const [sort, setSort] = useState('last-desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
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
    const dir = sort.endsWith('asc') ? 1 : -1;
    return all.filter((r) => matches(r, filters)).sort((a, b) => {
      if (sort.startsWith('name')) return a.name.localeCompare(b.name) * dir;
      if (sort.startsWith('visits')) return (a.visits.length - b.visits.length) * dir;
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
          <h1>Search and history</h1>
          <div className="sub">Type a name and the whole record comes up</div>
        </div>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={18} className="ic" />
            <input
              type="text"
              placeholder="Search by name, ID number, department or complaint"
              value={filters.search}
              onChange={setFilter('search')}
              style={{ padding: '13px 14px 13px 40px', fontSize: 15 }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setPage(1)}>Search</button>
        </div>

        <div className="filter-row">
          <select className="auto" value={filters.patientType} onChange={setFilter('patientType')}>
            <option value="">Patient type: all</option>
            {optionsFor('type').map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="auto" value={filters.department} onChange={setFilter('department')}>
            <option value="">Department: all</option>
            {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="auto" value={filters.flag} onChange={setFilter('flag')}>
            <option value="">Priority flag: all</option>
            <option value="any">Flagged only</option>
            <option value="none">Unflagged only</option>
          </select>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div className="spacer" />
          <select className="auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="last-desc">Sort: last visit, newest</option>
            <option value="last-asc">Sort: last visit, oldest</option>
            <option value="name-asc">Sort: name, A to Z</option>
            <option value="visits-desc">Sort: visits, most</option>
          </select>
        </div>
      </div>

      {source.error && <div className="login-error" style={{ marginBottom: 14 }}>{source.error}</div>}

      <div className="card" style={{ padding: '20px 22px 6px' }}>
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

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>ID number</th><th>Program or department</th>
                <th>Visits</th><th>Last visit</th><th>Flags</th><th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {source.loading ? (
                <tr><td colSpan={8} className="empty-cell">Loading records…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No patients matched.</td></tr>
              ) : (
                pageRows.map((r) => {
                  const open = r.key === openKey;
                  return (
                    <tr className="rowlink" key={r.key} onClick={() => setOpenKey(open ? null : r.key)}>
                      <td className="nm">{r.name}</td>
                      <td><span className={`pill ${TYPE_PILL(r.type)}`}>{dash(r.type)}</span></td>
                      <td>{dash(r.patientNumber)}</td>
                      <td>{[r.program, r.department].filter(Boolean).join(', ') || '—'}</td>
                      <td className="nm">{r.visits.length}</td>
                      <td className="nowrap">{formatDate(r.lastVisit)}</td>
                      <td>
                        {r.flags.length === 0 ? '—' : (
                          <div className="badge-row">
                            {r.flags.map((c) => {
                              const cat = specialCaseCategory(c.caseName);
                              return (
                                <span key={c.caseName} className={SPECIAL_CASE_CLASS[cat]}>
                                  {cat === 'medical' ? c.caseName : `★ ${c.caseName}`}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="no-print" onClick={(e) => e.stopPropagation()}>
                        <div className="cell-actions">
                          <button
                            className={`btn btn-sm ${open ? 'btn-primary' : 'btn-soft'}`}
                            onClick={() => setOpenKey(open ? null : r.key)}
                          >
                            {open ? 'Hide history' : 'Open history'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} perPage={perPage} total={results.length} onPageChange={setPage} />
      </div>

      {opened && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div className="card-head">
            <div>
              <h3>Visit history, {opened.name}</h3>
              <div className="sub">Expands under the selected result</div>
            </div>
            <button className="btn btn-soft btn-sm no-print" onClick={() => navigate('profile', opened.visits[0])}>
              Open full profile
            </button>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Chief complaint</th><th>Medicines and supplies</th><th>Disposition</th><th>Nurse</th>
                </tr>
              </thead>
              <tbody>
                {[...opened.visits]
                  .sort((a, b) => parseApiDate(b.startedAt) - parseApiDate(a.startedAt))
                  .slice(0, 10)
                  .map((v) => (
                    <tr key={v.visitId}>
                      <td className="nowrap nm">{formatDate(parseApiDate(v.startedAt))}</td>
                      <td>{dash(v.chiefComplaint)}</td>
                      <td>{dispensedSummary(v) || '—'}</td>
                      <td>
                        {v.dispositionName
                          ? <span className={`pill ${DISPOSITION_PILL(v.dispositionName)}`}><span className="dot" />{v.dispositionName}</span>
                          : '—'}
                      </td>
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
