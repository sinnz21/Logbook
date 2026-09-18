import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { signOutVisit } from '../../api/visits';
import { formatDuration, formatTime, parseApiDate } from '../../lib/time';
import { notConnected } from '../../lib/notConnected';

// modal.data: { visit: VisitOut, onSuccess? }
export default function CheckoutModal() {
  const { closeModal, modal } = useApp();
  const { visit, onSuccess } = modal.data || {};
  const { dispositions } = useLookups();
  const [dispositionId, setDispositionId] = useState(dispositions[0]?.dispositionId ?? null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [now] = useState(() => new Date());

  if (!visit) return null;

  const startedAt = parseApiDate(visit.startedAt);
  const previewMinutes = Math.max(0, Math.round((now - startedAt) / 60000));

  const handleConfirm = async () => {
    if (!dispositionId) return setError('Choose a disposition.');
    setSaving(true);
    setError(null);
    try {
      await signOutVisit(visit.visitId, {
        dispositionId,
        treatmentNotes: notes.trim() || undefined,
      });
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Sign Out — ${visit.patientName}`}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-outline" onClick={() => notConnected('Print Slip', 'the excuse-slip print template isn\'t built yet')}>🖨 Print Slip</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Signing out…' : 'Confirm'}
          </button>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}
      <div className="field-row three">
        <div className="field"><label>Time In</label><input type="text" value={formatTime(startedAt)} readOnly /></div>
        <div className="field"><label>Time of Exit</label><input type="text" value={formatTime(now)} readOnly /></div>
        <div className="field"><label>Duration</label><input type="text" value={formatDuration(previewMinutes)} readOnly /></div>
      </div>
      <div className="field full" style={{ marginTop: '10px' }}>
        <label>Disposition</label>
        <div className="checkbox-row" style={{ gap: '16px', marginTop: '6px' }}>
          {dispositions.map((d) => (
            <label key={d.dispositionId}>
              <input
                type="radio"
                name="dispChoice"
                checked={dispositionId === d.dispositionId}
                onChange={() => setDispositionId(d.dispositionId)}
              /> {d.dispositionName}
            </label>
          ))}
        </div>
      </div>
      <div className="field full" style={{ marginTop: '10px' }}>
        <label>Treatment Notes <span className="opt">(Optional)</span></label>
        <textarea
          placeholder="Anything to add before closing this visit..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}
