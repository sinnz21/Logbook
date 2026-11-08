import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { listTrash, restoreFromTrash } from '../../api/trash';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';

const when = (iso) => {
  const at = parseApiDate(iso);
  return `${formatDate(at)}, ${formatTime(at)}`;
};

// Settings → Trash → Open trash. Deleted patients and visits, each with Restore.
// modal.data: { retentionDays }
export default function TrashModal() {
  const { closeModal, modal } = useApp();
  const retentionDays = modal.data?.retentionDays;
  const trash = useAsync(() => listTrash(), []);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const items = trash.data || [];

  const restore = async (item) => {
    setBusy(`${item.kind}-${item.id}`);
    setMessage(null);
    try {
      await restoreFromTrash(item.kind, item.id);
      setMessage({ ok: true, text: `Restored: ${item.label}` });
      trash.reload();
    } catch (e) {
      setMessage({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      wide
      maxWidth={900}
      title="Trash"
      subtitle={`Deleted patients and visits${retentionDays ? `, kept ${retentionDays} days before they're removed for good` : ''}`}
      onClose={closeModal}
      actions={<button className="btn btn-primary" onClick={closeModal}>Close</button>}
    >
      {message && (
        <div className={message.ok ? 'ok-note' : 'login-error'} style={{ marginBottom: 12 }}>{message.text}</div>
      )}
      <div className="table-card bordered" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        <table>
          <thead>
            <tr><th>Record</th><th>Deleted</th><th>Removed for good</th><th /></tr>
          </thead>
          <tbody>
            {trash.loading ? (
              <tr><td colSpan={4} className="empty-cell">Loading…</td></tr>
            ) : trash.error ? (
              <tr><td colSpan={4} className="empty-cell">{trash.error}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="empty-cell">The trash is empty.</td></tr>
            ) : (
              items.map((it) => (
                <tr key={`${it.kind}-${it.id}`}>
                  <td className="stack-cell">
                    <div className="nm">
                      <span className={`pill ${it.kind === 'patient' ? 'blue' : 'teal'}`} style={{ marginRight: 8 }}>
                        {it.kind === 'patient' ? 'Patient' : 'Visit'}
                      </span>
                      {it.label}
                    </div>
                    {it.detail && <div className="lo">{it.detail}</div>}
                  </td>
                  <td className="nowrap">{when(it.deletedAt)}</td>
                  <td className="nowrap">{formatDate(parseApiDate(it.purgeAt))}</td>
                  <td>
                    <div className="cell-actions">
                      <button className="btn btn-soft btn-sm" onClick={() => restore(it)} disabled={busy !== null}>
                        {busy === `${it.kind}-${it.id}` ? 'Restoring…' : 'Restore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
