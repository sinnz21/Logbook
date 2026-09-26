import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { createStockRequest, listStock } from '../../api/stock';
import { formatQty } from '../../lib/format';

const URGENCY = {
  out: 'Out of Stock (Immediate procurement)',
  low: 'Low Stock (Re-order threshold reached)',
};

const keyOf = (i) => `${i.itemType}:${i.itemId}`;

// modal.data: { item?: StockItemOut, onSuccess? }
export default function RequestRestockModal() {
  const { closeModal, modal, userName } = useApp();
  const { item, onSuccess } = modal.data || {};
  const stock = useAsync(() => listStock(), []);
  const [selected, setSelected] = useState(item ? keyOf(item) : '');
  const [quantity, setQuantity] = useState('');
  const [urgency, setUrgency] = useState(item?.stockStatus === 'low' ? 'low' : 'out');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const items = stock.data?.items || (item ? [item] : []);
  const chosen = items.find((i) => keyOf(i) === selected);

  const handleSend = async () => {
    const qty = Number(quantity);
    if (!chosen) return setError('Pick the item to restock.');
    if (!Number.isFinite(qty) || qty <= 0) return setError('Enter the quantity needed.');

    setSaving(true);
    setError(null);
    try {
      await createStockRequest({
        items: [{
          itemType: chosen.itemType,
          medicineId: chosen.itemType === 'medicine' ? chosen.itemId : null,
          supplyId: chosen.itemType === 'supply' ? chosen.itemId : null,
          requestedQuantity: String(qty),
          reason: URGENCY[urgency],
        }],
        remarks: remarks.trim() || null,
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
      title="Request Medicine Restock"
      subtitle="Sends a restock notification to Admin for approval"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend} disabled={saving}>{saving ? 'Sending…' : 'Send Request'}</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}
      {stock.error && !item && <div className="login-error">Couldn't load the item list: {stock.error}</div>}

      <div className="field full" style={{ marginBottom: '12px' }}>
        <label>Medicine / Supply Item</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={stock.loading && !item}>
          <option value="">{stock.loading && !item ? 'Loading items…' : 'Select an item…'}</option>
          {items.map((i) => (
            <option key={keyOf(i)} value={keyOf(i)}>
              {i.name} — {formatQty(i.quantity)} {i.unit} on hand
            </option>
          ))}
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Category</label>
          <input type="text" value={chosen?.categoryName || '—'} readOnly />
        </div>
        <div className="field">
          <label>Quantity Needed{chosen ? ` (${chosen.unit})` : ''}</label>
          <input type="number" min="1" step="any" placeholder="e.g. 200" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>
      <div className="field full" style={{ marginBottom: '12px' }}>
        <label>Urgency Level</label>
        <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
          <option value="out">{URGENCY.out}</option>
          <option value="low">{URGENCY.low}</option>
        </select>
      </div>
      <div className="field full">
        <label>Remarks <span className="opt">(Optional)</span></label>
        <input type="text" placeholder="e.g. Needed before exam week" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>
      <div className="modal-note" style={{ marginTop: '10px' }}>
        Logged by: <strong>{userName}</strong> · Will appear immediately on Admin Dashboard.
      </div>
    </Modal>
  );
}
