import { useLookups } from '../../hooks/useLookups';
import { ageFrom } from '../../lib/format';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

/** "Non-Teaching Staff (NASA)" → "NASA", "Student" → "STUDENT" (the Figma's segment labels). */
const segmentLabel = (typeName) => (typeName.match(/\(([^)]+)\)/)?.[1] || typeName).toUpperCase();

const ID_LABELS = { Student: 'Student Number', Faculty: 'Faculty Number' };

export default function PatientFields({ value, onChange, readOnly = false }) {
  const { patientTypes } = useLookups();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const typeName = patientTypes.find((t) => t.patientTypeId === value.patientTypeId)?.typeName;
  const isStudent = typeName === 'Student';
  const age = ageFrom(value.dateOfBirth);

  // Program / year level only mean something for students; clear them when
  // switching away so a faculty record doesn't keep a stale "BSCS · 3rd Year".
  const pickType = (t) => {
    if (readOnly) return;
    const student = t.typeName === 'Student';
    onChange({ ...value, patientTypeId: t.patientTypeId, ...(student ? {} : { program: '', yearLevel: '' }) });
  };

  return (
    <>
      <div className="field full">
        <label>Visitor Type</label>
        <div className="segmented">
          {patientTypes.map((t) => (
            <button
              type="button"
              key={t.patientTypeId}
              className={value.patientTypeId === t.patientTypeId ? 'active' : ''}
              onClick={() => pickType(t)}
              disabled={readOnly}
            >
              {segmentLabel(t.typeName)}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field"><label>First Name</label><input type="text" placeholder="e.g. JAZIEL" value={value.firstName} onChange={set('firstName')} readOnly={readOnly} /></div>
        <div className="field"><label>Last Name</label><input type="text" placeholder="e.g. NICOLAS" value={value.lastName} onChange={set('lastName')} readOnly={readOnly} /></div>
      </div>
      <div className="field-row three">
        <div className="field"><label>Middle Name <span className="opt">(Optional)</span></label><input type="text" placeholder="e.g. PAYUMO" value={value.middleName} onChange={set('middleName')} readOnly={readOnly} /></div>
        <div className="field">
          <label>Sex</label>
          <select value={value.sex} onChange={set('sex')} disabled={readOnly}>
            <option value="">—</option><option value="Male">MALE</option><option value="Female">FEMALE</option>
          </select>
        </div>
        <div className="field">
          {/* The Figma asks for Age, but the backend stores date_of_birth and
              derives age (a stored age is wrong within a year). */}
          <label>Date of Birth {age != null && <span className="opt">({age} yrs old)</span>}</label>
          <input type="date" value={value.dateOfBirth} onChange={set('dateOfBirth')} readOnly={readOnly} />
        </div>
      </div>

      <div className="type-box">
        <div className="type-box-title">Fields shown depend on Visitor Type — {typeName ? segmentLabel(typeName) === 'NASA' ? 'NASA' : typeName : '…'}</div>
        <div className="field-row three">
          <div className="field">
            <label>{ID_LABELS[typeName] || 'Employee ID'}</label>
            <input type="text" placeholder="e.g. 24-2133" value={value.patientNumber} onChange={set('patientNumber')} readOnly={readOnly} />
          </div>
          {isStudent ? (
            <div className="field"><label>Program</label><input type="text" placeholder="e.g. BS COMPUTER SCIENCE" value={value.program} onChange={set('program')} readOnly={readOnly} /></div>
          ) : (
            <div className="field"><label>College / Department</label><input type="text" placeholder="e.g. CCSICT" value={value.department} onChange={set('department')} readOnly={readOnly} /></div>
          )}
          <div className="field"><label>Contact Number</label><input type="text" placeholder="e.g. 09456552130" value={value.contactNumber} onChange={set('contactNumber')} readOnly={readOnly} /></div>
        </div>
        <div className="field-row three" style={{ marginBottom: 0 }}>
          {isStudent && (
            <>
              <div className="field">
                <label>Year Level</label>
                <select value={value.yearLevel} onChange={set('yearLevel')} disabled={readOnly}>
                  <option value="">—</option>
                  {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="field"><label>College / Department</label><input type="text" placeholder="e.g. CCSICT" value={value.department} onChange={set('department')} readOnly={readOnly} /></div>
            </>
          )}
          <div className="field">
            <label>Civil Status</label>
            <select value={value.civilStatus} onChange={set('civilStatus')} disabled={readOnly}>
              <option value="">—</option><option value="Single">SINGLE</option><option value="Married">MARRIED</option><option value="Widowed">WIDOWED</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
