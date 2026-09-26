import { useState } from 'react';
import Modal from '../Modal';
import PatientSearch from '../forms/PatientSearch';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { flagSpecialCase } from '../../api/patients';
import { patientMeta } from '../../lib/format';

// modal.data: { onSuccess?, patientId?, patientName?, flag? }
//
// With `flag` the modal opens on an existing row from Priority & Special Cases —
// prefilled, and saving re-posts it (which reactivates a retired flag and
// updates its notes). Without one it's a fresh flag and starts on the search box.
export default function FlagPatientModal() {
  const { closeModal, modal } = useApp();
  const { specialCaseTypes } = useLookups();
  const { flag, patientId, patientName, onSuccess } = modal.data || {};

  const [patient, setPatient] = useState(() =>
    (patientId ? { patientId, fullName: patientName || '' } : null));
  const [typeId, setTypeId] = useState(() => {
    if (!flag) return specialCaseTypes[0]?.specialCaseTypeId ?? null;
    return specialCaseTypes.find((t) => t.caseName === flag.caseName)?.specialCaseTypeId
      ?? specialCaseTypes[0]?.specialCaseTypeId ?? null;
  });
  const [notes, setNotes] = useState(flag?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const restoring = Boolean(flag && !flag.active);

  const handleSave = async () => {
    if (!patient) {
      setError('Search for and select a patient first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await flagSpecialCase(patient.patientId, { specialCaseTypeId: typeId, notes: notes.trim() || null });
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const title = restoring ? 'Restore Flag' : flag ? 'Edit Flag' : 'Flag a Patient';

  return (
    <Modal
      title={title}
      subtitle="Stored against the patient, so it shows on every future visit"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : restoring ? 'Restore Flag' : 'Save Flag'}
          </button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}

      {patient ? (
        <div className="modal-note picked-banner">
          <span>
            <strong>{patient.fullName || 'Selected patient'}</strong>{' '}
            <span className="sub">{patientMeta(patient)}</span>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPatient(null)} disabled={saving}>
            Change
          </button>
        </div>
      ) : (
        <PatientSearch onPick={setPatient} placeholder="Search patient by name or ID..." actionLabel="Select" />
      )}

      <div className="field-row">
        <div className="field">
          <label>Case Type</label>
          <select value={typeId ?? ''} onChange={(e) => setTypeId(Number(e.target.value))}>
            {specialCaseTypes.map((t) => (
              <option key={t.specialCaseTypeId} value={t.specialCaseTypeId}>{t.caseName}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Details <span className="opt">(Optional)</span></label>
          <input type="text" placeholder="e.g. Penicillin, Visual" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {restoring && (
        <div className="warn-note" style={{ marginTop: '12px' }}>
          This flag is currently retired. Saving makes it active again and it will reappear on future visits.
        </div>
      )}
    </Modal>
  );
}
