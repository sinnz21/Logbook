import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listSpecialCases } from '../api/patients';
import Pagination from '../components/Pagination';
import { formatDate, formatTime, parseApiDate } from '../lib/time';
import { SPECIAL_CASE_CLASS, specialCaseCategory } from '../lib/format';

const dash = (v) => v || '—';

/**
 * The Figma's tile strip: total active flags, then the five most common case
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
  const [sort, setSort] = useState({ by: 'flagged', order: 'desc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const all = useMemo(() => cases.data || [], [cases.data]);
  const activeRows = all.filter((r) => r.active);
  const tiles = caseTiles(all);
  const patientCount = new Set(activeRows.map((r) => r.patientId)).size;

  const caseTypes = useMemo(() => [...new Set(all.map((r) => r.caseName).filter(Boolean))].sort(), [all]);
  const patientTypes = useMemo(() => [...new Set(all.map((r) => r.patientTypeName).filter(Boolean))].sort(), [all]);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const dir = sort.order === 'asc' ? 1 : -1;
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
        if (sort.by === 'name') return a.patientName.localeCompare(b.patientName) * dir;
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
          <h1>Priority &amp; Special Cases</h1>
          <div className="sub">Flags are stored against the patient, so they appear on every future visit</div>
        </div>
      </div>

      <div className="card no-print" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="🔍 Search patient name or ID…" value={filters.search} onChange={setFilter('search')} />
          <select style={{ maxWidth: '170px' }} value={filters.caseType} onChange={setFilter('caseType')}>
            <option value="">Case type: All</option>
            {caseTypes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ maxWidth: '180px' }} value={filters.patientType} onChange={setFilter('patientType')}>
            <option value="">Patient type: All</option>
            {patientTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select style={{ maxWidth: '150px' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="active">Status: Active</option>
            <option value="retired">Status: Retired</option>
            <option value="all">Status: All</option>
          </select>
        </div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <select style={{ maxWidth: '180px' }} value={sort.by} onChange={(e) => setSort({ ...sort, by: e.target.value })}>
              <option value="flagged">Sort by: Flagged on</option>
              <option value="name">Sort by: Patient</option>
            </select>
            <select style={{ maxWidth: '150px' }} value={sort.order} onChange={(e) => setSort({ ...sort, order: e.target.value })}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('flagPatient', { onSuccess: cases.reload })}>
              ＋ Flag a patient
            </button>
          </div>
        </div>
      </div>

      <div className={`kpi-row ${tiles.length >= 5 ? 'six' : 'five'}`}>
        <div className="kpi">
          <div className="label">Active Flags</div>
          <div className="value">{cases.loading ? '…' : activeRows.length}</div>
          <div className="foot">Across {patientCount} patient{patientCount === 1 ? '' : 's'}</div>
        </div>
        {tiles.map(([name, count]) => (
          <div className="kpi" key={name}>
            <div className="label">{name}</div>
            <div className="value">{count}</div>
            <div className="foot">
              {specialCaseCategory(name) === 'medical' ? 'Medical flag' : 'Priority queue'}
            </div>
          </div>
        ))}
      </div>

      {cases.error && <div className="login-error">{cases.error}</div>}

      <div className="card" style={{ padding: '18px 20px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Flagged Patients</h3>
            <div className="sub">Linked to the patient record, not to a single visit</div>
          </div>
        </div>

        <div className="table-card" style={{ margin: '0 -20px' }}>
          <table>
            <thead>
              <tr>
                <th>Status</th><th>Flagged On</th><th>Patient</th>
                <th>Case Type</th><th>Notes</th><th>Flagged By</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.loading ? (
                <tr><td colSpan={7} className="sub empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="sub empty-cell">No flagged patients match.</td></tr>
              ) : (
                pageRows.map((r) => {
                  const at = r.flaggedAt ? parseApiDate(r.flaggedAt) : null;
                  return (
                    <tr
                      className="rowlink"
                      key={r.patientSpecialCaseId}
                      onClick={() => navigate('profile', { patientId: r.patientId, patientName: r.patientName })}
                    >
                      <td><span className={`pill ${r.active ? 'active' : 'inactive'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="nowrap">
                        {at ? formatDate(at) : '—'}
                        {at && <div className="sub">{formatTime(at)}</div>}
                      </td>
                      <td>
                        <div className="nm">{r.patientName}</div>
                        <div className="sub">{[r.patientTypeName, r.patientNumber].filter(Boolean).join(' · ')}</div>
                      </td>
                      <td><span className={SPECIAL_CASE_CLASS[specialCaseCategory(r.caseName)]}>{r.caseName}</span></td>
                      <td>{dash(r.notes)}</td>
                      <td className="sub">{dash(r.flaggedByName)}</td>
                      <td className="no-print" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openModal('flagPatient', {
                            patientId: r.patientId,
                            patientName: r.patientName,
                            flag: r,
                            onSuccess: cases.reload,
                          })}
                        >
                          {r.active ? 'Edit' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          perPage={perPage}
          total={rows.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>
    </div>
  );
}
