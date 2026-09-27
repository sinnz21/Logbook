import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { deletePatient, getPatient, retireSpecialCase } from '../api/patients';
import { listVisits } from '../api/visits';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { formatDate, formatTime, parseApiDate } from '../lib/time';
import {
  dispensedSummary, initialsOf, SPECIAL_CASE_CLASS, specialCaseCategory,
  specialCaseLabel, vitalsSummary,
} from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';

const dash = (v) => v || '—';

const DISPOSITION_PILL = (name = '') =>
  /hospital|referred/i.test(name) ? 'blue' : /sent home/i.test(name) ? 'amber' : 'teal';

const CSV_COLUMNS = [
  { header: 'Date', value: (v) => formatDate(parseApiDate(v.startedAt)) },
  { header: 'Time In', value: (v) => formatTime(parseApiDate(v.startedAt)) },
  { header: 'Time Out', value: (v) => (v.endedAt ? formatTime(parseApiDate(v.endedAt)) : '') },
  { header: 'BP, temp, pulse', value: (v) => vitalsSummary(v) },
  { header: 'Chief complaint', value: (v) => v.chiefComplaint },
  { header: 'Treatment notes', value: (v) => v.treatmentNotes || v.management },
  { header: 'Medicines and supplies', value: (v) => dispensedSummary(v) },
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
  const [perPage] = useState(5);

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
  const name = p?.fullName || selectedPatient.patientName || 'Loading…';

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

  const flaggedBy = activeCases.find((c) => c.flaggedByName)?.flaggedByName;
  const flaggedAt = activeCases.find((c) => c.flaggedAt)?.flaggedAt;

  return (
    <div className="view active">
      <button className="back-link no-print" onClick={() => navigate('patient-records')}>
        <Icon name="chevronLeft" size={16} /> Back to patient records
      </button>

      {patient.error && <div className="login-error" style={{ marginBottom: 14 }}>Couldn&rsquo;t load this patient: {patient.error}</div>}

      {activeCases.length > 0 && (
        <div className="alert-banner danger">
          <div className="ic-wrap"><Icon name="flag" size={20} /></div>
          <div className="txt">
            <strong>Special case, appears on every visit</strong>
            <span>
              {activeCases.map((c) => specialCaseLabel(c)).join('. ')}.
              {flaggedAt && ` Flagged ${formatDate(parseApiDate(flaggedAt))}`}
              {flaggedBy && ` by ${flaggedBy}`}.
            </span>
          </div>
          <button className="go no-print" onClick={() => navigate('flag-cases')}>Manage flags</button>
        </div>
      )}

      <div className="card">
        <div className="card-head" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div className="avatar lg">{initialsOf(name)}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--head)', letterSpacing: '-.02em' }}>{name}</h1>
                {p?.patientTypeName && <span className="pill teal"><span className="dot" />{p.patientTypeName}</span>}
                {activeCases
                  .filter((c) => specialCaseCategory(c.caseName) !== 'medical')
                  .map((c) => (
                    <span key={c.patientSpecialCaseId} className={SPECIAL_CASE_CLASS[specialCaseCategory(c.caseName)]}>
                      ★ {c.caseName}
                    </span>
                  ))}
              </div>
              <div className="sub" style={{ marginTop: 5 }}>
                {[p?.patientNumber, p?.program, p?.yearLevel, p?.department].filter(Boolean).join(', ') || 'No details on file'}
              </div>
              <div className="sub">
                {[p?.sex, p?.age != null && `${p.age} years old`, p?.contactNumber].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>

          <div className="head-actions no-print">
            <button className="btn btn-ghost" disabled={!p} onClick={() => navigate('medical-certificate', selectedPatient)}>
              <Icon name="printer" size={17} /> Medical certificate
            </button>
            <button className="btn btn-ghost" disabled={!p} onClick={() => navigate('parental-notification', selectedPatient)}>
              <Icon name="printer" size={17} /> Parental notification
            </button>
            <button className="btn btn-primary" disabled={!p} onClick={() => openModal('editPatient', { patientId, onSuccess: refresh })}>
              Edit patient
            </button>
            <button
              className="icon-btn danger"
              disabled={!p}
              title="Move to trash"
              onClick={() => openModal('softDelete', {
                what: 'patient record',
                onConfirm: () => deletePatient(patientId),
                onSuccess: () => navigate('patient-records'),
              })}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>

        {activeCases.length > 0 && (
          <div className="badge-row" style={{ marginTop: 16 }}>
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
          <div className="cap ink">Total visits</div>
          <div className="value">{p?.visitCount ?? allVisits.length}</div>
          <div className="foot">On record</div>
        </div>
        <div className="kpi">
          <div className="cap ink">Last visit</div>
          <div className="value" style={{ fontSize: 22 }}>{lastVisit ? formatDate(lastVisit) : '—'}</div>
          <div className="foot">{lastVisit ? formatTime(lastVisit) : 'No visits yet'}</div>
        </div>
        <div className="kpi">
          <div className="cap ink">Most common</div>
          <div className="value" style={{ fontSize: 22 }}>{common?.name || '—'}</div>
          <div className="foot">{common ? `${common.count} of ${allVisits.length} visits` : '—'}</div>
        </div>
        <div className="kpi">
          <div className="cap ink">Medicines received</div>
          <div className="value">{medicineUnits || 0}</div>
          <div className="foot">Units all-time</div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 22px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Visit history</h3>
            <div className="sub">One search replaces flipping the logbook page by page</div>
          </div>
          <div className="head-actions no-print">
            <select className="auto" value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">Sort: date, newest</option>
              <option value="asc">Sort: date, oldest</option>
            </select>
            <input type="date" className="auto" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <input type="date" className="auto" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
            <button className="btn btn-soft btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={visits.length === 0}
              onClick={() => downloadCsv(`visit-history-${p?.patientNumber || patientId}.csv`, toCsv(visits, CSV_COLUMNS))}
            >
              <Icon name="download" size={16} /> Export history
            </button>
          </div>
        </div>

        {history.error && <div className="login-error" style={{ marginBottom: 14 }}>{history.error}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>BP, temp, pulse</th><th>Chief complaint</th>
                <th>Treatment notes</th><th>Medicines and supplies</th><th>Disposition</th><th>Nurse</th>
              </tr>
            </thead>
            <tbody>
              {history.loading ? (
                <tr><td colSpan={7} className="empty-cell">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No visits on record.</td></tr>
              ) : (
                pageRows.map((v) => {
                  const at = parseApiDate(v.startedAt);
                  return (
                    <tr key={v.visitId}>
                      <td className="nowrap nm">{formatDate(at)}</td>
                      <td className="sub nowrap">{vitalsSummary(v) || '—'}</td>
                      <td>{dash(v.chiefComplaint)}</td>
                      <td>{dash(v.treatmentNotes || v.management)}</td>
                      <td>{dispensedSummary(v) || '—'}</td>
                      <td>
                        {v.dispositionName
                          ? <span className={`pill ${DISPOSITION_PILL(v.dispositionName)}`}><span className="dot" />{v.dispositionName}</span>
                          : '—'}
                      </td>
                      <td>{dash(v.attendingName)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} perPage={perPage} total={visits.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
