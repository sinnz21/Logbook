import { useLookups } from '../../hooks/useLookups';
import { isPriorityType } from './specialCaseForm';

export default function SpecialCaseFlags({ value, onChange, existing }) {
  const { specialCaseTypes } = useLookups();
  const priorityTypes = specialCaseTypes.filter(isPriorityType);
  const medicalTypes = specialCaseTypes.filter((t) => !isPriorityType(t));
  const alreadyFlagged = (existing?.specialCases || []).filter((c) => c.active);

  const toggle = (key, typeKey, types) => (e) =>
    onChange({ ...value, [key]: e.target.checked, [typeKey]: value[typeKey] ?? types[0]?.specialCaseTypeId ?? null });

  return (
    <div className="flag-box">
      {alreadyFlagged.length > 0 && (
        <div className="sub" style={{ marginBottom: '8px' }}>
          On file: {alreadyFlagged.map((c) => c.caseName).join(', ')}
        </div>
      )}
      <div className="checkbox-row" style={{ flexDirection: 'column', gap: '8px' }}>
        <label>
          <input type="checkbox" checked={value.priority} onChange={toggle('priority', 'priorityTypeId', priorityTypes)} />
          <strong>PWD / Senior Citizen</strong> — flags this patient for priority handling
        </label>
        {value.priority && (
          <select
            value={value.priorityTypeId ?? ''}
            onChange={(e) => onChange({ ...value, priorityTypeId: Number(e.target.value) })}
            style={{ maxWidth: '220px', marginLeft: '22px' }}
          >
            {priorityTypes.map((t) => <option key={t.specialCaseTypeId} value={t.specialCaseTypeId}>{t.caseName}</option>)}
          </select>
        )}

        <label>
          <input type="checkbox" checked={value.special} onChange={toggle('special', 'specialTypeId', medicalTypes)} />
          <strong>Special Cases</strong> (Anxiety, asthma, penicillin allergies, etc...)
        </label>
        {value.special && (
          <div className="field-row" style={{ marginLeft: '22px', marginBottom: 0 }}>
            <select value={value.specialTypeId ?? ''} onChange={(e) => onChange({ ...value, specialTypeId: Number(e.target.value) })}>
              {medicalTypes.map((t) => <option key={t.specialCaseTypeId} value={t.specialCaseTypeId}>{t.caseName}</option>)}
            </select>
            <input type="text" placeholder="Details, e.g. Penicillin" value={value.specialNotes} onChange={(e) => onChange({ ...value, specialNotes: e.target.value })} />
          </div>
        )}
      </div>
    </div>
  );
}
