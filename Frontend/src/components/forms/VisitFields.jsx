import { useLookups } from '../../hooks/useLookups';

export default function VisitFields({ value, onChange }) {
  const { complaints } = useLookups();
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  const toggleTag = (id) =>
    onChange({
      ...value,
      complaintIds: value.complaintIds.includes(id)
        ? value.complaintIds.filter((c) => c !== id)
        : [...value.complaintIds, id],
    });

  return (
    <>
      <div className="field-row three">
        <div className="field"><label>BP</label><input type="text" placeholder="e.g. 110/70" value={value.bloodPressure} onChange={set('bloodPressure')} /></div>
        <div className="field"><label>Temperature (°C)</label><input type="text" inputMode="decimal" placeholder="e.g. 36.8" value={value.temperature} onChange={set('temperature')} /></div>
        <div className="field"><label>Pulse (bpm)</label><input type="text" inputMode="numeric" placeholder="e.g. 78" value={value.pulseRate} onChange={set('pulseRate')} /></div>
      </div>

      <div className="field-row">
        <div className="field"><label>Complaints</label><textarea placeholder="e.g. Mild headache, dizziness" value={value.chiefComplaint} onChange={set('chiefComplaint')} /></div>
        <div className="field"><label>Management</label><textarea placeholder="e.g. Advised rest 30 mins, monitored" value={value.management} onChange={set('management')} /></div>
      </div>

      <div className="field full" style={{ marginBottom: '14px' }}>
        {/* Structured tags feed Top Complaints + Insights; free text can't be grouped. */}
        <label>Complaint Tags <span className="opt">(for reports — pick all that apply)</span></label>
        <div className="tag-pick">
          {complaints.map((c) => (
            <button
              type="button"
              key={c.complaintId}
              className={value.complaintIds.includes(c.complaintId) ? 'on' : ''}
              onClick={() => toggleTag(c.complaintId)}
            >
              {c.complaintName}
            </button>
          ))}
        </div>
      </div>

      <div className="field full">
        <label>Treatment / Medication Given</label>
        <textarea placeholder="e.g. Biogesic 500mg, rest 30 mins" value={value.treatmentNotes} onChange={set('treatmentNotes')} />
      </div>
    </>
  );
}
