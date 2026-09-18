import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { deleteVisit, listAllVisits, listVisits } from '../api/visits';
import {
  addDays, clinicDay, formatDate, formatDuration, formatTime, parseApiDate, startOfClinicDay,
} from '../lib/time';
import {
  dispensedSummary, isOpenVisit, patientMeta, SPECIAL_CASE_CLASS, specialCaseCategory, VISIT_STATUS, vitalsSummary,
} from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const dash = (v) => v || '--';
const shortStamp = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const stamp = (iso) => (iso ? shortStamp.format(parseApiDate(iso)) : '--');
/** "Modified" only once something changed after creation (MySQL DATETIME is whole seconds). */
const modified = (v) => (v.updatedAt && v.createdAt && parseApiDate(v.updatedAt) - parseApiDate(v.createdAt) >= 1000 ? stamp(v.updatedAt) : '--');
/** The Figma's duration chip: "<1HR", "2HR". */
const durationChip = (min) => (min == null ? null : min < 60 ? '<1HR' : `${Math.floor(min / 60)}HR`);

function visitDiag(v) {
  const treatment = v.treatmentNotes || dispensedSummary(v) || v.management || (v.complaints || []).join(', ');
  return treatment ? `${v.chiefComplaint} → ${treatment}` : v.chiefComplaint;
}

/**
 * Client-side mirror of the backend filters. Harmless once the backend applies
 * them (every row already matches); keeps the screen correct before it does.
 */
function matches(v, f) {
  const q = f.search.trim().toLowerCase();
  if (q && ![v.patientName, v.patientNumber, v.chiefComplaint, ...(v.complaints || [])]
    .some((s) => s && String(s).toLowerCase().includes(q))) return false;
  if (f.sex && (v.sex || '').toLowerCase() !== f.sex.toLowerCase()) return false;
  if (f.yearLevel && v.yearLevel !== f.yearLevel) return false;
  if (f.program && v.program !== f.program) return false;
  if (f.department && v.department !== f.department) return false;
  const at = parseApiDate(v.startedAt);
  if (f.dateFrom && at < startOfClinicDay(f.dateFrom)) return false;
  if (f.dateTo && at >= startOfClinicDay(addDays(f.dateTo, 1))) return false;
  return true;
}

const CSV_COLUMNS = [
  { header: 'Visit ID', value: (v) => v.visitId },
  { header: 'Date', value: (v) => formatDate(parseApiDate(v.startedAt)) },
  { header: 'Time In', value: (v) => formatTime(parseApiDate(v.startedAt)) },
  { header: 'Time Out', value: (v) => (v.endedAt ? formatTime(parseApiDate(v.endedAt)) : '') },
  { header: 'Name', value: (v) => v.patientName },
  { header: 'ID Number', value: (v) => v.patientNumber },
  { header: 'Type', value: (v) => v.patientTypeName },
  { header: 'Sex', value: (v) => v.sex },
  { header: 'Year Level', value: (v) => v.yearLevel },
  { header: 'Program', value: (v) => v.program },
  { header: 'Department', value: (v) => v.department },
  { header: 'Complaint', value: (v) => v.chiefComplaint },
  { header: 'Complaint Tags', value: (v) => (v.complaints || []).join('; ') },
  { header: 'Vitals', value: (v) => vitalsSummary(v) },
  { header: 'Management', value: (v) => v.management },
  { header: 'Treatment', value: (v) => v.treatmentNotes },
  { header: 'Medicines & Supplies Given', value: (v) => dispensedSummary(v) },
  { header: 'Disposition', value: (v) => v.dispositionName },
  { header: 'Status', value: (v) => VISIT_STATUS[v.status]?.label || v.status },
  { header: 'Attending', value: (v) => v.attendingName },
  { header: 'Created', value: (v) => stamp(v.createdAt) },
  { header: 'Modified', value: (v) => modified(v) },
];

export default function VisitRecords() {
  const { openModal, navigate } = useApp();
  const [today] = useState(() => clinicDay(new Date()));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sort, setSort] = useState({ by: 'started_at', order: 'desc' });
  const [filters, setFilters] = useState({ search: '', sex: '', yearLevel: '', program: '', department: '', dateFrom: '', dateTo: '' });
  const [exporting, setExporting] = useState(false);

  const query = {
    ...filters,
    search: filters.search.trim() || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy: sort.by,
    order: sort.order,
  };
  const table = useAsync(
    () => listVisits({ ...query, page, perPage }),
    [page, perPage, sort.by, sort.order, filters.search, filters.sex, filters.yearLevel, filters.program, filters.department, filters.dateFrom, filters.dateTo],
  );
  const todayQ = useVisitsInRange(today, today);

  const items = useMemo(() => table.data?.items || [], [table.data]);
  const total = table.data?.total ?? 0;

  const rows = useMemo(() => {
    const filtered = items.filter((v) => matches(v, filters));
    const dir = sort.order === 'asc' ? 1 : -1;
    const key = sort.by === 'patient_name' ? (v) => v.patientName.toLowerCase() : (v) => v.startedAt;
    return [...filtered].sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [items, filters, sort]);

  // Dropdown options: what the data actually contains (the Figma's lists were samples).
  const optionsFor = (field) => [...new Set(items.map((v) => v[field]).filter(Boolean))].sort();

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  const toggleSort = (by) => {
    setSort((s) => ({ by, order: s.by === by && s.order === 'desc' ? 'asc' : 'desc' }));
    setPage(1);
  };
  const sortIcon = (by) => (sort.by === by ? (sort.order === 'desc' ? '↓' : '↑') : '↕');

  const refreshAll = () => {
    table.reload();
    todayQ.reload();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = (await listAllVisits(query)).filter((v) => matches(v, filters));
      downloadCsv(`visit-records-${today}.csv`, toCsv(all, CSV_COLUMNS));
    } catch (e) {
      window.alert(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const waitingCount = todayQ.visits.filter(isOpenVisit).length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Visit Records</h1>
          <div className="sub">{total.toLocaleString()} total records logged</div>
        </div>
        <div className="head-actions no-print">
          <button className="btn btn-primary btn-sm" onClick={() => openModal('addPatient', { onSuccess: refreshAll })}>＋ Add Visit Record</button>
          <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={exporting}>{exporting ? 'Exporting…' : '⬇ Export (CSV)'}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title='Print, or pick "Save as PDF" in the print dialog'>🖨 Customize Print / PDF</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('flag-cases')}>🚩 Special Cases</button>
        </div>
      </div>

      <div className="layout-split">
        {/* Left: Main Visit Records Table */}
        <div>
          <div className="toolbar no-print">
            <input type="text" placeholder="🔍 Search By Name, ID, or Complaint..." value={filters.search} onChange={setFilter('search')} />
            <select style={{ maxWidth: '130px' }} value={filters.sex} onChange={setFilter('sex')}>
              <option value="">Gender: All</option><option value="Female">Female</option><option value="Male">Male</option>
            </select>
            <select style={{ maxWidth: '140px' }} value={filters.yearLevel} onChange={setFilter('yearLevel')}>
              <option value="">Year Level: All</option>
              {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select style={{ maxWidth: '140px' }} value={filters.program} onChange={setFilter('program')}>
              <option value="">Program: All</option>
              {optionsFor('program').map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select style={{ maxWidth: '160px' }} value={filters.department} onChange={setFilter('department')}>
              <option value="">Department: All</option>
              {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <div className="date-range">
              <input type="date" value={filters.dateFrom} onChange={setFilter('dateFrom')} title="From" />
              <span>→</span>
              <input type="date" value={filters.dateTo} onChange={setFilter('dateTo')} title="To" />
              {(filters.dateFrom || filters.dateTo) && (
                <button type="button" className="chip-x" title="Clear dates" onClick={() => { setFilters({ ...filters, dateFrom: '', dateTo: '' }); setPage(1); }}>✕</button>
              )}
            </div>
          </div>

          {table.error && <div className="login-error">{table.error}</div>}

          <div className="card table-card" style={{ padding: '0' }}>
            <table>
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('patient_name')}>NAME <span className="sort-ic">{sortIcon('patient_name')}</span></th>
                  <th>TYPE</th>
                  <th>GENDER</th>
                  <th>YEAR LEVEL</th>
                  <th>PROGRAM</th>
                  <th>DEPARTMENT</th>
                  <th className="sortable" onClick={() => toggleSort('started_at')}>DATE <span className="sort-ic">{sortIcon('started_at')}</span></th>
                  <th>CREATED</th>
                  <th>MODIFIED</th>
                  <th className="no-print">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {table.loading && !table.data ? (
                  <tr><td colSpan={10} className="sub empty-cell">Loading visits…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10} className="sub empty-cell">No visits found.</td></tr>
                ) : (
                  rows.map((v) => {
                    const startedAt = parseApiDate(v.startedAt);
                    return (
                      <tr className="rowlink" key={v.visitId} onClick={() => navigate('profile', v)}>
                        <td>
                          <div className="nm">
                            {v.patientName}
                            {(v.specialCases || []).map((c) => {
                              const cat = specialCaseCategory(c.caseName);
                              return cat === 'medical' ? null : (
                                <span key={c.caseName} className={SPECIAL_CASE_CLASS[cat]}>★ {cat === 'pwd' ? 'PWD' : 'SENIOR'}</span>
                              );
                            })}
                          </div>
                        </td>
                        <td>{dash(v.patientTypeName)}</td>
                        <td>{dash(v.sex)}</td>
                        <td>{dash(v.yearLevel)}</td>
                        <td>{dash(v.program)}</td>
                        <td>{dash(v.department)}</td>
                        <td className="nowrap">{formatDate(startedAt)}</td>
                        <td className="nowrap">{stamp(v.createdAt || v.startedAt)}</td>
                        <td className="nowrap sub">{modified(v)}</td>
                        <td className="no-print nowrap" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openModal('editPatient', { patientId: v.patientId, visit: v, onSuccess: refreshAll })}>✎</button>{' '}
                          <button className="btn btn-ghost btn-sm" title="Move to trash" onClick={() => openModal('softDelete', { what: 'visit record', onConfirm: () => deleteVisit(v.visitId), onSuccess: refreshAll })}>🗑</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar no-print">
            <div className="pg-size">
              Show{' '}
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
              </select>{' '}
              per page
            </div>
            <div className="pg-nav">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              <span className="pg-current">{page}</span>
              <span>of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
            </div>
          </div>
        </div>

        {/* Right: Today's Visits Panel */}
        <div className="today-panel no-print">
          <div className="today-panel-head">
            <h3>Today's Visits</h3>
            <span>{todayQ.visits.length} total · {waitingCount} waiting to check out</span>
          </div>

          {todayQ.error && <div className="login-error">{todayQ.error}</div>}
          {todayQ.loading ? (
            <div className="sub">Loading…</div>
          ) : todayQ.visits.length === 0 ? (
            <div className="sub">No visits logged today yet.</div>
          ) : (
            todayQ.visits.map((v) => {
              const open = isOpenVisit(v);
              const startedAt = parseApiDate(v.startedAt);
              const status = VISIT_STATUS[v.status] || { label: v.status, pill: '' };
              return (
                <div className="visit-mini-card" style={open ? undefined : { background: '#fff' }} key={v.visitId}>
                  <div className="top">
                    <div className="name">{v.patientName}</div>
                    <span className={`pill ${status.pill}`}>● {status.label}</span>
                  </div>
                  <div className="card-body">
                    <div>
                      <div className="meta">{patientMeta(v) || vitalsSummary(v) || '—'}</div>
                      <div className="diag">{visitDiag(v)}</div>
                    </div>
                    <div className="card-side">
                      {open ? (
                        <>
                          <span className="sub">Arrived <strong>{formatTime(startedAt)}</strong></span>
                          <button className="btn btn-primary btn-sm" onClick={() => openModal('checkout', { visit: v, onSuccess: refreshAll })}>Sign Out</button>
                        </>
                      ) : (
                        <>
                          <span className="sub">Visited: <strong>{formatTime(startedAt)}{v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}</strong></span>
                          {durationChip(v.durationMinutes) && <span className="dur-chip" title={formatDuration(v.durationMinutes)}>{durationChip(v.durationMinutes)}</span>}
                          {v.dispositionName && <span className="sub">{v.dispositionName}</span>}
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate('profile', v)}>View Record</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
