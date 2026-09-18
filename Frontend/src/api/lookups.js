import { request } from './client';

// Mirrors the seed rows in ISU_Infirmary_Database_Plan_v2 / isu_infirmary_schema.sql.
// Used until GET /api/lookups exists on the backend (see the backend requirements
// doc) — once it does, loadLookups() below picks up the real ids/rows automatically
// and this fallback is never touched again.
const FALLBACK_LOOKUPS = {
  patientTypes: [
    { patientTypeId: 1, typeName: 'Student' },
    { patientTypeId: 2, typeName: 'Faculty' },
    { patientTypeId: 3, typeName: 'Non-Teaching Staff (NASA)' },
  ],
  dispositions: [
    { dispositionId: 1, dispositionName: 'Sent Home' },
    { dispositionId: 2, dispositionName: 'Back to Class/Work' },
    { dispositionId: 3, dispositionName: 'Hospital Admission' },
    { dispositionId: 4, dispositionName: 'Referred to Doctor' },
    { dispositionId: 5, dispositionName: 'Observation' },
  ],
  complaints: [
    'Tension Headache', 'Dysmenorrhea', 'Viral Flu', 'Fever', 'Cough / Colds',
    'Wound / Abrasion', 'Stomach Pain', 'Dizziness', 'Allergic Reaction',
    'Elevated Blood Pressure', 'Other',
  ].map((name, i) => ({ complaintId: i + 1, complaintName: name })),
  specialCaseTypes: [
    'PWD', 'Senior Citizen', 'Allergy', 'Anxiety', 'Asthma', 'Hypertension', 'Other',
  ].map((name, i) => ({ specialCaseTypeId: i + 1, caseName: name })),
  itemCategories: [
    ['Analgesic/Antipyretic', 'medicine'], ['Antibiotic', 'medicine'], ['Antihistamine', 'medicine'],
    ['Gastrointestinal', 'medicine'], ['Antiseptic', 'both'], ['Hydration', 'medicine'],
    ['Wound Care', 'supply'], ['PPE', 'supply'],
  ].map(([name, appliesTo], i) => ({ categoryId: i + 1, categoryName: name, appliesTo })),
};

// Dispositions that count toward the dashboard's "Referred" KPI.
export const REFERRAL_DISPOSITIONS = new Set(['Hospital Admission', 'Referred to Doctor']);

let cache = null;

/**
 * Fetches GET /api/lookups once per page load and caches it in memory.
 * Falls back to seed-accurate constants if the endpoint 404s or the request
 * fails for any other reason, so the app keeps working before the backend
 * team ships it and upgrades automatically the moment they do.
 */
export async function loadLookups() {
  if (cache) return cache;
  try {
    cache = await request('/lookups');
  } catch {
    cache = FALLBACK_LOOKUPS;
  }
  return cache;
}

/** Synchronous best-effort read for code that needs a value before the first
 * fetch resolves (e.g. a form's default selection). */
export function lookupsSnapshot() {
  return cache || FALLBACK_LOOKUPS;
}
