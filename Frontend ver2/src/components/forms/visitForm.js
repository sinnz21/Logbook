// Keys match the backend's VisitCreate schema (camelCase).
export const EMPTY_VISIT = {
  bloodPressure: '',
  temperature: '',
  pulseRate: '',
  chiefComplaint: '',
  management: '',
  treatmentNotes: '',
  complaintIds: [],
};

export function visitFromApi(v, complaints) {
  const byName = new Map(complaints.map((c) => [c.complaintName, c.complaintId]));
  return {
    bloodPressure: v.bloodPressure ?? '',
    temperature: v.temperature ?? '',
    pulseRate: v.pulseRate ?? '',
    chiefComplaint: v.chiefComplaint ?? '',
    management: v.management ?? '',
    treatmentNotes: v.treatmentNotes ?? '',
    complaintIds: (v.complaints || []).map((name) => byName.get(name)).filter(Boolean),
  };
}

export function validateVisit(form) {
  if (!form.chiefComplaint.trim()) return 'Complaints are required.';
  if (form.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure.trim())) return 'BP should look like 110/70.';
  if (form.temperature !== '') {
    const t = Number(form.temperature);
    if (!Number.isFinite(t) || t < 30 || t > 45) return 'Temperature should be in °C, e.g. 36.8.';
  }
  if (form.pulseRate !== '' && !/^\d{2,3}$/.test(String(form.pulseRate).trim())) return 'Pulse should be a whole number, e.g. 78.';
  return null;
}

/** DispenseFields rows → VisitCreate's medicines[] / supplies[]. */
export function dispensePayload(rows) {
  const medicines = [];
  const supplies = [];
  for (const row of rows) {
    const [itemType, id] = row.key.split(':');
    const quantity = String(row.quantity).trim();
    if (itemType === 'medicine') {
      medicines.push({ medicineId: Number(id), quantityGiven: quantity, dosage: row.dosage.trim() || null });
    } else {
      supplies.push({ supplyId: Number(id), quantityUsed: quantity });
    }
  }
  return { medicines, supplies };
}

export function validateDispense(rows) {
  for (const row of rows) {
    const q = Number(row.quantity);
    if (!Number.isFinite(q) || q <= 0) return 'Each medicine/supply given needs a quantity above 0.';
  }
  return null;
}

export function toVisitPayload(form) {
  const text = (s) => s.trim() || null;
  return {
    chiefComplaint: form.chiefComplaint.trim(),
    management: text(form.management),
    treatmentNotes: text(form.treatmentNotes),
    bloodPressure: text(form.bloodPressure),
    // Decimal on the backend — send as a string so it isn't float-rounded.
    temperature: form.temperature === '' ? null : String(form.temperature).trim(),
    pulseRate: form.pulseRate === '' ? null : Number(form.pulseRate),
    complaintIds: form.complaintIds,
    primaryComplaintId: form.complaintIds[0] ?? null,
  };
}
