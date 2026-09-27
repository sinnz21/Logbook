import { useState } from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { signOutVisit } from '../../api/visits';
import { formatDuration, formatTime, parseApiDate } from '../../lib/time';
import { formatQty } from '../../lib/format';

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

  // The design shows three radio pills; anything beyond those stays in a select
  // so a clinic with extra dispositions can still pick them.
  const primary = dispositions.slice(0, 3);
  const rest = dispositions.slice(3);

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
      title={`Sign out, ${visit.patientName}`}
      subtitle={[visit.patientTypeName, visit.program, visit.yearLevel, visit.patientNumber].filter(Boolean).join(', ')}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost left" onClick={() => navigate('parental-notification', visit)}>
            <Icon name="printer" size={16} /> Print slip
          </button>
          <button className="btn btn-link" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Signing out…' : 'Confirm sign out'}
          </button>
        </>
      }
    >
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="stat-row">
        <div className="stat-box"><div className="k">Time in</div><div className="v">{formatTime(startedAt)}</div></div>
        <div className="stat-box"><div className="k">Time of exit</div><div className="v">{formatTime(now)}</div></div>
        <div className="stat-box"><div className="k">Duration</div><div className="v">{previewMinutes < 60 ? `Under 1 hour` : formatDuration(previewMinutes)}</div></div>
      </div>

      <div className="field full" style={{ marginBottom: 16 }}>
        <label>Disposition</label>
        <div className="radio-row" style={{ marginTop: 4 }}>
          {primary.map((d) => (
            <label className={`radio-pill${dispositionId === d.dispositionId ? ' on' : ''}`} key={d.dispositionId}>
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
        {rest.length > 0 && (
          <select
            style={{ marginTop: 10 }}
            value={rest.some((d) => d.dispositionId === dispositionId) ? dispositionId : ''}
            onChange={(e) => setDispositionId(Number(e.target.value))}
          >
            <option value="">Other disposition…</option>
            {rest.map((d) => <option key={d.dispositionId} value={d.dispositionId}>{d.dispositionName}</option>)}
          </select>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label>Treatment given</label>
          <div className="readonly-box">{medicines.join(', ') || 'None recorded'}</div>
        </div>
        <div className="field">
          <label>Supplies used</label>
          <div className="readonly-box">{supplies.join(', ') || 'None recorded'}</div>
        </div>
      </div>

      <div className="field full" style={{ marginBottom: 16 }}>
        <label>Sign-out notes</label>
        <textarea
          placeholder="e.g. Advised rest, no further symptoms"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {sendingHome && (
        <div className="info-note">
          <Icon name="printer" size={17} />
          <span>Sending a student home prints a parental notification automatically.</span>
        </div>
      )}
    </Modal>
  );
}
