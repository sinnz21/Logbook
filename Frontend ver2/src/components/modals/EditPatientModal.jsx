import { useState } from 'react';
import Modal from '../Modal';
import PatientFields from '../forms/PatientFields';
import VisitFields from '../forms/VisitFields';
import { patientFromApi, toPatientPayload, validatePatient } from '../forms/patientForm';
import { toVisitPayload, validateVisit, visitFromApi } from '../forms/visitForm';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { useLookups } from '../../hooks/useLookups';
import { flagSpecialCase, getPatient, retireSpecialCase, updatePatient } from '../../api/patients';
import { updateVisit } from '../../api/visits';
import { SPECIAL_CASE_CLASS, specialCaseCategory, specialCaseLabel } from '../../lib/format';

// modal.data: { patientId, visit?: VisitOut, onSuccess? }
// Opened from a visit row it also edits that visit's vitals/complaint/notes;
// opened from a profile it edits the patient only.
export default function EditPatientModal() {
  const { closeModal, modal } = useApp();
  const { patientId, visit, onSuccess } = modal.data || {};
  const loaded = useAsync(() => getPatient(patientId), [patientId]);

  return (
    <Modal
      wide
      title="Edit Patient"
      subtitle="Update patient details, demographics, and clinical flags"
      onClose={closeModal}
    >
      {loaded.loading && <div className="sub">Loading patient record…</div>}
      {loaded.error && <div className="login-error">Couldn't load this patient: {loaded.error}</div>}
      {loaded.data && (
        <EditForm patient={loaded.data} visit={visit} onSaved={() => { onSuccess?.(); closeModal(); }} onCancel={closeModal} />
      )}
    </Modal>
  );
}

function EditForm({ patient, visit, onSaved, onCancel }) {
  const { complaints, specialCaseTypes } = useLookups();
  const [form, setForm] = useState(() => patientFromApi(patient));
  const [visitForm, setVisitForm] = useState(() => (visit ? visitFromApi(visit, complaints) : null));
  const [cases, setCases] = useState(() => (patient.specialCases || []).filter((c) => c.active));
  const [newFlag, setNewFlag] = useState({ typeId: specialCaseTypes[0]?.specialCaseTypeId ?? null, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const addFlag = async () => {
    setError(null);
    try {
      const created = await flagSpecialCase(patient.patientId, { specialCaseTypeId: newFlag.typeId, notes: newFlag.notes.trim() || null });
      setCases((c) => [...c, created]);
      setNewFlag((f) => ({ ...f, notes: '' }));
    } catch (e) {
      setError(e.message);
    }
  };

  const retire = async (c) => {
    setError(null);
    try {
      await retireSpecialCase(patient.patientId, c.patientSpecialCaseId);
      setCases((list) => list.filter((x) => x.patientSpecialCaseId !== c.patientSpecialCaseId));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSave = async () => {
    const invalid = validatePatient(form) || (visitForm && validateVisit(visitForm));
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updatePatient(patient.patientId, toPatientPayload(form));
      if (visitForm) await updateVisit(visit.visitId, toVisitPayload(visitForm));
      onSaved();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <>
      {error && <div className="login-error">{error}</div>}
      <PatientFields value={form} onChange={setForm} />

      <div className="flag-box">
        <label className="flag-box-title">Clinical Flags</label>
        <div className="badge-row">
          {cases.length === 0 && <span className="sub">No active flags.</span>}
          {cases.map((c) => (
            <span key={c.patientSpecialCaseId} className={SPECIAL_CASE_CLASS[specialCaseCategory(c.caseName)]}>
              {specialCaseLabel(c)}
              <button type="button" className="chip-x" title="Retire flag" onClick={() => retire(c)}>✕</button>
            </span>
          ))}
        </div>
        <div className="field-row" style={{ marginTop: '8px', marginBottom: 0, gridTemplateColumns: '1fr 1.4fr auto' }}>
          <select value={newFlag.typeId ?? ''} onChange={(e) => setNewFlag({ ...newFlag, typeId: Number(e.target.value) })}>
            {specialCaseTypes.map((t) => <option key={t.specialCaseTypeId} value={t.specialCaseTypeId}>{t.caseName}</option>)}
          </select>
          <input type="text" placeholder="Details (optional)" value={newFlag.notes} onChange={(e) => setNewFlag({ ...newFlag, notes: e.target.value })} />
          <button type="button" className="btn btn-outline btn-sm" onClick={addFlag}>＋ Flag</button>
        </div>
      </div>

      {visitForm && (
        <>
          <div className="section-label">This Visit</div>
          <VisitFields value={visitForm} onChange={setVisitForm} />
        </>
      )}

      <div className="modal-actions inline-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Patient Record'}</button>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </>
  );
}
