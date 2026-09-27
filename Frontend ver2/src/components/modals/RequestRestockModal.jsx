import { useState } from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { createStockRequest, listStock } from '../../api/stock';
import { formatQty } from '../../lib/format';
import { formatDate, parseApiDate } from '../../lib/time';

const keyOf = (i) => `${i.itemType}:${i.itemId}`;
const STATUS_PILL = { pending: 'amber', approved: 'teal', completed: 'green', denied: 'red' };

// modal.data: { item?: StockItemOut, request?: StockRequestOut, onSuccess? }
//
// With `request` the modal opens read-only on an existing ticket. Otherwise it
// builds a new multi-item requisition, pre-seeded with `item` when the nurse
// clicked Request on a specific row.
export default function RequestRestockModal() {
  const { closeModal, modal, userName } = useApp();
  const { item, request, onSuccess } = modal.data || {};
  const stock = useAsync(() => listStock({ perPage: 200 }), []);

  const [lines, setLines] = useState(() => (item ? [{ key: keyOf(item), quantity: '' }] : []));
  const [picker, setPicker] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const items = stock.data?.items || (item ? [item] : []);
  const byKey = new Map(items.map((i) => [keyOf(i), i]));
  const available = items.filter((i) => !lines.some((l) => l.key === keyOf(i)));

  const addLine = () => {
    if (!picker) return;
    setLines([...lines, { key: picker, quantity: '' }]);
    setPicker('');
  };
  const update = (idx, patch) => setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const remove = (idx) => setLines(lines.filter((_, i) => i !== idx));

  const handleSend = async () => {
    if (lines.length === 0) return setError('Add at least one item to the requisition.');
    for (const l of lines) {
      const q = Number(l.quantity);
      if (!Number.isFinite(q) || q <= 0) return setError('Every item needs a quantity above 0.');
    }

    setSaving(true);
    setError(null);
    try {
      await createStockRequest({
        items: lines.map((l) => {
          const chosen = byKey.get(l.key);
          return {
            itemType: chosen.itemType,
            medicineId: chosen.itemType === 'medicine' ? chosen.itemId : null,
            supplyId: chosen.itemType === 'supply' ? chosen.itemId : null,
            requestedQuantity: String(Number(l.quantity)),
            reason: chosen.stockStatus === 'out_of_stock' ? 'Out of stock' : 'At or below reorder level',
          };
        }),
        remarks: reason.trim() || null,
      });
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  /* ── Read-only view of an existing ticket ── */
  if (request) {
    const at = request.requestDate || request.requestedAt || request.createdAt;
    return (
      <Modal
        wide
        title={`Restock requisition, ${request.requestNumber || `REQ-${request.requestId}`}`}
        badge={<span className={`pill ${STATUS_PILL[request.status] || 'grey'}`}><span className="dot" />{request.status}</span>}
        subtitle={`Raised by ${request.requestedByName || 'a nurse'}${at ? ` on ${formatDate(parseApiDate(at))}` : ''}.`}
        onClose={closeModal}
        actions={<button className="btn btn-primary" onClick={closeModal}>Close</button>}
      >
        <div className="table-card">
          <table>
            <thead><tr><th>Item</th><th>Requested</th><th>Approved</th><th>Unit</th></tr></thead>
            <tbody>
              {request.items.map((i) => (
                <tr key={`${i.itemType}:${i.medicineId ?? i.supplyId}`}>
                  <td className="nm">{i.itemName}</td>
                  <td>{formatQty(i.requestedQuantity)}</td>
                  <td>{i.approvedQuantity == null ? '—' : formatQty(i.approvedQuantity)}</td>
                  <td className="sub">{i.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {request.remarks && (
          <div className="field full" style={{ marginTop: 16 }}>
            <label>Reason or admin response</label>
            <div className="readonly-box">{request.remarks}</div>
          </div>
        )}
      </Modal>
    );
  }

  /* ── New requisition ── */
  return (
    <Modal
      wide
      title="Restock requisition"
      subtitle={`Raised by ${userName || 'the signed-in nurse'}. Sent to the admin for approval.`}
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-link" onClick={closeModal} disabled={saving}>Close</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={saving}>
            {saving ? 'Sending…' : 'Send requisition'}
          </button>
        </>
      }
    >
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}
      {stock.error && <div className="warn-note" style={{ marginBottom: 14 }}>Couldn&rsquo;t load the item list: {stock.error}</div>}

      <div className="table-card">
        <table>
          <thead><tr><th>Item</th><th>On hand</th><th>Requested</th><th>Unit</th><th /></tr></thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={5} className="empty-cell">Nothing added yet. Pick an item below.</td></tr>
            ) : (
              lines.map((l, idx) => {
                const chosen = byKey.get(l.key);
                return (
                  <tr key={l.key}>
                    <td className="nm">{chosen?.name || 'Unknown item'}</td>
                    <td className={chosen && Number(chosen.quantity) <= 0 ? 'num-red' : 'sub'}>
                      {chosen ? `${formatQty(chosen.quantity)} ${chosen.unit}` : '—'}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        style={{ width: 96, textAlign: 'center' }}
                        placeholder="0"
                        value={l.quantity}
                        onChange={(e) => update(idx, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="sub">{chosen?.unit || '—'}</td>
                    <td>
                      <button className="btn btn-danger-soft btn-sm" onClick={() => remove(idx)}>Remove</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="filter-row" style={{ marginTop: 16 }}>
        <select className="grow" value={picker} onChange={(e) => setPicker(e.target.value)} disabled={stock.loading}>
          <option value="">{stock.loading ? 'Loading inventory…' : 'Add another item'}</option>
          {available.map((i) => (
            <option key={keyOf(i)} value={keyOf(i)}>
              {i.name} — {formatQty(i.quantity)} {i.unit} on hand
            </option>
          ))}
        </select>
        <button className="btn btn-soft" onClick={addLine} disabled={!picker}>
          <Icon name="plus" size={16} /> Add
        </button>
      </div>

      <div className="field full" style={{ marginTop: 16, marginBottom: 16 }}>
        <label>Reason or justification</label>
        <textarea
          placeholder="e.g. Out of stock since Sep 12, used daily"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="warn-note">
        While the status is pending you can still edit or cancel this requisition. Once the admin
        approves it, only delivery confirmation is left.
      </div>
    </Modal>
  );
}
