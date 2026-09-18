import { specialCaseCategory } from '../../lib/format';

// The Figma's two checkboxes: "PWD / Senior Citizen" and "Special Cases".
export const EMPTY_FLAGS = {
  priority: false,
  priorityTypeId: null,
  special: false,
  specialTypeId: null,
  specialNotes: '',
};

export const isPriorityType = (t) => specialCaseCategory(t.caseName) !== 'medical';

/** The { specialCaseTypeId, notes } payloads to POST, skipping flags the patient already has active. */
export function flagsToCreate(flags, patient, specialCaseTypes) {
  const active = new Set((patient?.specialCases || []).filter((c) => c.active).map((c) => c.caseName));
  const nameOf = (id) => specialCaseTypes.find((t) => t.specialCaseTypeId === id)?.caseName;
  const out = [];
  if (flags.priority && flags.priorityTypeId && !active.has(nameOf(flags.priorityTypeId))) {
    out.push({ specialCaseTypeId: flags.priorityTypeId, notes: null });
  }
  if (flags.special && flags.specialTypeId && !active.has(nameOf(flags.specialTypeId))) {
    out.push({ specialCaseTypeId: flags.specialTypeId, notes: flags.specialNotes.trim() || null });
  }
  return out;
}
