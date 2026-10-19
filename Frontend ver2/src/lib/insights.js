// Client-side stand-in for the aggregations the dashboards and Reports need.
//
// The real aggregation belongs on the backend (an insights.py endpoint
// grouping visit_complaints — see ISU_Infirmary_Database_Plan_v2 §8), but that
// route doesn't exist yet. These tally the visit rows the visits endpoint
// already returns for whatever range is loaded client-side.
import { parseApiDate } from './time';

/** Slice colours, in the order the v2 design uses them. */
export const CHART_COLORS = ['#107a6b', '#3ea892', '#8ecabb', '#d9a13b', '#9db4ae', '#6b9e93', '#2563eb', '#c0392b'];

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * name → count map into [{ name, count, value, pct, width, color }], sorted
 * high → low. `pct` is the share of the whole (one decimal); `width` is
 * relative to the largest row, for bar lengths. With `limit`, the rest is
 * folded into a trailing "Others" row when `others` is set.
 */
export function rowsFrom(counts, { limit = Infinity, others = false } = {}) {
  const sorted = [...counts.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, n]) => sum + n, 0);
  if (!total) return [];
  let entries = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce((sum, [, n]) => sum + n, 0);
  if (others && rest > 0) entries = [...entries, ['Others', rest]];
  const max = Math.max(...entries.map(([, n]) => n));
  return entries.map(([name, count], i) => ({
    name,
    count,
    value: count,
    pct: round1((count / total) * 100),
    width: Math.round((count / max) * 100),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Counts a field (or derived value) across a list of rows. */
export function tally(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = typeof key === 'function' ? key(row) : row[key];
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

/** Sum of all row counts — the "n" a chart's percentages are out of. */
export const totalOf = (rows) => rows.reduce((sum, r) => sum + r.count, 0);

/** Complaint tags across visits (a visit can carry several). */
export function complaintCounts(visits) {
  const counts = new Map();
  for (const visit of visits) {
    const tags = visit.complaints?.length ? visit.complaints : [visit.chiefComplaint];
    for (const tag of tags) {
      if (tag) counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return counts;
}

export function topComplaintsFrom(visits, { limit = 5, others = true } = {}) {
  return rowsFrom(complaintCounts(visits), { limit, others });
}

/** Units dispensed per medicine across visits. */
export function medicineCounts(visits) {
  const counts = new Map();
  for (const v of visits) {
    for (const m of v.medicines || []) {
      counts.set(m.medicineName, (counts.get(m.medicineName) || 0) + (Number(m.quantityGiven) || 0));
    }
  }
  return counts;
}

export function topMedicinesFrom(visits, { limit = 5 } = {}) {
  return rowsFrom(medicineCounts(visits), { limit });
}

const MONTH = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short' });
const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

/** [{ key: 'YYYY-MM', label: 'Sep', value }] for the last `months` months that have visits. */
export function visitsPerMonth(visits, months = 8) {
  const counts = new Map();
  for (const v of visits) {
    // Shift to clinic time before taking the month, so a 7 AM visit on the 1st
    // isn't counted in the previous month.
    const local = new Date(parseApiDate(v.startedAt).getTime() + 8 * 3600000);
    const key = monthKey(local);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-months)
    .map(([key, value]) => ({ key, label: MONTH.format(new Date(`${key}-15T00:00:00Z`)), value }));
}

/** Departments by visit count, with each one's most common complaint. */
export function departmentsFrom(visits) {
  const rows = rowsFrom(tally(visits, 'department'));
  return rows.map((r) => {
    const inDept = visits.filter((v) => v.department === r.name);
    const top = rowsFrom(tally(inDept, (v) => (v.complaints?.length ? v.complaints[0] : v.chiefComplaint)))[0];
    return { ...r, topComplaint: top?.name || '—' };
  });
}

/** Faculty and staff age bands — the design groups them for BP checks. */
export function ageBand(age) {
  if (age == null) return null;
  if (age < 30) return 'Under 30';
  if (age <= 44) return '30 to 44 years';
  if (age <= 60) return '45 to 60 years';
  return 'Over 60';
}

export const isStudent = (v) => v.patientTypeName === 'Student';

/** Every aggregate the dashboards and Reports show, computed once per visit list. */
export function summarize(visits) {
  const students = visits.filter(isStudent);
  const staff = visits.filter((v) => v.patientTypeName && !isStudent(v));
  return {
    total: visits.length,
    perMonth: visitsPerMonth(visits),
    complaints: rowsFrom(complaintCounts(visits)),
    medicines: rowsFrom(medicineCounts(visits)),
    clients: rowsFrom(tally(visits, 'patientTypeName')),
    departments: departmentsFrom(visits),
    dispositions: rowsFrom(tally(visits, 'dispositionName')),
    studentYears: rowsFrom(tally(students, 'yearLevel')),
    studentSex: rowsFrom(tally(students, 'sex')),
    staffAges: rowsFrom(tally(staff, (v) => ageBand(v.age))),
  };
}
