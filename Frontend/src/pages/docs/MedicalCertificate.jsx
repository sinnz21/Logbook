import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { getPatient } from '../../api/patients';
import { listVisits } from '../../api/visits';
import { ordinal } from '../../lib/format';
import { formatDate, parseApiDate } from '../../lib/time';
import DocShell, { Field } from './DocShell';

const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' });

/** ISUE-UHS-MCR-007 — issued from one visit's recorded findings. */
export default function MedicalCertificate() {
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
  // The visit the nurse drilled in from, else the most recent one on file.
  const visit = visits.find((v) => v.visitId === selectedPatient?.visitId) || visits[0];
  const examinedAt = visit ? parseApiDate(visit.startedAt) : new Date();

  const vitals = visit
    ? [
      visit.bloodPressure && `blood pressure ${visit.bloodPressure} mmHg`,
      visit.temperature != null && `temperature ${visit.temperature} °C`,
      visit.pulseRate != null && `pulse rate ${visit.pulseRate} bpm`,
    ].filter(Boolean)
    : [];

  const college = [p?.department, p?.program, p?.yearLevel].filter(Boolean).join(' — ');
  const findings = visit?.treatmentNotes || visit?.management || visit?.chiefComplaint
    || 'Physically Fit @ Time of Examination';

  return (
    <DocShell
      code="ISUE-UHS-MCR-007"
      title="MEDICAL CERTIFICATE"
      footer={`Not for medico-legal purposes. Any alteration or erasure invalidates this certificate.${
        visit ? ` Generated from record VST-${visit.visitId}` : ''
      } by the ISU Infirmary Log Book System.`}
    >
      {patient.error && <div className="login-error no-print">Couldn&rsquo;t load this patient: {patient.error}</div>}

      <p className="doc-p">TO WHOM IT MAY CONCERN:</p>

      <div className="doc-grid">
        <Field label="Name" value={p?.fullName || selectedPatient.patientName} />
        <Field label="Age / Sex" value={[p?.age != null ? p.age : null, p?.sex].filter(Boolean).join(' / ')} />
        <Field label="Civil Status" value={p?.civilStatus} />
        <Field label="Student / Employee Number" value={p?.patientNumber} />
        <Field label="College / Department" value={college} />
        <Field label="Date of Examination" value={formatDate(examinedAt)} />
      </div>

      <p className="doc-p">
        This is to certify that the above-named person was examined at the University Health Service
        on the date indicated, and the following findings were recorded:
      </p>

      <Field label="Diagnosis / Findings" value={findings} />

      {vitals.length > 0 && (
        <p className="doc-p">Vital signs at the time of examination: {vitals.join(', ')}.</p>
      )}

      <p className="doc-p">
        This certification is issued upon the request of the above-named person for
        <span className="doc-inline">whatever legal purpose it may serve</span>.
      </p>

      <p className="doc-p">
        Issued this <span className="doc-inline">{ordinal(Number(
          new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', day: 'numeric' }).format(new Date()),
        ))}</span> day of <span className="doc-inline">{MONTH_YEAR.format(new Date())}</span> at Echague, Isabela.
      </p>

      <div className="doc-signs">
        <div className="doc-sign">
          <div className="line">{(visit?.attendingName || userName || '').toUpperCase()}</div>
          <div className="cap">Nurse on Duty</div>
        </div>
        <div className="doc-sign">
          <div className="line">&nbsp;</div>
          <div className="cap">Reviewed by — University Health Service Admin</div>
        </div>
      </div>
    </DocShell>
  );
}
