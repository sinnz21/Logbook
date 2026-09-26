// Seed data for demo mode (npm run demo). Mirrors the LogbookISU Figma's sample
// records so the screens look like the design, but every timestamp is generated
// relative to *today* — otherwise "Today's Visits" would always be empty.
//
// Shapes match the backend's *Out schemas: camelCase, and datetimes are naive
// ISO strings in UTC (the API client appends the Z — see lib/time.js).

const MANILA_OFFSET = '+08:00'; // the Philippines has no DST

/** A clinic-local day + time as the naive UTC ISO string the API would return. */
export function manilaIso(day, time = '00:00') {
  const at = new Date(`${day}T${time}:00${MANILA_OFFSET}`);
  return at.toISOString().slice(0, 19);
}

/** Clinic calendar day (YYYY-MM-DD) of an instant. */
export function clinicDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
}

export function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Deterministic PRNG, so the demo dataset is identical on every reload. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260915);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

const TODAY = clinicDay();

// ───────────────────────────── lookups ─────────────────────────────

export const patientTypes = [
  { patientTypeId: 1, typeName: 'Student' },
  { patientTypeId: 2, typeName: 'Faculty' },
  { patientTypeId: 3, typeName: 'Non-Teaching Staff (NASA)' },
  { patientTypeId: 4, typeName: 'Visitor' },
];

export const dispositions = [
  { dispositionId: 1, dispositionName: 'Sent Home' },
  { dispositionId: 2, dispositionName: 'Back to Class/Work' },
  { dispositionId: 3, dispositionName: 'Hospital Admission' },
  { dispositionId: 4, dispositionName: 'Referred to Doctor' },
  { dispositionId: 5, dispositionName: 'Observation' },
];

export const complaints = [
  'Tension Headache', 'Dysmenorrhea', 'Viral Flu', 'Fever', 'Cough / Colds',
  'Wound / Abrasion', 'Stomach Pain', 'Dizziness', 'Allergic Reaction',
  'Elevated Blood Pressure', 'Other',
].map((name, i) => ({ complaintId: i + 1, complaintName: name }));

export const specialCaseTypes = [
  'PWD', 'Senior Citizen', 'Allergy', 'Anxiety', 'Asthma', 'Hypertension', 'Other',
].map((name, i) => ({ specialCaseTypeId: i + 1, caseName: name }));

export const itemCategories = [
  ['Analgesic/Antipyretic', 'medicine'], ['Antibiotic', 'medicine'], ['Antihistamine', 'medicine'],
  ['Gastrointestinal', 'medicine'], ['Antiseptic', 'both'], ['Hydration', 'medicine'],
  ['Wound Care', 'supply'], ['PPE', 'supply'],
].map(([categoryName, appliesTo], i) => ({ categoryId: i + 1, categoryName, appliesTo }));

// ───────────────────────────── users ─────────────────────────────

export const users = [
  { userId: 1, username: 'acruz', firstName: 'Andrea', lastName: 'Cruz', fullName: 'Cruz, Andrea', email: 'acruz@isu.edu.ph', role: 'admin', status: 'active', createdAt: manilaIso(addDays(TODAY, -250), '09:00'), lastLoginAt: manilaIso(TODAY, '07:58') },
  { userId: 2, username: 'cgaffud', firstName: 'CJ', lastName: 'Gaffud', fullName: 'Gaffud, CJ N.', email: 'cgaffud@isu.edu.ph', role: 'admin', status: 'active', createdAt: manilaIso(addDays(TODAY, -250), '09:05'), lastLoginAt: manilaIso(addDays(TODAY, -1), '16:12') },
  { userId: 3, username: 'nsantos', firstName: 'Nina', lastName: 'Santos', fullName: 'Santos, Nina', email: 'nsantos@isu.edu.ph', role: 'nurse', status: 'active', createdAt: manilaIso(addDays(TODAY, -248), '10:30'), lastLoginAt: manilaIso(TODAY, '07:20') },
  { userId: 4, username: 'rlim', firstName: 'Rosa', lastName: 'Lim', fullName: 'Lim, Rosa', email: 'rlim@isu.edu.ph', role: 'nurse', status: 'active', createdAt: manilaIso(addDays(TODAY, -225), '09:40'), lastLoginAt: manilaIso(addDays(TODAY, -3), '14:05') },
  { userId: 5, username: 'pramos', firstName: 'Perla', lastName: 'Ramos', fullName: 'Ramos, Perla', email: 'pramos@isu.edu.ph', role: 'nurse', status: 'inactive', createdAt: manilaIso(addDays(TODAY, -180), '11:15'), lastLoginAt: manilaIso(addDays(TODAY, -75), '08:22') },
];

// ───────────────────────────── patients ─────────────────────────────

const P = (patientId, o) => ({
  patientId,
  middleName: '',
  civilStatus: 'Single',
  program: '',
  yearLevel: '',
  department: '',
  specialCases: [],
  ...o,
});

export const patients = [
  P(1, { patientNumber: '2023-04512', firstName: 'Maria', middleName: 'Reyes', lastName: 'Santos', fullName: 'Santos, Maria R.', sex: 'Female', age: 21, dateOfBirth: '2005-03-14', contactNumber: '0945 655 2130', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Computer Science', yearLevel: '3rd Year', department: 'CCSICT',
    specialCases: [
      { patientSpecialCaseId: 1, specialCaseTypeId: 3, caseName: 'Allergy', notes: 'Penicillin — rash and swelling', active: true, flaggedAt: manilaIso(addDays(TODAY, -32), '08:24'), flaggedByName: 'N. Santos' },
      { patientSpecialCaseId: 2, specialCaseTypeId: 4, caseName: 'Anxiety', notes: 'Panic episodes during exams', active: true, flaggedAt: manilaIso(addDays(TODAY, -32), '08:26'), flaggedByName: 'N. Santos' },
    ] }),
  P(2, { patientNumber: 'FAC-0031', firstName: 'Jon', lastName: 'Ramirez', fullName: 'Ramirez, Jon P.', sex: 'Male', age: 44, dateOfBirth: '1982-06-02', civilStatus: 'Married', contactNumber: '0917 220 4410', patientTypeId: 2, patientTypeName: 'Faculty', department: 'CCSICT' }),
  P(3, { patientNumber: '2024-01188', firstName: 'Bea', lastName: 'Cruz', fullName: 'Cruz, Bea L.', sex: 'Female', age: 18, dateOfBirth: '2008-01-19', contactNumber: '0920 118 8032', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Nursing', yearLevel: '1st Year', department: 'College of Nursing' }),
  P(4, { patientNumber: 'VIS-2026-0001', firstName: 'Erika', lastName: 'Tan', fullName: 'Tan, Erika V.', sex: 'Female', age: 39, civilStatus: 'Married', dateOfBirth: '1987-04-08', contactNumber: '0918 442 9901', patientTypeId: 4, patientTypeName: 'Visitor', department: 'Parent, campus event' }),
  P(5, { patientNumber: '2024-00455', firstName: 'Aira', lastName: 'Domingo', fullName: 'Domingo, Aira', sex: 'Female', age: 19, dateOfBirth: '2007-02-27', contactNumber: '0946 300 1188', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Nursing', yearLevel: '2nd Year', department: 'College of Nursing',
    specialCases: [{ patientSpecialCaseId: 3, specialCaseTypeId: 1, caseName: 'PWD', notes: 'Mobility — priority queue', active: true, flaggedAt: manilaIso(addDays(TODAY, -75), '10:15'), flaggedByName: 'N. Santos' }] }),
  P(6, { patientNumber: 'FAC-0029', firstName: 'Andrew', lastName: 'Ramos', fullName: 'Ramos, Andrew', sex: 'Male', age: 52, civilStatus: 'Married', dateOfBirth: '1974-09-11', contactNumber: '0917 889 2200', patientTypeId: 2, patientTypeName: 'Faculty', department: 'College of Engineering',
    specialCases: [{ patientSpecialCaseId: 4, specialCaseTypeId: 6, caseName: 'Hypertension', notes: 'Check BP every visit', active: true, flaggedAt: manilaIso(addDays(TODAY, -92), '14:40'), flaggedByName: 'N. Santos' }] }),
  P(7, { patientNumber: 'VIS-2026-0002', firstName: 'Alwyna', lastName: 'Reyes', fullName: 'Reyes, Alwyna', sex: 'Female', age: 67, civilStatus: 'Widowed', dateOfBirth: '1959-07-30', contactNumber: '0905 771 3322', patientTypeId: 4, patientTypeName: 'Visitor',
    specialCases: [{ patientSpecialCaseId: 5, specialCaseTypeId: 2, caseName: 'Senior Citizen', notes: 'Priority queue', active: true, flaggedAt: manilaIso(addDays(TODAY, -130), '13:12'), flaggedByName: 'R. Lim' }] }),
  P(8, { patientNumber: '2022-03110', firstName: 'Carlo', lastName: 'Bautista', fullName: 'Bautista, Carlo', sex: 'Male', age: 21, dateOfBirth: '2005-05-05', contactNumber: '0939 201 4417', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Criminology', yearLevel: '4th Year', department: 'College of Criminology' }),
  P(9, { patientNumber: 'NASA-0042', firstName: 'Mark', lastName: 'Villanueva', fullName: 'Villanueva, Mark', sex: 'Male', age: 35, civilStatus: 'Married', dateOfBirth: '1991-11-23', contactNumber: '0927 665 1180', patientTypeId: 3, patientTypeName: 'Non-Teaching Staff (NASA)', department: 'Admin Office' }),
  P(10, { patientNumber: '2023-02167', firstName: 'Maximo', lastName: 'Cruz', fullName: 'Cruz, Maximo', sex: 'Male', age: 20, dateOfBirth: '2006-08-17', contactNumber: '0916 554 7781', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Agriculture', yearLevel: '2nd Year', department: 'College of Agriculture',
    specialCases: [{ patientSpecialCaseId: 6, specialCaseTypeId: 4, caseName: 'Anxiety', notes: 'Panic episodes during exams', active: true, flaggedAt: manilaIso(addDays(TODAY, -21), '21:50'), flaggedByName: 'R. Lim' }] }),
  P(11, { patientNumber: '2022-03310', firstName: 'Paolo', lastName: 'Santos', fullName: 'Santos, Paolo M.', sex: 'Male', age: 22, dateOfBirth: '2004-02-09', contactNumber: '0933 887 2210', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Agriculture', yearLevel: '4th Year', department: 'College of Agriculture' }),
  P(12, { patientNumber: 'FAC-0018', firstName: 'Grace', lastName: 'Santiago', fullName: 'Santiago, Grace', sex: 'Female', age: 47, civilStatus: 'Married', dateOfBirth: '1979-12-01', contactNumber: '0918 223 6654', patientTypeId: 2, patientTypeName: 'Faculty', department: 'College of Education' }),
  P(13, { patientNumber: 'NASA-0051', firstName: 'Ruel', lastName: 'Sanchez', fullName: 'Sanchez, Ruel', sex: 'Male', age: 58, civilStatus: 'Married', dateOfBirth: '1968-03-22', contactNumber: '0921 004 5512', patientTypeId: 3, patientTypeName: 'Non-Teaching Staff (NASA)', department: 'Admin Office',
    specialCases: [{ patientSpecialCaseId: 7, specialCaseTypeId: 1, caseName: 'PWD', notes: 'Hearing impairment', active: true, flaggedAt: manilaIso(addDays(TODAY, -100), '09:30'), flaggedByName: 'N. Santos' }] }),
  P(14, { patientNumber: '2024-00201', firstName: 'Liza', lastName: 'Gomez', fullName: 'Gomez, Liza', sex: 'Female', age: 19, dateOfBirth: '2007-06-15', contactNumber: '0947 118 2203', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Education', yearLevel: '2nd Year', department: 'College of Education',
    specialCases: [{ patientSpecialCaseId: 8, specialCaseTypeId: 3, caseName: 'Allergy', notes: 'Dust allergy — ruled out', active: false, flaggedAt: manilaIso(addDays(TODAY, -200), '11:05'), flaggedByName: 'R. Lim' }] }),
  P(15, { patientNumber: '24-2133', firstName: 'CJ', middleName: 'Nacar', lastName: 'Gaffud', fullName: 'Gaffud, CJ N.', sex: 'Male', age: 21, dateOfBirth: '2005-01-30', contactNumber: '0917 445 8890', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Computer Science', yearLevel: '3rd Year', department: 'CCSICT' }),
  P(16, { patientNumber: '2023-01994', firstName: 'Joy', lastName: 'Agustin', fullName: 'Agustin, Joy', sex: 'Female', age: 20, dateOfBirth: '2006-04-12', contactNumber: '0935 221 7788', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Civil Engineering', yearLevel: '3rd Year', department: 'College of Engineering' }),
  P(17, { patientNumber: '2025-00712', firstName: 'Dan', lastName: 'Molina', fullName: 'Molina, Dan', sex: 'Male', age: 18, dateOfBirth: '2008-09-03', contactNumber: '0926 118 3341', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Information Technology', yearLevel: '1st Year', department: 'CCSICT' }),
  P(18, { patientNumber: '2022-02087', firstName: 'Kim', lastName: 'Pascual', fullName: 'Pascual, Kim', sex: 'Female', age: 22, dateOfBirth: '2004-07-21', contactNumber: '0918 990 2214', patientTypeId: 1, patientTypeName: 'Student', program: 'BS Criminology', yearLevel: '4th Year', department: 'College of Criminology' }),
];

// ───────────────────────────── stock ─────────────────────────────

const S = (itemType, itemId, name, categoryId, unit, quantity, reorderLevel, expiryDate, updatedByName) => ({
  itemType,
  itemId,
  name,
  categoryId,
  categoryName: itemCategories.find((c) => c.categoryId === categoryId)?.categoryName || null,
  unit,
  quantity: quantity.toFixed(2),
  reorderLevel: reorderLevel.toFixed(2),
  expiryDate,
  updatedByName,
});

// Expiries are relative to today so the "Expiring ≤ 60 days" tile stays
// meaningful whenever the demo is run (three items always fall inside it).
const expiringIn = (days) => addDays(TODAY, days);

export const stock = [
  S('medicine', 1, 'Paracetamol 500mg', 1, 'tablet', 240, 50, expiringIn(560), 'A. Cruz'),
  S('medicine', 2, 'Mefenamic Acid 500mg', 1, 'tablet', 85, 60, expiringIn(500), 'A. Cruz'),
  S('medicine', 3, 'Amoxicillin 500mg', 2, 'capsule', 34, 40, expiringIn(26), 'A. Cruz'),
  S('medicine', 4, 'Antacid (Kremil-S)', 4, 'tablet', 0, 30, expiringIn(42), 'N. Santos'),
  S('medicine', 5, 'Cetirizine 10mg', 3, 'tablet', 96, 40, expiringIn(650), 'A. Cruz'),
  S('medicine', 6, 'Betadine Solution', 5, 'bottle', 5, 5, expiringIn(530), 'N. Santos'),
  S('medicine', 7, 'Biogesic 500mg', 1, 'tablet', 150, 50, expiringIn(620), 'N. Santos'),
  S('medicine', 8, 'Buscopan', 4, 'tablet', 60, 30, expiringIn(590), 'A. Cruz'),
  S('medicine', 9, 'Loperamide 2mg', 4, 'capsule', 18, 20, expiringIn(52), 'A. Cruz'),
  S('medicine', 10, 'Oral Rehydration Salts', 6, 'sachet', 70, 20, expiringIn(700), 'N. Santos'),
  S('supply', 1, 'Sterile Gauze 4x4', 7, 'piece', 150, 100, null, 'N. Santos'),
  S('supply', 2, 'Elastic Bandage 3-inch', 7, 'roll', 20, 20, null, 'N. Santos'),
  S('supply', 3, 'Surgical Gloves (M)', 8, 'pair', 0, 20, expiringIn(860), 'A. Cruz'),
];

/** MySQL computes this as a generated column; demo mode derives it the same way. */
export function stockStatusOf(item) {
  const qty = Number(item.quantity);
  if (qty <= 0) return 'out_of_stock';
  return qty <= Number(item.reorderLevel) ? 'low' : 'high';
}

// ───────────────────────── restock requisitions ─────────────────────────

const reqItem = (itemType, id, itemName, unit, requested, approved, reason) => ({
  itemType,
  medicineId: itemType === 'medicine' ? id : null,
  supplyId: itemType === 'supply' ? id : null,
  itemId: id,
  itemName,
  unit,
  categoryName: stock.find((s) => s.itemType === itemType && s.itemId === id)?.categoryName || null,
  requestedQuantity: requested.toFixed(2),
  approvedQuantity: approved == null ? null : approved.toFixed(2),
  reason,
});

export const stockRequests = [
  {
    requestId: 42,
    requestNumber: 'REQ-0042',
    status: 'pending',
    requestedByName: 'N. Santos',
    requestDate: manilaIso(addDays(TODAY, -1), '15:40'),
    requestedAt: manilaIso(addDays(TODAY, -1), '15:40'),
    approvedByName: null,
    approvedAt: null,
    receivedByName: null,
    remarks: 'Out of stock since last week, used daily',
    items: [
      reqItem('medicine', 4, 'Antacid (Kremil-S)', 'Box', 100, null, 'Out of stock since Sep 12'),
      reqItem('supply', 3, 'Surgical Gloves (M)', 'Box', 50, null, 'Out of stock, used daily'),
    ],
  },
  {
    requestId: 41,
    requestNumber: 'REQ-0041',
    status: 'approved',
    requestedByName: 'N. Santos',
    requestDate: manilaIso(addDays(TODAY, -6), '10:12'),
    requestedAt: manilaIso(addDays(TODAY, -6), '10:12'),
    approvedByName: 'A. Cruz',
    approvedAt: manilaIso(addDays(TODAY, -5), '16:30'),
    receivedByName: null,
    remarks: 'Below reorder level',
    items: [reqItem('medicine', 3, 'Amoxicillin 500mg', 'Box', 60, 60, 'Low stock')],
  },
  {
    requestId: 40,
    requestNumber: 'REQ-0040',
    status: 'completed',
    requestedByName: 'R. Lim',
    requestDate: manilaIso(addDays(TODAY, -18), '09:05'),
    requestedAt: manilaIso(addDays(TODAY, -18), '09:05'),
    approvedByName: 'A. Cruz',
    approvedAt: manilaIso(addDays(TODAY, -17), '11:20'),
    receivedByName: 'N. Santos',
    remarks: null,
    items: [
      reqItem('medicine', 6, 'Betadine Solution', 'Box', 12, 12, 'Low stock'),
      reqItem('supply', 1, 'Sterile Gauze 4x4', 'Box', 200, 200, 'Routine restock'),
    ],
  },
  {
    requestId: 39,
    requestNumber: 'REQ-0039',
    status: 'denied',
    requestedByName: 'N. Santos',
    requestDate: manilaIso(addDays(TODAY, -32), '14:02'),
    requestedAt: manilaIso(addDays(TODAY, -32), '14:02'),
    approvedByName: 'A. Cruz',
    approvedAt: manilaIso(addDays(TODAY, -31), '08:45'),
    receivedByName: null,
    remarks: 'Sufficient stock on hand — re-raise next cycle',
    items: [reqItem('medicine', 1, 'Paracetamol 500mg', 'Box', 500, null, 'Bulk request')],
  },
];

// ───────────────────────────── visits ─────────────────────────────

// Encounter templates: complaint → what was typically given and how it ended.
const ENCOUNTERS = [
  { complaint: 'Tension Headache', chief: 'Tension headache, dizziness', management: 'Advised rest 30 mins, BP monitored', treatment: 'Rested in clinic, hydration advised', meds: [[7, 1, '500mg, 1 tab after meals']], supplies: [], disposition: 2 },
  { complaint: 'Dysmenorrhea', chief: 'Dysmenorrhea', management: 'Warm compress, rest', treatment: 'Rested 25 mins, pain eased', meds: [[2, 1, '500mg after meal']], supplies: [], disposition: 2 },
  { complaint: 'Viral Flu', chief: 'Viral flu, sore throat', management: 'Hydration advised, monitored 45 mins', treatment: 'Advised rest at home', meds: [[1, 2, '500mg every 6 hrs']], supplies: [], disposition: 1 },
  { complaint: 'Wound / Abrasion', chief: 'Minor scrape on knee', management: 'Cleaned + bandaged', treatment: 'Wound dressed, tetanus history checked', meds: [[6, 1, 'Topical']], supplies: [[1, 2]], disposition: 2 },
  { complaint: 'Stomach Pain', chief: 'Stomach pain after lunch', management: 'Observed 30 mins', treatment: 'Symptoms settled', meds: [[8, 1, '10mg as needed']], supplies: [], disposition: 2 },
  { complaint: 'Elevated Blood Pressure', chief: 'Elevated blood pressure', management: 'BP monitored, advised to rest', treatment: 'Referred for follow-up', meds: [], supplies: [], disposition: 4 },
  { complaint: 'Allergic Reaction', chief: 'Skin rash on forearm', management: 'Cleaned area, allergy noted', treatment: 'Antihistamine given', meds: [[5, 1, '10mg once daily']], supplies: [], disposition: 2 },
  { complaint: 'Cough / Colds', chief: 'Cough and colds, 2 days', management: 'Hydration and rest advised', treatment: 'Monitored 20 mins', meds: [[1, 2, '500mg every 6 hrs']], supplies: [], disposition: 2 },
  { complaint: 'Fever', chief: 'Fever since last night', management: 'Temperature monitored', treatment: 'Sent home to rest', meds: [[1, 2, '500mg every 6 hrs']], supplies: [], disposition: 1 },
  { complaint: 'Dizziness', chief: 'Dizziness, skipped breakfast', management: 'Rested, given fluids', treatment: 'Recovered after 20 mins', meds: [[10, 1, '1 sachet in water']], supplies: [], disposition: 2 },
];

const medName = (id) => stock.find((s) => s.itemType === 'medicine' && s.itemId === id)?.name;
const supName = (id) => stock.find((s) => s.itemType === 'supply' && s.itemId === id)?.name;
const NURSES = ['Santos, Nina', 'Lim, Rosa'];

function buildVisit(visitId, patient, day, timeIn, minutes, encounter, { open = false } = {}) {
  const startedAt = manilaIso(day, timeIn);
  const ended = open ? null : new Date(new Date(`${startedAt}Z`).getTime() + minutes * 60000);
  const complaintTags = [encounter.complaint];
  if (rand() < 0.25) complaintTags.push(pick(complaints).complaintName);

  return {
    visitId,
    patientId: patient.patientId,
    patientName: patient.fullName,
    patientNumber: patient.patientNumber,
    patientTypeName: patient.patientTypeName,
    sex: patient.sex,
    age: patient.age,
    yearLevel: patient.yearLevel || null,
    program: patient.program || null,
    department: patient.department || null,
    chiefComplaint: encounter.chief,
    complaints: [...new Set(complaintTags)],
    management: encounter.management,
    treatmentNotes: encounter.treatment,
    bloodPressure: `${between(100, 130)}/${between(65, 85)}`,
    temperature: (36 + rand()).toFixed(1),
    pulseRate: between(66, 96),
    startedAt,
    endedAt: ended ? ended.toISOString().slice(0, 19) : null,
    durationMinutes: open ? null : minutes,
    status: open ? 'in_care' : 'completed',
    dispositionId: open ? null : encounter.disposition,
    dispositionName: open ? null : dispositions.find((d) => d.dispositionId === encounter.disposition)?.dispositionName,
    attendingName: pick(NURSES),
    createdAt: startedAt,
    updatedAt: startedAt,
    medicines: encounter.meds.map(([id, qty, dosage]) => ({
      medicineId: id, medicineName: medName(id), quantityGiven: qty.toFixed(2), dosage,
    })),
    supplies: encounter.supplies.map(([id, qty]) => ({
      supplyId: id, supplyName: supName(id), quantityUsed: qty.toFixed(2),
    })),
    specialCases: patient.specialCases.filter((c) => c.active).map((c) => ({ caseName: c.caseName, notes: c.notes, active: true })),
  };
}

/** ~8 months of history, plus a hand-built queue for today that matches the Figma. */
function buildVisits() {
  const list = [];
  let id = 1000;

  for (let back = 240; back >= 1; back--) {
    const day = addDays(TODAY, -back);
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (dow === 0) continue; // clinic closed Sundays
    const count = dow === 6 ? between(0, 2) : between(1, 5);
    for (let n = 0; n < count; n++) {
      const patient = pick(patients);
      const encounter = pick(ENCOUNTERS);
      const hour = between(7, 15);
      const minute = between(0, 59);
      const timeIn = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      list.push(buildVisit(id++, patient, day, timeIn, between(15, 90), encounter));
    }
  }

  // Today's queue — the four rows from the Figma's dashboard and records panel.
  const byId = (n) => patients.find((p) => p.patientId === n);
  const enc = (name) => ENCOUNTERS.find((e) => e.complaint === name);
  list.push(buildVisit(id++, byId(4), TODAY, '07:20', 15, enc('Wound / Abrasion')));
  list.push(buildVisit(id++, byId(3), TODAY, '07:50', 25, enc('Dysmenorrhea')));
  list.push(buildVisit(id++, byId(2), TODAY, '08:05', 25, enc('Elevated Blood Pressure')));
  list.push(buildVisit(id, byId(1), TODAY, '08:42', 0, enc('Tension Headache'), { open: true }));

  return list.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export const visits = buildVisits();

export const settings = {
  softDeleteDays: 90,
  failedLoginLimit: 5,
  lockoutMinutes: 15,
  passwordSymbolRequired: true,
  autoBackupEnabled: true,
};

/** "Common Treatment Pairings" on the Insights screen. */
export const patterns = [
  { trigger: 'Dysmenorrhea', associatedWith: 'Mefenamic Acid 500mg', matchRate: 0.92, support: 48 },
  { trigger: 'Wound / Abrasion', associatedWith: 'Betadine and Sterile Gauze', matchRate: 0.88, support: 37 },
  { trigger: 'Tension Headache', associatedWith: 'Paracetamol 500mg', matchRate: 0.85, support: 76 },
  { trigger: 'Stomach Pain', associatedWith: 'an antacid', matchRate: 0.74, support: 29 },
  { trigger: 'Viral Flu', associatedWith: 'rest and hydration', matchRate: 0.61, support: 41 },
];

export { TODAY };
