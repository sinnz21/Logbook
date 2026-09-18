import { useState } from 'react';
import Modal from '../Modal';
import PatientFields from '../forms/PatientFields';
import VisitFields from '../forms/VisitFields';
import PatientSearch from '../forms/PatientSearch';
import SpecialCaseFlags from '../forms/SpecialCaseFlags';
import DispenseFields from '../forms/DispenseFields';
import { EMPTY_PATIENT, patientFromApi, toPatientPayload, validatePatient } from '../forms/patientForm';
import {
  dispensePayload, EMPTY_VISIT, toVisitPayload, validateDispense, validateVisit,
} from '../forms/visitForm';
import { EMPTY_FLAGS, flagsToCreate } from '../forms/specialCaseForm';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { createPatient, flagSpecialCase } from '../../api/patients';
import { createVisit } from '../../api/visits';

// modal.data: { onSuccess? }
//
// One Save does up to three things, in order: register the patient (skipped
// when an existing roster record was picked), add any priority/special-case
// flags, then open the visit — which stamps Time of Arrival server-side.
export default function AddPatientModal() {
  const { closeModal, modal } = useApp();
  const { patientTypes, specialCaseTypes } = useLookups();
  const [patient, setPatient] = useState(() => ({ ...EMPTY_PATIENT, patientTypeId: patientTypes[0]?.patientTypeId ?? null }));
  const [existing, setExisting] = useState(null); // PatientOut picked from the roster (or created on a failed earlier attempt)
  const [visit, setVisit] = useState(EMPTY_VISIT);
  const [flags, setFlags] = useState(EMPTY_FLAGS);
  const [dispensed, setDispensed] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const pick = (p) => {
    setExisting(p);
    setPatient(patientFromApi(p));
  };

  const clearPick = () => {
    setExisting(null);
    setPatient({ ...EMPTY_PATIENT, patientTypeId: patientTypes[0]?.patientTypeId ?? null });
  };

  const handleSave = async () => {
    const invalid = (!existing && validatePatient(patient)) || validateVisit(visit) || validateDispense(dispensed);
    if (invalid) {
      setError(invalid);
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
      for (const flag of flagsToCreate(flags, record, specialCaseTypes)) {
        await flagSpecialCase(record.patientId, flag);
      }
      await createVisit({ patientId: record.patientId, ...toVisitPayload(visit), ...dispensePayload(dispensed) });
      modal.data?.onSuccess?.();
      closeModal();
    } catch (e) {
      setError(record && !existing ? `Patient saved, but the visit wasn't: ${e.message}` : e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title="Add Patient"
      subtitle="Stamps Time of Arrival the moment you save"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Patient Record'}
          </button>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}

      {existing ? (
        <div className="modal-note picked-banner">
          Using existing record: <strong>{existing.fullName}</strong>
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearPick} disabled={saving}>Change</button>
        </div>
      ) : (
        <PatientSearch onPick={pick} />
      )}

      <PatientFields value={patient} onChange={setPatient} readOnly={Boolean(existing)} />
      <SpecialCaseFlags value={flags} onChange={setFlags} existing={existing} />
      <VisitFields value={visit} onChange={setVisit} />
      <DispenseFields value={dispensed} onChange={setDispensed} />
    </Modal>
  );
}
