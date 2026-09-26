import { useState } from 'react';
import { useApp } from '../context/useApp';
import { useLookups } from '../hooks/useLookups';
import PatientSearch from '../components/forms/PatientSearch';
import PatientFields from '../components/forms/PatientFields';
import DispenseFields from '../components/forms/DispenseFields';
import { EMPTY_PATIENT, patientFromApi, toPatientPayload, validatePatient } from '../components/forms/patientForm';
import {
  dispensePayload, EMPTY_VISIT, toVisitPayload, validateDispense, validateVisit,
} from '../components/forms/visitForm';
import { EMPTY_FLAGS, flagsToCreate, isPriorityType } from '../components/forms/specialCaseForm';
import { createPatient, flagSpecialCase } from '../api/patients';
import { createVisit, signOutVisit } from '../api/visits';
import { formatDate, formatTime } from '../lib/time';
import { specialCaseCategory } from '../lib/format';

/** Colour tone for a flag chip, matching the Figma's blue / amber / red groups. */
function flagTone(caseName) {
  const category = specialCaseCategory(caseName);
  if (category !== 'medical') return 'tone-priority';
  return /allerg/i.test(caseName) ? 'tone-allergy' : 'tone-medical';
}

function Step({ n, title, hint, children }) {
  return (
    <div className="card">
      <div className="step-head">
        <div className="step-label">Step {n} · {title}</div>
        {hint && <div className="step-hint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function AddVisitRecord() {
  const { navigate } = useApp();
  const { patientTypes, specialCaseTypes, dispositions } = useLookups();

  const [patient, setPatient] = useState(() => ({ ...EMPTY_PATIENT, patientTypeId: patientTypes[0]?.patientTypeId ?? null }));
  const [existing, setExisting] = useState(null); // PatientOut picked from the roster
  const [visit, setVisit] = useState(EMPTY_VISIT);
  const [caseIds, setCaseIds] = useState([]); // specialCaseTypeId[] ticked in step 3
  const [caseNotes, setCaseNotes] = useState('');
  const [dispensed, setDispensed] = useState([]);
  const [signOut, setSignOut] = useState({ dispositionId: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [now] = useState(() => new Date());

  const alreadyFlagged = (existing?.specialCases || []).filter((c) => c.active);
  const setVisitField = (key) => (e) => setVisit({ ...visit, [key]: e.target.value });

  const pick = (p) => {
    setExisting(p);
    setPatient(patientFromApi(p));
  };

  const clearPick = () => {
    setExisting(null);
    setPatient({ ...EMPTY_PATIENT, patientTypeId: patientTypes[0]?.patientTypeId ?? null });
  };

  const toggleCase = (id) =>
    setCaseIds((ids) => (ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id]));

  const reset = () => {
    clearPick();
    setVisit(EMPTY_VISIT);
    setCaseIds([]);
    setCaseNotes('');
    setDispensed([]);
    setSignOut({ dispositionId: '', notes: '' });
  };

  // One Save does up to four things, in order: register the patient (skipped when
  // an existing roster record was picked), add any new flags, open the visit —
  // which stamps Time In server-side — and, if a disposition was chosen in step 5,
  // sign it straight back out.
  const handleSave = async () => {
    const invalid = (!existing && validatePatient(patient)) || validateVisit(visit) || validateDispense(dispensed);
    if (invalid) {
      setError(invalid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);
    let record = existing;
    try {
      if (!record) {
        record = await createPatient(toPatientPayload(patient));
        // Remember it so a retry after a later failure doesn't register them twice.
        setExisting(record);
      }

      // Skip anything the patient is already actively flagged for.
      const onFile = new Set(alreadyFlagged.map((c) => c.caseName));
      for (const id of caseIds) {
        const type = specialCaseTypes.find((t) => t.specialCaseTypeId === id);
        if (!type || onFile.has(type.caseName)) continue;
        await flagSpecialCase(record.patientId, {
          specialCaseTypeId: id,
          notes: isPriorityType(type) ? null : caseNotes.trim() || null,
        });
      }

      const created = await createVisit({
        patientId: record.patientId,
        ...toVisitPayload(visit),
        ...dispensePayload(dispensed),
      });

      if (signOut.dispositionId) {
        await signOutVisit(created.visitId, {
          dispositionId: Number(signOut.dispositionId),
          treatmentNotes: signOut.notes.trim() || undefined,
        });
      }

      reset();
      navigate('patient-records');
    } catch (e) {
      setError(record && !existing ? `Patient saved, but the visit wasn't: ${e.message}` : e.message);
      setSaving(false);
    }
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Add Visit Record</h1>
          <div className="sub">Records one clinic encounter from arrival to sign-out</div>
        </div>
      </div>

      {error && <div className="login-error">{error}</div>}

      <Step n={1} title="Smart Patient Lookup" hint="Faculty, staff and returning students are pre-recorded — search before registering">
        {existing ? (
          <div className="modal-note picked-banner">
            Using existing record: <strong>{existing.fullName}</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearPick} disabled={saving}>Change</button>
          </div>
        ) : (
          <>
            <PatientSearch onPick={pick} placeholder="Search by ID number or full name…" />
            <div className="sub">
              Not found? Fill in Step 2 to register on the spot — visitors without an ID get a generated visitor number.
            </div>
          </>
        )}
      </Step>

      <Step n={2} title="Patient Details" hint="Auto-filled from the roster · fields change with patient type">
        <PatientFields value={patient} onChange={setPatient} readOnly={Boolean(existing)} />
      </Step>

      <Step n={3} title="Triage & Special Case Flagging" hint="Flags save against the patient and reappear on every future visit">
        <div className="field-row three">
          <div className="field">
            <label>Time In</label>
            <input type="text" value={formatTime(now)} readOnly title="Stamped by the server when you save" />
          </div>
          <div className="field">
            <label>Blood Pressure</label>
            <input type="text" placeholder="110/70 mmHg" value={visit.bloodPressure} onChange={setVisitField('bloodPressure')} />
          </div>
          <div className="field">
            <label>Temperature (°C)</label>
            <input type="text" inputMode="decimal" placeholder="36.8" value={visit.temperature} onChange={setVisitField('temperature')} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Pulse Rate (bpm)</label>
            <input type="text" inputMode="numeric" placeholder="78" value={visit.pulseRate} onChange={setVisitField('pulseRate')} />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="text" value={formatDate(now)} readOnly />
          </div>
        </div>
        <div className="field full" style={{ marginBottom: '14px' }}>
          <label>Chief Complaint</label>
          <textarea
            placeholder="e.g. Tension headache with dizziness since this morning"
            value={visit.chiefComplaint}
            onChange={setVisitField('chiefComplaint')}
          />
        </div>

        <div className="field full">
          <label>Special Case Flags</label>
          <div className="flag-pick">
            {specialCaseTypes.map((t) => (
              <label className={`flag-chip ${flagTone(t.caseName)}`} key={t.specialCaseTypeId}>
                <input
                  type="checkbox"
                  checked={caseIds.includes(t.specialCaseTypeId)}
                  onChange={() => toggleCase(t.specialCaseTypeId)}
                />
                {t.caseName}
              </label>
            ))}
          </div>
          {caseIds.some((id) => !isPriorityType(specialCaseTypes.find((t) => t.specialCaseTypeId === id) || {})) && (
            <input
              type="text"
              placeholder="Flag details, e.g. Penicillin"
              value={caseNotes}
              onChange={(e) => setCaseNotes(e.target.value)}
              style={{ marginTop: '10px' }}
            />
          )}
        </div>

        {alreadyFlagged.length > 0 && (
          <div className="danger-note" style={{ marginTop: '14px' }}>
            ⚑ Already flagged — {alreadyFlagged.map((c) => (c.notes ? `${c.caseName}: ${c.notes}` : c.caseName)).join(' · ')}
          </div>
        )}
      </Step>

      <Step n={4} title="Treatment Delivery" hint="Medicines dispensed and supplies consumed are deducted together on save">
        <DispenseFields value={dispensed} onChange={setDispensed} />
        <div className="field full" style={{ marginBottom: '14px' }}>
          <label>Management</label>
          <textarea placeholder="e.g. Advised rest 30 mins, BP monitored" value={visit.management} onChange={setVisitField('management')} />
        </div>
        <div className="info-note">
          On save, medicine and supply stock are both deducted and the movements are written to the audit ledger.
        </div>
      </Step>

      <Step n={5} title="Disposition & Sign Out" hint="Leave the disposition blank to keep the patient in today's queue — time out is captured when you sign them out">
        <div className="field-row">
          <div className="field">
            <label>Disposition <span className="opt">(optional)</span></label>
            <select value={signOut.dispositionId} onChange={(e) => setSignOut({ ...signOut, dispositionId: e.target.value })}>
              <option value="">Keep in queue — sign out later</option>
              {dispositions.map((d) => (
                <option key={d.dispositionId} value={d.dispositionId}>{d.dispositionName}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Treatment Notes</label>
            <input
              type="text"
              placeholder="e.g. Advised rest 30 mins, BP monitored"
              value={visit.treatmentNotes}
              onChange={setVisitField('treatmentNotes')}
            />
          </div>
        </div>
        {signOut.dispositionId && (
          <div className="field full">
            <label>Sign-out Notes <span className="opt">(optional)</span></label>
            <textarea
              placeholder="Anything to add before closing this visit…"
              value={signOut.notes}
              onChange={(e) => setSignOut({ ...signOut, notes: e.target.value })}
            />
          </div>
        )}
      </Step>

      <div className="head-actions no-print" style={{ justifyContent: 'flex-end', display: 'flex' }}>
        <button className="btn btn-ghost" onClick={() => navigate('patient-records')} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save visit record'}
        </button>
      </div>
    </div>
  );
}
