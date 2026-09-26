import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { deletePatient, getPatient, retireSpecialCase } from '../api/patients';
import { listVisits } from '../api/visits';
import Pagination from '../components/Pagination';
import { formatDate, formatTime, parseApiDate } from '../lib/time';
import {
  dispensedSummary, initialsOf, patientMeta, SPECIAL_CASE_CLASS, specialCaseCategory,
  specialCaseLabel, vitalsSummary,
} from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';

const dash = (v) => v || '—';

const CSV_COLUMNS = [
  { header: 'Date', value: (v) => formatDate(parseApiDate(v.startedAt)) },
  { header: 'Time In', value: (v) => formatTime(parseApiDate(v.startedAt)) },
  { header: 'Time Out', value: (v) => (v.endedAt ? formatTime(parseApiDate(v.endedAt)) : '') },
  { header: 'BP / Temp / Pulse', value: (v) => vitalsSummary(v) },
  { header: 'Chief Complaint', value: (v) => v.chiefComplaint },
  { header: 'Treatment Notes', value: (v) => v.treatmentNotes || v.management },
  { header: 'Medicines & Supplies', value: (v) => dispensedSummary(v) },
  { header: 'Disposition', value: (v) => v.dispositionName },
  { header: 'Nurse', value: (v) => v.attendingName },
];

/** "Headache — 5 of 12 visits": the complaint this patient turns up with most. */
function mostCommonComplaint(visits) {
  const counts = new Map();
  for (const v of visits) {
    const tags = v.complaints?.length ? v.complaints : [v.chiefComplaint];
    for (const t of tags) {
      if (t) counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { name, count };
}

// Reached from any row that knows a patientId (record rows, today's panel,
// flagged cases). selectedPatient is whatever that row was — only patientId is relied on.
export default function PatientProfile() {
  const { selectedPatient, openModal, navigate } = useApp();
  const patientId = selectedPatient?.patientId;

  const patient = useAsync(() => (patientId ? getPatient(patientId) : Promise.resolve(null)), [patientId]);
  const history = useAsync(
    () => (patientId ? listVisits({ patientId, perPage: 200 }) : Promise.resolve(null)),
    [patientId],
  );

  const [order, setOrder] = useState('desc');
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  // Filter locally too, in case the backend doesn't support ?patient_id= yet.
  const allVisits = useMemo(
    () => (history.data?.items || []).filter((v) => v.patientId === patientId),
    [history.data, patientId],
  );

  const visits = useMemo(() => {
    const dir = order === 'asc' ? 1 : -1;
    return allVisits
      .filter((v) => {
        const day = v.startedAt?.slice(0, 10);
        if (committed.dateFrom && (!day || day < committed.dateFrom)) return false;
        if (committed.dateTo && (!day || day > committed.dateTo)) return false;
        return true;
      })
      .sort((a, b) => (a.startedAt < b.startedAt ? -dir : dir));
  }, [allVisits, committed, order]);

  if (!patientId) {
    return <div className="view active"><div className="sub">No patient selected.</div></div>;
  }

  const p = patient.data;
  const activeCases = (p?.specialCases || []).filter((c) => c.active);
  const common = mostCommonComplaint(allVisits);
  const lastVisit = allVisits.length ? parseApiDate(allVisits[0].startedAt) : null;
  const medicineUnits = allVisits.reduce(
    (sum, v) => sum + (v.medicines || []).reduce((n, m) => n + (Number(m.quantityGiven) || 0), 0),
    0,
  );
  const pageRows = visits.slice((page - 1) * perPage, page * perPage);

  const refresh = () => {
    patient.reload();
    history.reload();
  };

  const retire = async (c) => {
    try {
      await retireSpecialCase(patientId, c.patientSpecialCaseId);
      patient.reload();
    } catch (e) {
      window.alert(`Couldn't retire flag: ${e.message}`);
    }
  };

  const flaggedLine = activeCases
    .map((c) => specialCaseLabel(c))
    .join(' · ');

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Patient Profile</h1>
          <div className="sub">
            {p?.fullName || selectedPatient.patientName || 'Loading…'} · complete visit history
          </div>
        </div>
      </div>

      {patient.error && <div className="login-error">Couldn&rsquo;t load this patient: {patient.error}</div>}

      {activeCases.length > 0 && (
        <div className="alert-banner danger">
          <div className="ic">⚑</div>
          <div className="txt">
            <strong>Special case — appears on every visit</strong>
            <span>{flaggedLine}</span>
          </div>
          <button className="go no-print" onClick={() => navigate('flag-cases')}>Manage flags →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <div className="profile-head">
            <div className="avatar-lg">{initialsOf(p?.fullName || selectedPatient.patientName || '')}</div>
            <div>
              <div className="profile-name">
                {p?.fullName || selectedPatient.patientName || 'Loading…'}
                {p?.patientTypeName && <span className="pill active" style={{ marginLeft: '8px' }}>{p.patientTypeName}</span>}
                {activeCases
                  .filter((c) => specialCaseCategory(c.caseName) !== 'medical')
                  .map((c) => (
                    <span key={c.patientSpecialCaseId} className={SPECIAL_CASE_CLASS[specialCaseCategory(c.caseName)]}>
                      {c.caseName}
                    </span>
                  ))}
              </div>
              <div className="sub">{p ? patientMeta(p) || 'No details on file' : ''}</div>
              {p && (
                <div className="sub" style={{ marginTop: '4px' }}>
                  {[p.sex, p.age != null && `${p.age} years old`, p.civilStatus, p.contactNumber].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          </div>

          <div className="head-actions no-print">
            <button className="btn btn-outline btn-sm" disabled={!p} onClick={() => navigate('medical-certificate', selectedPatient)}>
              Print Medical Certificate
            </button>
            <button className="btn btn-outline btn-sm" disabled={!p} onClick={() => navigate('parental-notification', selectedPatient)}>
              Print Parental Notification
            </button>
            <button className="btn btn-primary btn-sm" disabled={!p} onClick={() => openModal('editPatient', { patientId, onSuccess: refresh })}>
              Edit patient
            </button>
            <button className="btn btn-ghost btn-sm" disabled={!p} onClick={() => openModal('softDelete', {
              what: 'patient record',
              onConfirm: () => deletePatient(patientId),
              onSuccess: () => navigate('patient-records'),
            })}>🗑</button>
          </div>
        </div>

        {activeCases.length > 0 && (
          <div className="badge-row" style={{ marginTop: '12px' }}>
            {activeCases.map((c) => (
              <span key={c.patientSpecialCaseId} className={SPECIAL_CASE_CLASS[specialCaseCategory(c.caseName)]}>
                {specialCaseLabel(c)}
                <button type="button" className="chip-x no-print" title="Retire flag" onClick={() => retire(c)}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Total Visits</div>
          <div className="value">{p?.visitCount ?? allVisits.length}</div>
          <div className="foot">On record</div>
        </div>
        <div className="kpi">
          <div className="label">Last Visit</div>
          <div className="value" style={{ fontSize: '19px' }}>{lastVisit ? formatDate(lastVisit) : '—'}</div>
          <div className="foot">{lastVisit ? formatTime(lastVisit) : 'No visits yet'}</div>
        </div>
        <div className="kpi">
          <div className="label">Most Common</div>
          <div className="value" style={{ fontSize: '19px' }}>{common?.name || '—'}</div>
          <div className="foot">{common ? `${common.count} of ${allVisits.length} visits` : '—'}</div>
        </div>
        <div className="kpi">
          <div className="label">Medicines Received</div>
          <div className="value">{medicineUnits || 0}</div>
          <div className="foot">Units all-time</div>
        </div>
      </div>

      <div className="card" style={{ padding: '18px 20px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Visit History</h3>
            <div className="sub">One search replaces flipping the logbook page by page</div>
          </div>
          <button
            className="btn btn-ghost btn-sm no-print"
            disabled={visits.length === 0}
            onClick={() => downloadCsv(`visit-history-${p?.patientNumber || patientId}.csv`, toCsv(visits, CSV_COLUMNS))}
          >
            Export history
          </button>
        </div>

        <div className="toolbar no-print">
          <select style={{ maxWidth: '150px' }} value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
        </div>

        {history.error && <div className="login-error">{history.error}</div>}

        <div className="table-card" style={{ margin: '0 -20px' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>BP / Temp / Pulse</th>
                <th>Chief Complaint</th>
                <th>Treatment Notes</th>
                <th>Medicines &amp; Supplies</th>
                <th>Disposition</th>
                <th>Nurse</th>
              </tr>
            </thead>
            <tbody>
              {history.loading ? (
                <tr><td colSpan={7} className="sub empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="sub empty-cell">No visits on record.</td></tr>
              ) : (
                pageRows.map((v) => {
                  const at = parseApiDate(v.startedAt);
                  return (
                    <tr key={v.visitId}>
                      <td className="nowrap nm">
                        {formatDate(at)}
                        <div className="sub">{formatTime(at)}{v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}</div>
                      </td>
                      <td className="sub nowrap">{vitalsSummary(v) || '—'}</td>
                      <td>
                        <div>{dash(v.chiefComplaint)}</div>
                        {v.complaints?.length > 0 && <div className="sub">{v.complaints.join(', ')}</div>}
                      </td>
                      <td>{dash(v.treatmentNotes || v.management)}</td>
                      <td>{dispensedSummary(v) || '—'}</td>
                      <td>{v.dispositionName ? <span className="pill active">{v.dispositionName}</span> : '—'}</td>
                      <td>{dash(v.attendingName)}</td>
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
          total={visits.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>
    </div>
  );
}
