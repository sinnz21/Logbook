import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';

// modal.data: { onConfirm: () => Promise, onSuccess?, what? }
export default function SoftDeleteModal() {
  const { closeModal, modal } = useApp();
  const { onConfirm, onSuccess, what = 'record' } = modal.data || {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      await onConfirm();
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      maxWidth="480px"
      title="🗑 Move to Trash?"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>{saving ? 'Moving…' : 'Move to Trash'}</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}
      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>
        This {what} will be <strong>soft-deleted</strong> — hidden from normal views but kept for 90 days
        (see Soft Delete in System Settings) so it can still be recovered if needed. It won't be permanently erased.
      </p>
    </Modal>
  );
}
