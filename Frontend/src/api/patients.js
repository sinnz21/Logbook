import { request } from './client';

// All of this targets endpoints that don't exist on the backend yet — see the
// "Patients" section of the backend requirements doc. app/schemas/patient.py
// already defines PatientCreate/PatientUpdate/PatientOut; only routes are missing.

export function searchPatients(search, { page = 1, perPage = 20 } = {}) {
  return request('/patients', { query: { search, page, per_page: perPage } });
}

export function getPatient(patientId) {
  return request(`/patients/${patientId}`);
}

export function createPatient(payload) {
  return request('/patients', { method: 'POST', body: payload });
}

export function updatePatient(patientId, payload) {
  return request(`/patients/${patientId}`, { method: 'PATCH', body: payload });
}

export function deletePatient(patientId) {
  return request(`/patients/${patientId}`, { method: 'DELETE' });
}

export function flagSpecialCase(patientId, payload) {
  return request(`/patients/${patientId}/special-cases`, { method: 'POST', body: payload });
}

export function retireSpecialCase(patientId, caseId) {
  return request(`/patients/${patientId}/special-cases/${caseId}`, {
    method: 'PATCH',
    body: { active: false },
  });
}

/** Every patient's currently-active priority/medical flags — backs the
 * "Priority & Special Cases" hub. */
export function listSpecialCases({ active = true } = {}) {
  return request('/patients/special-cases', { query: { active } });
}
