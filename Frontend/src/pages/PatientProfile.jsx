import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { deletePatient, getPatient, retireSpecialCase } from '../api/patients';
import { listVisits } from '../api/visits';
import { formatDate, formatTime, parseApiDate } from '../lib/time';
import {
  dispensedSummary, initialsOf, patientMeta, SPECIAL_CASE_CLASS, specialCaseCategory, specialCaseLabel, VISIT_STATUS, vitalsSummary,
} from '../lib/format';
import { notConnected } from '../lib/notConnected';

// Reached from any row that knows a patientId (visit rows, today's panel,
// flagged cases). selectedPatient is whatever that row was — only patientId is relied on.
export default function PatientProfile() {
  const { selectedPatient, openModal, navigate } = useApp();
  const patientId = selectedPatient?.patientId;

  const patient = useAsync(() => (patientId ? getPatient(patientId) : Promise.resolve(null)), [patientId]);
  const history = useAsync(
    () => (patientId ? listVisits({ patientId, perPage: 100 }) : Promise.resolve(null)),
    [patientId],
  );

  if (!patientId) {
    return <div className="view active"><div className="sub">No patient selected.</div></div>;
  }

  const p = patient.data;
  // Filter locally too, in case the backend doesn't support ?patient_id= yet.
  const visits = (history.data?.items || []).filter((v) => v.patientId === patientId);
  const activeCases = (p?.specialCases || []).filter((c) => c.active);
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

  return (
    <div className="view active">
      <div className="page-head">
        <div><h1>Patient Profile</h1><div className="sub">Full clinical ledger + printable forms</div></div>
        <div className="head-actions no-print">
          <button className="btn btn-outline btn-sm" onClick={() => notConnected('Medical Certificate (ISUE-UHS-MCR-007)', 'the print template isn\'t built yet')}>🖨 Medical Certificate</button>
          <button className="btn btn-outline btn-sm" onClick={() => notConnected('Parental Notification (ISUE-UHS-PaN-006)', 'the print template isn\'t built yet')}>🖨 Parental Notification</button>
          <button className="btn btn-ghost btn-sm" onClick={() => openModal('editPatient', { patientId, onSuccess: refresh })} disabled={!p}>✎ Edit Record</button>
          <button className="btn btn-ghost btn-sm" disabled={!p} onClick={() => openModal('softDelete', {
            what: 'patient record',
            onConfirm: () => deletePatient(patientId),
            onSuccess: () => navigate('visit-hub'),
          })}>🗑</button>
        </div>
      </div>

      {patient.error && <div className="login-error">Couldn't load this patient: {patient.error}</div>}

      <div className="card">
        <div className="profile-head">
          <div className="avatar-lg">{initialsOf(p?.fullName || selectedPatient.patientName || '')}</div>
          <div>
            <div className="profile-name">{p?.fullName || selectedPatient.patientName || 'Loading…'}</div>
            <div className="sub">{p ? patientMeta(p) || 'No details on file' : ''}</div>
            {p && (
              <div className="sub" style={{ marginTop: '4px' }}>
                {[p.sex, p.age != null && `${p.age} yrs old`, p.civilStatus, p.contactNumber].filter(Boolean).join(' · ')}
              </div>
            )}
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

      <div className="card table-card" style={{ padding: 0 }}>
        <h3 style={{ padding: '16px 20px 0' }}>Visit History {p ? `(${p.visitCount})` : ''}</h3>
        {history.error && <div className="login-error" style={{ margin: '0 20px' }}>{history.error}</div>}
        <table>
          <thead>
            <tr><th>Date</th><th>Complaint</th><th>Vitals</th><th>Management / Treatment</th><th>Disposition</th><th>Status</th></tr>
          </thead>
          <tbody>
            {history.loading ? (
              <tr><td colSpan={6} className="sub empty-cell">Loading…</td></tr>
            ) : visits.length === 0 ? (
              <tr><td colSpan={6} className="sub empty-cell">No visits on record.</td></tr>
            ) : (
              visits.map((v) => {
                const at = parseApiDate(v.startedAt);
                const status = VISIT_STATUS[v.status] || { label: v.status, pill: '' };
                return (
                  <tr key={v.visitId}>
                    <td>{formatDate(at)}<br /><span className="sub">{formatTime(at)}{v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}</span></td>
                    <td><div className="nm">{v.chiefComplaint}</div>{v.complaints?.length > 0 && <div className="sub">{v.complaints.join(', ')}</div>}</td>
                    <td className="sub">{vitalsSummary(v) || '—'}</td>
                    <td>{[v.management, v.treatmentNotes, dispensedSummary(v)].filter(Boolean).join(' → ') || '—'}</td>
                    <td>{v.dispositionName || '—'}</td>
                    <td><span className={`pill ${status.pill}`}>{status.label}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
