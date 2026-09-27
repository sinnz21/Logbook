import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listSpecialCases } from '../api/patients';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { formatDate, formatTime, parseApiDate } from '../lib/time';
import { SPECIAL_CASE_CLASS, specialCaseCategory } from '../lib/format';

const dash = (v) => v || '—';

/** Tile caption colour, matching the design's per-flag palette. */
function tileTone(caseName) {
  const cat = specialCaseCategory(caseName);
  if (cat === 'pwd') return 'teal';
  if (cat === 'senior') return 'blue';
  return /allerg/i.test(caseName) ? 'red' : 'amber';
}

const TILE_FOOT = {
  PWD: 'Priority queue',
  'Senior Citizen': 'Priority queue',
  Allergy: 'Most common flag',
  Anxiety: 'Usually exam season',
};

/**
 * The design's tile strip: total active flags, then the five most common case
 * types. Derived from the data rather than hardcoded, so a clinic that flags
 * different things still gets meaningful tiles.
 */
function caseTiles(rows) {
  const counts = new Map();
  for (const r of rows) {
    if (!r.active) continue;
    counts.set(r.caseName, (counts.get(r.caseName) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export default function PriorityCases() {
  const { openModal, navigate } = useApp();
  const [status, setStatus] = useState('active');
  const cases = useAsync(
    () => listSpecialCases(status === 'all' ? {} : { active: status === 'active' }),
    [status],
  );

  const [filters, setFilters] = useState({ search: '', caseType: '', patientType: '' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [sort, setSort] = useState('flagged-desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(6);

  const all = useMemo(() => cases.data || [], [cases.data]);
  const activeRows = all.filter((r) => r.active);
  const tiles = caseTiles(all);
  const patientCount = new Set(activeRows.map((r) => r.patientId)).size;

  const caseTypes = useMemo(() => [...new Set(all.map((r) => r.caseName).filter(Boolean))].sort(), [all]);
  const patientTypes = useMemo(() => [...new Set(all.map((r) => r.patientTypeName).filter(Boolean))].sort(), [all]);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const dir = sort.endsWith('asc') ? 1 : -1;
    return all
      .filter((r) => {
        if (q && ![r.patientName, r.patientNumber, r.caseName, r.notes].some((s) => s && String(s).toLowerCase().includes(q))) return false;
        if (filters.caseType && r.caseName !== filters.caseType) return false;
        if (filters.patientType && r.patientTypeName !== filters.patientType) return false;
        const day = r.flaggedAt?.slice(0, 10);
        if (committed.dateFrom && (!day || day < committed.dateFrom)) return false;
        if (committed.dateTo && (!day || day > committed.dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort.startsWith('patient')) return a.patientName.localeCompare(b.patientName) * dir;
        return ((a.flaggedAt || '') < (b.flaggedAt || '') ? -dir : dir);
      });
  }, [all, filters, committed, sort]);

  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Priority and special cases</h1>
          <div className="sub">Flags are stored against the patient, so they appear on every future visit</div>
        </div>
        <button className="btn btn-primary no-print" onClick={() => openModal('flagPatient', { onSuccess: cases.reload })}>
          <Icon name="plus" size={18} /> Flag a patient
        </button>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="text" placeholder="Search patient name or ID" value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="auto" value={filters.caseType} onChange={setFilter('caseType')}>
            <option value="">Case type: all</option>
            {caseTypes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="auto" value={filters.patientType} onChange={setFilter('patientType')}>
            <option value="">Patient type: all</option>
            {patientTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="active">Status: active</option>
            <option value="retired">Status: inactive</option>
            <option value="all">Status: all</option>
          </select>
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div className="spacer" />
          <select className="auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="flagged-desc">Sort: flagged on, newest</option>
            <option value="flagged-asc">Sort: flagged on, oldest</option>
            <option value="patient-asc">Sort: patient, A to Z</option>
          </select>
        </div>
      </div>

      <div className={`kpi-row ${tiles.length >= 5 ? 'six' : 'five'}`}>
        <div className="kpi">
          <div className="cap ink">Active flags</div>
          <div className="value">{cases.loading ? '…' : activeRows.length}</div>
          <div className="foot">Across {patientCount} patient{patientCount === 1 ? '' : 's'}</div>
        </div>
        {tiles.map(([name, count]) => (
          <div className="kpi" key={name}>
            <div className={`cap ${tileTone(name)}`}>{name}</div>
            <div className="value">{count}</div>
            <div className="foot">
              {TILE_FOOT[name] || (specialCaseCategory(name) === 'medical' ? 'Chronic conditions' : 'Priority queue')}
            </div>
          </div>
        ))}
      </div>

      {cases.error && <div className="login-error" style={{ marginBottom: 14 }}>{cases.error}</div>}

      <div className="card" style={{ padding: '20px 22px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Flagged patients</h3>
            <div className="sub">Linked to the patient record, not to a single visit</div>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Status</th><th>Flagged on</th><th>Patient</th>
                <th>Case type</th><th>Notes</th><th>Flagged by</th><th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {cases.loading ? (
                <tr><td colSpan={7} className="empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No flagged patients match.</td></tr>
              ) : (
                pageRows.map((r) => {
                  const at = r.flaggedAt ? parseApiDate(r.flaggedAt) : null;
                  return (
                    <tr
                      className="rowlink"
                      key={r.patientSpecialCaseId}
                      onClick={() => navigate('profile', { patientId: r.patientId, patientName: r.patientName })}
                    >
                      <td>
                        <span className={`pill ${r.active ? 'teal' : 'grey'}`}><span className="dot" />{r.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="nowrap stack-cell">
                        <div>{at ? formatDate(at) : '—'}</div>
                        {at && <div className="lo">{formatTime(at)}</div>}
                      </td>
                      <td className="stack-cell">
                        <div className="nm">{r.patientName}</div>
                        <div className="lo">{[r.patientTypeName, r.patientNumber].filter(Boolean).join(', ')}</div>
                      </td>
                      <td>
                        <span className={SPECIAL_CASE_CLASS[specialCaseCategory(r.caseName)]}>
                          {specialCaseCategory(r.caseName) === 'medical' ? r.caseName : `★ ${r.caseName}`}
                        </span>
                      </td>
                      <td>{dash(r.notes)}</td>
                      <td className="sub">{dash(r.flaggedByName)}</td>
                      <td className="no-print" onClick={(e) => e.stopPropagation()}>
                        <div className="cell-actions">
                          <button
                            className={`btn btn-sm ${r.active ? 'btn-ghost' : 'btn-soft'}`}
                            onClick={() => openModal('flagPatient', {
                              patientId: r.patientId,
                              patientName: r.patientName,
                              flag: r,
                              onSuccess: cases.reload,
                            })}
                          >
                            {r.active ? 'Edit' : 'Restore'}
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

        <Pagination page={page} perPage={perPage} total={rows.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
