import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { deleteVisit, listAllVisits, listVisits } from '../api/visits';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import {
  addDays, clinicDay, formatDate, formatTime, parseApiDate, startOfClinicDay,
} from '../lib/time';
import {
  dispensedSummary, isOpenVisit, SPECIAL_CASE_CLASS, specialCaseCategory, VISIT_STATUS, vitalsSummary,
} from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const dash = (v) => v || '—';
const shortStamp = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const stamp = (iso) => (iso ? shortStamp.format(parseApiDate(iso)) : '—');
/** "Edited" only once something changed after creation (MySQL DATETIME is whole seconds). */
const editedAt = (v) => (v.updatedAt && v.createdAt && parseApiDate(v.updatedAt) - parseApiDate(v.createdAt) >= 1000 ? stamp(v.updatedAt) : null);

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
  { header: 'Edited', value: (v) => editedAt(v) || 'Not edited' },
];

export default function PatientRecords() {
  const { openModal, navigate } = useApp();
  const [today] = useState(() => clinicDay(new Date()));
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [sort, setSort] = useState('date-desc');
  const [filters, setFilters] = useState({ search: '', sex: '', yearLevel: '', program: '', department: '', dateFrom: '', dateTo: '' });
  // The design's date range commits on "Apply" rather than filtering as you type.
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [exporting, setExporting] = useState(false);
  const [queue, setQueue] = useState({ search: '', sort: 'time-in', tab: 'all' });

  const [sortBy, order] = sort === 'name-asc' ? ['patient_name', 'asc'] : ['started_at', sort === 'date-asc' ? 'asc' : 'desc'];

  const query = {
    ...filters,
    search: filters.search.trim() || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sortBy,
    order,
  };
  const table = useAsync(
    () => listVisits({ ...query, page, perPage }),
    [page, perPage, sortBy, order, filters.search, filters.sex, filters.yearLevel, filters.program, filters.department, filters.dateFrom, filters.dateTo],
  );
  const todayQ = useVisitsInRange(today, today);

  const items = useMemo(() => table.data?.items || [], [table.data]);
  const total = table.data?.total ?? 0;

  const rows = useMemo(() => {
    const filtered = items.filter((v) => matches(v, filters));
    const dir = order === 'asc' ? 1 : -1;
    const key = sortBy === 'patient_name' ? (v) => v.patientName.toLowerCase() : (v) => v.startedAt;
    return [...filtered].sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
  }, [items, filters, sortBy, order]);

  // Dropdown options: what the data actually contains (the design's lists were samples).
  const optionsFor = (field) => [...new Set(items.map((v) => v[field]).filter(Boolean))].sort();

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
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

  const inCare = todayQ.visits.filter(isOpenVisit).length;

  const queueVisits = useMemo(() => {
    const q = queue.search.trim().toLowerCase();
    const list = todayQ.visits.filter((v) => {
      if (q && !`${v.patientName} ${v.chiefComplaint || ''}`.toLowerCase().includes(q)) return false;
      if (queue.tab === 'in-care' && !isOpenVisit(v)) return false;
      if (queue.tab === 'completed' && isOpenVisit(v)) return false;
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
          <h1>Patient records</h1>
          <div className="sub">
            {total.toLocaleString()} records, with today&rsquo;s clinic queue on the right
          </div>
        </div>
        <button className="btn btn-primary no-print" onClick={() => navigate('add-visit')}>
          <Icon name="plus" size={18} /> Add visit record
        </button>
      </div>

      <div className="layout-split">
        <div>
          <div className="filter-card no-print">
            <div className="filter-row">
              <div className="search-field">
                <Icon name="search" size={17} className="ic" />
                <input type="text" placeholder="Search by name" value={filters.search} onChange={setFilter('search')} />
              </div>
              <select className="auto" value={filters.sex} onChange={setFilter('sex')}>
                <option value="">Gender: all</option><option value="Female">Female</option><option value="Male">Male</option>
              </select>
              <select className="auto" value={filters.yearLevel} onChange={setFilter('yearLevel')}>
                <option value="">Year level: all</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="auto" value={filters.program} onChange={setFilter('program')}>
                <option value="">Program: all</option>
                {optionsFor('program').map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="filter-row">
              <select className="auto" value={filters.department} onChange={setFilter('department')}>
                <option value="">Department: all</option>
                {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="date-range">
                <span>From</span>
                <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
                <span>to</span>
                <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
              </div>
              <button className="btn btn-soft btn-sm" onClick={() => { setFilters((f) => ({ ...f, ...draftRange })); setPage(1); }}>
                Apply
              </button>
              <div className="spacer" />
              <select className="auto" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                <option value="date-desc">Sort: date, newest</option>
                <option value="date-asc">Sort: date, oldest</option>
                <option value="name-asc">Sort: name, A to Z</option>
              </select>
            </div>

            <div className="filter-row">
              <button className="btn btn-ghost btn-sm" onClick={handleExport} disabled={exporting}>
                <Icon name="download" size={16} /> {exporting ? 'Exporting…' : 'Export PDF or CSV'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()} title='Print, or pick "Save as PDF" in the print dialog'>
                <Icon name="sliders" size={16} /> Customize print
              </button>
              <button className="btn btn-soft btn-sm" onClick={() => navigate('flag-cases')}>
                <Icon name="flag" size={16} /> Special cases
              </button>
              <span className="sub spacer">{total.toLocaleString()} records total</span>
            </div>
          </div>

          {table.error && <div className="login-error" style={{ marginBottom: 14 }}>{table.error}</div>}

          <div className="card" style={{ padding: '14px 16px 6px' }}>
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Type</th><th>Gender</th><th>Year</th>
                    <th>Program and department</th><th>Record</th><th className="no-print" />
                  </tr>
                </thead>
                <tbody>
                  {table.loading && !table.data ? (
                    <tr><td colSpan={7} className="empty-cell">Loading records…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={7} className="empty-cell">No records found.</td></tr>
                  ) : (
                    rows.map((v) => {
                      const edited = editedAt(v);
                      const flags = v.specialCases || [];
                      return (
                        <tr className="rowlink" key={v.visitId} onClick={() => navigate('profile', v)}>
                          <td>
                            <div className="nm">{v.patientName}</div>
                            {flags.length > 0 && (
                              <div className="badge-row" style={{ marginTop: 5 }}>
                                {flags.map((c) => {
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
                          <td>{dash(v.patientTypeName)}</td>
                          <td>{dash(v.sex)}</td>
                          <td>{dash(v.yearLevel)}</td>
                          <td className="stack-cell">
                            <div>{dash(v.program)}</div>
                            <div className="lo">{dash(v.department)}</div>
                          </td>
                          <td className="nowrap stack-cell">
                            <div>{stamp(v.createdAt || v.startedAt)}</div>
                            <div className="lo">{edited ? `Edited ${edited}` : 'Not edited'}</div>
                          </td>
                          <td className="no-print" onClick={(e) => e.stopPropagation()}>
                            <div className="cell-actions">
                              <button
                                className="icon-btn"
                                title="Edit"
                                onClick={() => openModal('editPatient', { patientId: v.patientId, visit: v, onSuccess: refreshAll })}
                              >
                                <Icon name="pencil" size={16} />
                              </button>
                              <button
                                className="icon-btn danger"
                                title="Move to trash"
                                onClick={() => openModal('softDelete', { what: 'visit record', onConfirm: () => deleteVisit(v.visitId), onSuccess: refreshAll })}
                              >
                                <Icon name="trash" size={16} />
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

            <Pagination
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
              onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
            />
          </div>
        </div>

        {/* Right: today's clinic queue */}
        <div className="today-panel no-print">
          <div className="today-panel-head">
            <h3>Today&rsquo;s visits</h3>
            <span className="pill teal">{todayQ.visits.length} total, {inCare} in care</span>
          </div>

          <div className="search-field" style={{ marginBottom: 10 }}>
            <Icon name="search" size={16} className="ic" />
            <input
              type="text"
              placeholder="Search today's queue"
              value={queue.search}
              onChange={(e) => setQueue({ ...queue, search: e.target.value })}
            />
          </div>
          <div className="filter-row" style={{ marginBottom: 10 }}>
            <select className="grow" value={queue.sort} onChange={(e) => setQueue({ ...queue, sort: e.target.value })}>
              <option value="time-in">Sort: time in</option>
              <option value="name">Sort: name</option>
            </select>
          </div>
          <div className="segmented full" style={{ marginBottom: 14 }}>
            {[['all', 'All'], ['in-care', 'In care'], ['completed', 'Completed']].map(([id, label]) => (
              <button key={id} className={queue.tab === id ? 'active' : ''} onClick={() => setQueue({ ...queue, tab: id })}>
                {label}
              </button>
            ))}
          </div>

          {todayQ.error && <div className="login-error">{todayQ.error}</div>}

          <div className="today-list">
            {todayQ.loading ? (
              <div className="sub">Loading…</div>
            ) : queueVisits.length === 0 ? (
              <div className="sub">No visits match this filter.</div>
            ) : (
              queueVisits.map((v) => {
                const open = isOpenVisit(v);
                const at = parseApiDate(v.startedAt);
                const status = VISIT_STATUS[v.status] || { label: v.status, pill: 'grey' };
                return (
                  <div className={`visit-mini-card${open ? ' open' : ''}`} key={v.visitId}>
                    <div className="top">
                      <div className="name">{v.patientName}</div>
                      <span className={`pill ${status.pill}`}><span className="dot" />{status.label}</span>
                    </div>
                    <div className="meta">
                      {[v.patientTypeName, v.program, v.yearLevel, v.patientNumber].filter(Boolean).join(', ')}
                    </div>
                    <div className="diag">{visitDiag(v)}</div>
                    <div className="actions">
                      {open ? (
                        <>
                          <span className="sub">Arrived {formatTime(at)}</span>
                          <button className="btn btn-primary btn-sm" onClick={() => openModal('checkout', { visit: v, onSuccess: refreshAll })}>
                            Sign out
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="sub">
                            {formatTime(at)}{v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}
                          </span>
                          <button className="btn btn-soft btn-sm" onClick={() => navigate('profile', v)}>View record</button>
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
    </div>
  );
}
