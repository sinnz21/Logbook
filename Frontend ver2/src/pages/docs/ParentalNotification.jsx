import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { getPatient } from '../../api/patients';
import { listVisits } from '../../api/visits';
import { dispensedSummary } from '../../lib/format';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';
import DocShell, { Field } from './DocShell';

// The form's three tick boxes, matched against the visit's disposition.
const DISPOSITIONS = [
  { label: 'Sent home', match: /sent home/i },
  { label: 'Returned to school', match: /back to (class|work)|returned/i },
  { label: 'Referred for hospital admission', match: /hospital|referred/i },
];

/** ISUE-UHS-PaN-006 — sent home with a student after a clinic visit. */
export default function ParentalNotification() {
  const { selectedPatient, userName } = useApp();
  const patientId = selectedPatient?.patientId;

  const patient = useAsync(() => (patientId ? getPatient(patientId) : Promise.resolve(null)), [patientId]);
  const history = useAsync(
    () => (patientId ? listVisits({ patientId, perPage: 50 }) : Promise.resolve(null)),
    [patientId],
  );

  if (!patientId) {
    return <div className="view active"><div className="sub">No patient selected.</div></div>;
  }

  const p = patient.data;
  const visits = (history.data?.items || []).filter((v) => v.patientId === patientId);
  const visit = visits.find((v) => v.visitId === selectedPatient?.visitId) || visits[0];

  const startedAt = visit ? parseApiDate(visit.startedAt) : null;
  const endedAt = visit?.endedAt ? parseApiDate(visit.endedAt) : null;
  const seen = startedAt
    ? `${formatDate(startedAt)} · ${formatTime(startedAt)}${endedAt ? ` – ${formatTime(endedAt)}` : ''}`
    : '';

  const college = [p?.department, p?.program, p?.yearLevel].filter(Boolean).join(' — ');
  const disposition = visit?.dispositionName || '';

  return (
    <DocShell
      code="ISUE-UHS-PaN-006"
      title="PARENTAL NOTIFICATION"
      footer={`This copy is filed with the University Health Service.${
        visit ? ` Generated from record VST-${visit.visitId}` : ''
      } by the ISU Infirmary Log Book System.`}
    >
      {patient.error && <div className="login-error no-print">Couldn&rsquo;t load this patient: {patient.error}</div>}

      <p className="doc-p">Dear Parent or Guardian,</p>
      <p className="doc-p">
        Please be informed that your son or daughter was attended to at the University Health Service.
        The details of the visit are as follows:
      </p>

      <div className="doc-grid">
        <Field label="Name of Student" value={p?.fullName || selectedPatient.patientName} />
        <Field label="Age / Sex" value={[p?.age != null ? p.age : null, p?.sex].filter(Boolean).join(' / ')} />
        <Field label="College / Program" value={college} />
        <Field label="Student Number" value={p?.patientNumber} />
        <Field label="Date and Time Seen" value={seen} />
        <Field label="Attending Personnel" value={visit?.attendingName || userName} />
      </div>

      <Field label="Complaints" value={visit?.chiefComplaint} />
      <Field label="Management" value={visit?.management} />
      <Field label="Treatment Given" value={visit ? dispensedSummary(visit) || visit.treatmentNotes : ''} />

      <p className="doc-p" style={{ fontWeight: 700, marginTop: '24px' }}>
        Disposition — the student was:
      </p>
      <div className="doc-checks">
        {DISPOSITIONS.map((d) => (
          <div className="doc-check" key={d.label}>
            <span className={`doc-box${disposition && d.match.test(disposition) ? ' on' : ''}`} />
            <span>{d.label}</span>
          </div>
        ))}
      </div>

      <p className="doc-p">
        Should any symptom return or worsen at home, please seek medical attention promptly and inform
        the University Health Service so the record can be updated.
      </p>

      <div className="doc-signs">
        <div className="doc-sign">
          <div className="line">{(visit?.attendingName || userName || '').toUpperCase()}</div>
          <div className="cap">Nurse on Duty</div>
        </div>
        <div className="doc-sign">
          <div className="line">&nbsp;</div>
          <div className="cap">Received by — Parent or Guardian (signature over printed name)</div>
        </div>
      </div>
    </DocShell>
  );
}
