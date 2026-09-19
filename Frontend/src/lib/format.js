// Display helpers shared across screens.

// The sidebar lowercases these and the User Management pill uppercases them,
// both in CSS — so one spelling serves the Figma's "nurse / staff" and "NURSE / STAFF".
export const ROLE_LABELS = { nurse: 'Nurse / Staff', admin: 'Admin' };

/** "Santos, Maria R." → "MS", "Nurse Santos" → "NS". */
export function initialsOf(fullName = '') {
  const [last, first] = fullName.split(',').map((s) => s.trim());
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// visits.status — where the visit is in the workflow (not how it ended; that's the disposition).
export const VISIT_STATUS = {
  waiting: { label: 'Waiting', pill: 'pending' },
  in_care: { label: 'In Care', pill: 'pending' },
  completed: { label: 'Completed', pill: 'active' },
  cancelled: { label: 'Cancelled', pill: 'inactive' },
};

export const isOpenVisit = (v) => v.status === 'waiting' || v.status === 'in_care';

/** "BP 110/70 · 36.8°C · 78 bpm", skipping whatever wasn't recorded. */
export function vitalsSummary(v) {
  const parts = [];
  if (v.bloodPressure) parts.push(`BP ${v.bloodPressure}`);
  if (v.temperature != null) parts.push(`${v.temperature}°C`);
  if (v.pulseRate != null) parts.push(`${v.pulseRate} bpm`);
  return parts.join(' · ');
}

/**
 * "Student · BS Computer Science · 3rd Year · 2023-04512" — the Figma's
 * patient meta line. Works on a PatientOut or on a VisitOut (which carries the
 * same demographic fields once the backend adds them — see requirements doc).
 */
export function patientMeta(p) {
  return [p.patientTypeName, p.program, p.yearLevel, p.patientNumber, p.department]
    .filter(Boolean)
    .join(' · ');
}

/** "Paracetamol 500mg × 2 (500mg), Sterile Gauze Pads × 1" — what a visit actually used. */
export function dispensedSummary(v) {
  const meds = (v.medicines || []).map((m) => `${m.medicineName} × ${formatQty(m.quantityGiven)}${m.dosage ? ` (${m.dosage})` : ''}`);
  const sups = (v.supplies || []).map((s) => `${s.supplyName} × ${formatQty(s.quantityUsed)}`);
  return [...meds, ...sups].join(', ');
}

/** Decimal quantities arrive as strings ("240.00") — show "240" / "2.5". */
export function formatQty(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : String(value);
}

// stock_status (a MySQL generated column) → the Figma's pill classes.
export const STOCK_STATUS = {
  high: { label: 'High Stock', pill: 'high-stock' },
  low: { label: 'Low Stock', pill: 'low-stock' },
  out_of_stock: { label: 'Out of Stock', pill: 'out-stock' },
};

/** Priority flags (PWD / Senior) get their own badge; everything else is a medical flag. */
export function specialCaseCategory(caseName = '') {
  const name = caseName.toLowerCase();
  if (name === 'pwd') return 'pwd';
  if (name.startsWith('senior')) return 'senior';
  return 'medical';
}

/** Renders like the Figma: "★ PWD", "★ Senior Citizen", "Allergy: Penicillin". */
export function specialCaseLabel({ caseName, notes }) {
  const category = specialCaseCategory(caseName);
  if (category === 'pwd' || category === 'senior') {
    return `★ ${caseName}${notes ? ` (${notes})` : ''}`;
  }
  return notes ? `${caseName}: ${notes}` : caseName;
}

export const SPECIAL_CASE_CLASS = {
  pwd: 'pill pwd-badge',
  senior: 'pill senior-badge',
  medical: 'flag-tag-red',
};

/** "15" → "15th", "22" → "22nd" — for the certificate's "Issued this __ day of __". */
export function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${{ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;
}

/** Whole-years age from a YYYY-MM-DD date of birth, or null. */
export function ageFrom(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
}
