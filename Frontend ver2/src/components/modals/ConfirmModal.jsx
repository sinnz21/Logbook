import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';

// A yes/no confirmation around an async action.
// modal.data: { title, body, confirmLabel?, busyLabel?, danger?, onConfirm: () => Promise, onSuccess? }
export default function ConfirmModal() {
  const { closeModal, modal } = useApp();
  const { title, body, confirmLabel = 'Confirm', busyLabel = 'Working…', danger, onConfirm, onSuccess } = modal.data || {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await onConfirm();
      onSuccess?.(result);
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      narrow
      title={title}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-link" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={handleConfirm} disabled={saving}>
            {saving ? busyLabel : confirmLabel}
          </button>
        </>
      }
    >
      {error && <div className="login-error" style={{ margin: '0 0 14px' }}>{error}</div>}
      <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)' }}>{body}</div>
    </Modal>
  );
}
