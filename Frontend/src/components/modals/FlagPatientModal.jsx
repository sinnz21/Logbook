import { useState } from 'react';
import Modal from '../Modal';
import PatientSearch from '../forms/PatientSearch';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { flagSpecialCase } from '../../api/patients';
import { patientMeta } from '../../lib/format';

// modal.data: { onSuccess? }
export default function FlagPatientModal() {
  const { closeModal, modal } = useApp();
  const { specialCaseTypes } = useLookups();
  const [patient, setPatient] = useState(null);
  const [typeId, setTypeId] = useState(specialCaseTypes[0]?.specialCaseTypeId ?? null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!patient) {
      setError('Search for and select a patient first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await flagSpecialCase(patient.patientId, { specialCaseTypeId: typeId, notes: notes.trim() || null });
      modal.data?.onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Flag Patient"
      subtitle="Shows on this patient's record at every future visit"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Flag'}</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}
      {patient ? (
        <div className="modal-note picked-banner">
          <span><strong>{patient.fullName}</strong> <span className="sub">{patientMeta(patient)}</span></span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPatient(null)}>Change</button>
        </div>
      ) : (
        <PatientSearch onPick={setPatient} placeholder="Search patient by name or ID..." actionLabel="Select" />
      )}
      <div className="field-row">
        <div className="field">
          <label>Case Type</label>
          <select value={typeId ?? ''} onChange={(e) => setTypeId(Number(e.target.value))}>
            {specialCaseTypes.map((t) => <option key={t.specialCaseTypeId} value={t.specialCaseTypeId}>{t.caseName}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Details <span className="opt">(Optional)</span></label>
          <input type="text" placeholder="e.g. Penicillin, Visual" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
