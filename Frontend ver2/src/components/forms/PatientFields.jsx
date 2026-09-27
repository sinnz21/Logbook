import { useLookups } from '../../hooks/useLookups';
import { ageFrom } from '../../lib/format';

// Stored values stay capitalised so they match what the API returns.
const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

/** "Non-Teaching Staff (NASA)" → "NASA", otherwise the type name as written. */
const shortTypeName = (typeName = '') => typeName.match(/\(([^)]+)\)/)?.[1] || typeName;

const ID_LABELS = { Student: 'ID number', Faculty: 'Faculty number' };
const PANEL_TITLE = { Student: 'Student fields', Faculty: 'Faculty fields' };

/**
 * Step 2 of Add visit record, and the body of Edit patient.
 *
 * The type picker lives in step 1 of the page, so it is only rendered here
 * when `showTypePicker` is set (the edit modal has nowhere else to put it).
 */
export default function PatientFields({ value, onChange, readOnly = false, showTypePicker = false }) {
  const { patientTypes } = useLookups();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const typeName = patientTypes.find((t) => t.patientTypeId === value.patientTypeId)?.typeName;
  const isStudent = typeName === 'Student';
  const age = ageFrom(value.dateOfBirth);

  // Program / year level only mean something for students; clear them when
  // switching away so a faculty record doesn't keep a stale "BSCS, 3rd year".
  const pickType = (t) => {
    if (readOnly) return;
    const student = t.typeName === 'Student';
    onChange({ ...value, patientTypeId: t.patientTypeId, ...(student ? {} : { program: '', yearLevel: '' }) });
  };

  return (
    <>
      {showTypePicker && (
        <div className="chip-row">
          {patientTypes.map((t) => (
            <button
              type="button"
              key={t.patientTypeId}
              className={`chip${value.patientTypeId === t.patientTypeId ? ' on' : ''}`}
              onClick={() => pickType(t)}
              disabled={readOnly}
            >
              {shortTypeName(t.typeName)}
            </button>
          ))}
        </div>
      )}

      <div className="field-row three">
        <div className="field">
          <label>First name</label>
          <input type="text" placeholder="e.g. Maria" value={value.firstName} onChange={set('firstName')} readOnly={readOnly} />
        </div>
        <div className="field">
          <label>Last name</label>
          <input type="text" placeholder="e.g. Santos" value={value.lastName} onChange={set('lastName')} readOnly={readOnly} />
        </div>
        <div className="field">
          <label>Middle name <span className="opt">(optional)</span></label>
          <input type="text" placeholder="e.g. Reyes" value={value.middleName} onChange={set('middleName')} readOnly={readOnly} />
        </div>
      </div>

      <div className="field-row four">
        <div className="field">
          <label>Gender</label>
          <select value={value.sex} onChange={set('sex')} disabled={readOnly}>
            <option value="">—</option><option value="Female">Female</option><option value="Male">Male</option>
          </select>
        </div>
        <div className="field">
          {/* The design asks for Age, but the backend stores date_of_birth and
              derives age (a stored age is wrong within a year). */}
          <label>Date of birth {age != null && <span className="opt">({age} years old)</span>}</label>
          <input type="date" value={value.dateOfBirth} onChange={set('dateOfBirth')} readOnly={readOnly} />
        </div>
        <div className="field">
          <label>Civil status</label>
          <select value={value.civilStatus} onChange={set('civilStatus')} disabled={readOnly}>
            <option value="">—</option><option value="Single">Single</option>
            <option value="Married">Married</option><option value="Widowed">Widowed</option>
          </select>
        </div>
        <div className="field">
          <label>Contact number</label>
          <input type="text" placeholder="e.g. 0945 655 2130" value={value.contactNumber} onChange={set('contactNumber')} readOnly={readOnly} />
        </div>
      </div>

      <div className="sub-panel">
        <div className="panel-title">{PANEL_TITLE[typeName] || `${shortTypeName(typeName || '')} fields`.trim()}</div>
        <div className="field-row four" style={{ marginBottom: 0 }}>
          <div className="field">
            <label>{ID_LABELS[typeName] || 'Employee ID'}</label>
            <input type="text" placeholder="e.g. 2023-04512" value={value.patientNumber} onChange={set('patientNumber')} readOnly={readOnly} />
          </div>
          {isStudent && (
            <>
              <div className="field">
                <label>Program</label>
                <input type="text" placeholder="e.g. BS Computer Science" value={value.program} onChange={set('program')} readOnly={readOnly} />
              </div>
              <div className="field">
                <label>Year level</label>
                <select value={value.yearLevel} onChange={set('yearLevel')} disabled={readOnly}>
                  <option value="">—</option>
                  {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="field">
            <label>Department or college</label>
            <input type="text" placeholder="e.g. CCSICT" value={value.department} onChange={set('department')} readOnly={readOnly} />
          </div>
        </div>
      </div>
    </>
  );
}
