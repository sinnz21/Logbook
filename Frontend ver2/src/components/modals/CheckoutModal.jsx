import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { signOutVisit } from '../../api/visits';
import { formatDuration, formatTime, parseApiDate } from '../../lib/time';
import { formatQty, patientMeta } from '../../lib/format';

const SENT_HOME = /sent home/i;

// modal.data: { visit: VisitOut, onSuccess? }
export default function CheckoutModal() {
  const { closeModal, modal, navigate } = useApp();
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
  const chosen = dispositions.find((d) => d.dispositionId === dispositionId);
  const sendingHome = chosen && SENT_HOME.test(chosen.dispositionName);

  const medicines = (visit.medicines || []).map((m) => `${m.medicineName} × ${formatQty(m.quantityGiven)}`);
  const supplies = (visit.supplies || []).map((s) => `${s.supplyName} × ${formatQty(s.quantityUsed)}`);

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
      subtitle={patientMeta(visit)}
      onClose={closeModal}
      actions={
        <>
          <button
            className="btn btn-outline"
            style={{ marginRight: 'auto' }}
            onClick={() => navigate('parental-notification', visit)}
          >
            🖨 Print Slip
          </button>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Signing out…' : 'Confirm Sign Out'}
          </button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}

      <div className="field-row three">
        <div className="field"><label>Time In</label><input type="text" value={formatTime(startedAt)} readOnly /></div>
        <div className="field"><label>Time of Exit</label><input type="text" value={formatTime(now)} readOnly /></div>
        <div className="field"><label>Duration</label><input type="text" value={formatDuration(previewMinutes)} readOnly /></div>
      </div>

      <div className="field full" style={{ marginBottom: '14px' }}>
        <label>Disposition</label>
        <div className="radio-row" style={{ marginTop: '6px' }}>
          {dispositions.map((d) => (
            <label key={d.dispositionId}>
              <input
                type="radio"
                name="dispChoice"
                checked={dispositionId === d.dispositionId}
                onChange={() => setDispositionId(d.dispositionId)}
              />
              {d.dispositionName}
            </label>
          ))}
        </div>
      </div>

      <div className="field full" style={{ marginBottom: '14px' }}>
        <label>Treatment Given</label>
        <input type="text" value={medicines.join(', ') || 'None recorded'} readOnly />
      </div>
      <div className="field full" style={{ marginBottom: '14px' }}>
        <label>Supplies Used</label>
        <input type="text" value={supplies.join(', ') || 'None recorded'} readOnly />
      </div>

      <div className="field full">
        <label>Sign-out Notes <span className="opt">(Optional)</span></label>
        <textarea
          placeholder="e.g. Advised rest, no further symptoms"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {sendingHome && (
        <div className="warn-note" style={{ marginTop: '12px' }}>
          Sending a student home — print a Parental Notification before they leave.
        </div>
      )}
    </Modal>
  );
}
