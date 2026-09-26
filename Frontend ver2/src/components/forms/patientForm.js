import { ageFrom } from '../../lib/format';

// Keys match the backend's PatientCreate schema (camelCase), so the form value
// can be sent almost as-is — see toPatientPayload().
export const EMPTY_PATIENT = {
  patientTypeId: null,
  firstName: '',
  middleName: '',
  lastName: '',
  sex: '',
  dateOfBirth: '',
  civilStatus: '',
  contactNumber: '',
  patientNumber: '',
  program: '',
  yearLevel: '',
  department: '',
};

export function patientFromApi(p) {
  const form = { ...EMPTY_PATIENT };
  for (const key of Object.keys(EMPTY_PATIENT)) form[key] = p[key] ?? (key === 'patientTypeId' ? null : '');
  return form;
}

/** Empty strings → null so optional columns stay NULL instead of ''. */
export function toPatientPayload(form) {
  const payload = {};
  for (const [key, value] of Object.entries(form)) {
    payload[key] = typeof value === 'string' ? value.trim() || null : value;
  }
  return payload;
}

export function validatePatient(form) {
  if (!form.patientTypeId) return 'Choose a patient type.';
  if (!form.firstName.trim() || !form.lastName.trim()) return 'First and last name are required.';
  if (form.dateOfBirth && ageFrom(form.dateOfBirth) == null) return 'Date of birth is invalid.';
  return null;
}
