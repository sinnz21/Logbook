import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { deleteVisit, listAllVisits, listVisits } from '../api/visits';
import Pagination from '../components/Pagination';
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
const modified = (v) => (v.updatedAt && v.createdAt && parseApiDate(v.updatedAt) - parseApiDate(v.createdAt) >= 1000 ? stamp(v.updatedAt) : null);
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
  { header: 'Gender', value: (v) => v.sex },
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
  { header: 'Modified', value: (v) => modified(v) || 'not edited' },
];

export default function PatientRecords() {
  const { openModal, navigate } = useApp();
  const [today] = useState(() => clinicDay(new Date()));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sort, setSort] = useState({ by: 'started_at', order: 'desc' });
  const [filters, setFilters] = useState({ search: '', sex: '', yearLevel: '', program: '', department: '', dateFrom: '', dateTo: '' });
  // The Figma's date range commits on "Apply" rather than filtering as you type.
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [exporting, setExporting] = useState(false);
  // Right-hand queue panel has its own search / sort / status controls.
  const [queue, setQueue] = useState({ search: '', sort: 'time-in', status: '' });

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

  const applyRange = () => {
    setFilters((f) => ({ ...f, ...draftRange }));
    setPage(1);
  };

  const refreshAll = () => {
    table.reload();
    todayQ.reload();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = (await listAllVisits(query)).filter((v) => matches(v, filters));
      downloadCsv(`patient-records-${today}.csv`, toCsv(all, CSV_COLUMNS));
    } catch (e) {
      window.alert(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const inCareCount = todayQ.visits.filter(isOpenVisit).length;

  const queueVisits = useMemo(() => {
    const q = queue.search.trim().toLowerCase();
    const list = todayQ.visits.filter((v) => {
      if (q && !`${v.patientName} ${v.chiefComplaint || ''}`.toLowerCase().includes(q)) return false;
      if (queue.status === 'in_care' && !isOpenVisit(v)) return false;
      if (queue.status === 'completed' && isOpenVisit(v)) return false;
      return true;
    });
    return [...list].sort((a, b) =>
      queue.sort === 'name'
        ? a.patientName.localeCompare(b.patientName)
        : parseApiDate(b.startedAt) - parseApiDate(a.startedAt));
  }, [todayQ.visits, queue]);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Patient Records</h1>
          <div className="sub">
            {total.toLocaleString()} records · today&rsquo;s clinic queue sits on the right
          </div>
        </div>
      </div>

      <div className="layout-split">
        {/* Left: records table */}
        <div>
          <div className="card no-print" style={{ padding: '14px 16px' }}>
            <div className="toolbar" style={{ marginBottom: '10px' }}>
              <input type="text" placeholder="🔍 Search by name…" value={filters.search} onChange={setFilter('search')} />
              <select style={{ maxWidth: '130px' }} value={filters.sex} onChange={setFilter('sex')}>
                <option value="">Gender: All</option><option value="Female">Female</option><option value="Male">Male</option>
              </select>
              <select style={{ maxWidth: '140px' }} value={filters.yearLevel} onChange={setFilter('yearLevel')}>
                <option value="">Year Level: All</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select style={{ maxWidth: '150px' }} value={filters.program} onChange={setFilter('program')}>
                <option value="">Program: All</option>
                {optionsFor('program').map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={{ maxWidth: '170px' }} value={filters.department} onChange={setFilter('department')}>
                <option value="">Department: All</option>
                {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="toolbar" style={{ marginBottom: '0' }}>
              <div className="date-range">
                <span>From</span>
                <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
                <span>to</span>
                <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={applyRange}>Apply</button>
              {(filters.dateFrom || filters.dateTo) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setDraftRange({ dateFrom: '', dateTo: '' }); setFilters((f) => ({ ...f, dateFrom: '', dateTo: '' })); setPage(1); }}
                >
                  Clear
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                <select
                  style={{ maxWidth: '150px' }}
                  value={sort.by}
                  onChange={(e) => { setSort({ ...sort, by: e.target.value }); setPage(1); }}
                >
                  <option value="started_at">Sort by: Date</option>
                  <option value="patient_name">Sort by: Name</option>
                </select>
                <select
                  style={{ maxWidth: '150px' }}
                  value={sort.order}
                  onChange={(e) => { setSort({ ...sort, order: e.target.value }); setPage(1); }}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card no-print" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('add-visit')}>＋ Add Visit Record</button>
            <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export (PDF / CSV)'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title='Print, or pick "Save as PDF" in the print dialog'>
              Customize Print
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('flag-cases')}>Special Cases</button>
            <span className="sub" style={{ marginLeft: 'auto' }}>{total.toLocaleString()} records total</span>
          </div>

          {table.error && <div className="login-error">{table.error}</div>}

          <div className="card table-card" style={{ padding: '0' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Gender</th>
                  <th>Year</th>
                  <th>Program</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Record</th>
                  <th className="no-print">Act.</th>
                </tr>
              </thead>
              <tbody>
                {table.loading && !table.data ? (
                  <tr><td colSpan={9} className="sub empty-cell">Loading records…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={9} className="sub empty-cell">No records found.</td></tr>
                ) : (
                  rows.map((v) => {
                    const startedAt = parseApiDate(v.startedAt);
                    const edited = modified(v);
                    return (
                      <tr className="rowlink" key={v.visitId} onClick={() => navigate('profile', v)}>
                        <td>
                          <div className="nm">
                            {v.patientName}
                            {(v.specialCases || []).map((c) => {
                              const cat = specialCaseCategory(c.caseName);
                              return cat === 'medical' ? (
                                <span key={c.caseName} className={SPECIAL_CASE_CLASS[cat]} style={{ marginLeft: '6px' }}>{c.caseName}</span>
                              ) : (
                                <span key={c.caseName} className={SPECIAL_CASE_CLASS[cat]}>{cat === 'pwd' ? 'PWD' : 'SENIOR'}</span>
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
                        <td className="nowrap stack-cell">
                          <div>{stamp(v.createdAt || v.startedAt)}</div>
                          <div className="lo">{edited || 'not edited'}</div>
                        </td>
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

          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            label="Show"
          />
        </div>

        {/* Right: today's clinic queue */}
        <div className="today-panel no-print">
          <div className="today-panel-head">
            <h3>Today&rsquo;s Visits</h3>
            <span>{todayQ.visits.length} total · {inCareCount} in care</span>
          </div>

          <input
            type="text"
            placeholder="🔍 Search today's queue…"
            value={queue.search}
            onChange={(e) => setQueue({ ...queue, search: e.target.value })}
            style={{ marginBottom: '10px' }}
          />
          <div className="toolbar" style={{ marginBottom: '6px' }}>
            <select value={queue.sort} onChange={(e) => setQueue({ ...queue, sort: e.target.value })}>
              <option value="time-in">Sort by: Time in</option>
              <option value="name">Sort by: Name</option>
            </select>
            <select value={queue.status} onChange={(e) => setQueue({ ...queue, status: e.target.value })}>
              <option value="">Status: All</option>
              <option value="in_care">In care</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="sub" style={{ marginBottom: '12px' }}>
            Scrollable — the rest of today&rsquo;s queue continues below
          </div>

          {todayQ.error && <div className="login-error">{todayQ.error}</div>}
          {todayQ.loading ? (
            <div className="sub">Loading…</div>
          ) : queueVisits.length === 0 ? (
            <div className="sub">No visits match this filter.</div>
          ) : (
            queueVisits.map((v) => {
              const open = isOpenVisit(v);
              const startedAt = parseApiDate(v.startedAt);
              const status = VISIT_STATUS[v.status] || { label: v.status, pill: '' };
              return (
                <div className="visit-mini-card" style={open ? undefined : { background: '#fff' }} key={v.visitId}>
                  <div className="top">
                    <div className="name">{v.patientName}</div>
                    <span className={`pill ${status.pill}`}>{status.label}</span>
                  </div>
                  <div className="meta">{patientMeta(v) || vitalsSummary(v) || '—'}</div>
                  <div className="diag">{visitDiag(v)}</div>
                  <div className="actions">
                    {open ? (
                      <>
                        <span className="sub">Arrived {formatTime(startedAt)}</span>
                        <button className="btn btn-primary btn-sm" onClick={() => openModal('checkout', { visit: v, onSuccess: refreshAll })}>Sign Out</button>
                      </>
                    ) : (
                      <>
                        <span className="sub">
                          {formatTime(startedAt)}{v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}
                          {durationChip(v.durationMinutes) && (
                            <span className="dur-chip" style={{ marginLeft: '6px' }} title={formatDuration(v.durationMinutes)}>
                              {durationChip(v.durationMinutes)}
                            </span>
                          )}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('profile', v)}>View Record</button>
                      </>
                    )}
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
