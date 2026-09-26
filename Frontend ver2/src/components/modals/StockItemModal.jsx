import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useLookups } from '../../hooks/useLookups';
import { createStockItem, restockItem, updateStockItem } from '../../api/stock';
import { formatQty } from '../../lib/format';

const UNITS = ['tablet', 'capsule', 'bottle', 'sachet', 'box', 'pcs', 'pair', 'roll'];

// modal.data: { item?: StockItemOut, onSuccess? }
// No item → register a new medicine/supply. With an item → restock it (the
// Figma's "Add / Restock Item" modal covers both).
export default function StockItemModal() {
  const { closeModal, modal, userName } = useApp();
  const { item, onSuccess } = modal.data || {};
  const { itemCategories } = useLookups();
  const [form, setForm] = useState(() => ({
    itemType: item?.itemType || 'medicine',
    name: item?.name || '',
    categoryId: item?.categoryId ?? '',
    unit: item?.unit || 'tablet',
    quantity: item ? '' : '0',
    reorderLevel: item ? formatQty(item.reorderLevel) : '10',
    expiryDate: item?.expiryDate || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const categories = itemCategories.filter((c) => c.appliesTo === 'both' || c.appliesTo === form.itemType);

  const handleSave = async () => {
    const qty = Number(form.quantity);
    const reorder = Number(form.reorderLevel);
    if (!item && !form.name.trim()) return setError('Item name is required.');
    if (!Number.isFinite(qty) || qty < 0 || (item && qty <= 0)) return setError(item ? 'Enter how many units arrived.' : 'Quantity must be 0 or more.');
    if (!Number.isFinite(reorder) || reorder < 0) return setError('Reorder level must be 0 or more.');

    setSaving(true);
    setError(null);
    try {
      if (item) {
        await restockItem(item.itemType, item.itemId, { quantity: String(qty), expiryDate: form.expiryDate || null });
        if (String(reorder) !== formatQty(item.reorderLevel)) {
          await updateStockItem(item.itemType, item.itemId, { reorderLevel: String(reorder) });
        }
      } else {
        await createStockItem({
          itemType: form.itemType,
          name: form.name.trim(),
          categoryId: form.categoryId === '' ? null : Number(form.categoryId),
          unit: form.unit,
          quantity: String(qty),
          reorderLevel: String(reorder),
          expiryDate: form.expiryDate || null,
        });
      }
      onSuccess?.();
      closeModal();
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={item ? `Restock — ${item.name}` : 'Add / Restock Item'}
      subtitle="Update physical stock counts and batch expiry"
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      {error && <div className="login-error">{error}</div>}

      {!item && (
        <div className="segmented">
          <button type="button" className={form.itemType === 'medicine' ? 'active' : ''} onClick={() => setForm({ ...form, itemType: 'medicine', categoryId: '' })}>MEDICINE</button>
          <button type="button" className={form.itemType === 'supply' ? 'active' : ''} onClick={() => setForm({ ...form, itemType: 'supply', categoryId: '' })}>SUPPLY</button>
        </div>
      )}

      <div className="field full" style={{ marginBottom: '12px' }}>
        <label>Item Name</label>
        <input type="text" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={set('name')} readOnly={Boolean(item)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Category</label>
          {item ? (
            <input type="text" value={item.categoryName || '—'} readOnly />
          ) : (
            <select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
            </select>
          )}
        </div>
        <div className="field">
          <label>Unit</label>
          {item ? (
            <input type="text" value={item.unit} readOnly />
          ) : (
            <select value={form.unit} onChange={set('unit')}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
        </div>
      </div>
      <div className="field-row three">
        <div className="field">
          <label>{item ? `Qty Received (${formatQty(item.quantity)} on hand)` : 'Opening Quantity'}</label>
          <input type="number" min="0" step="any" value={form.quantity} onChange={set('quantity')} />
        </div>
        <div className="field"><label>Reorder Level</label><input type="number" min="0" step="any" value={form.reorderLevel} onChange={set('reorderLevel')} /></div>
        <div className="field"><label>Expiry Date</label><input type="date" value={form.expiryDate} onChange={set('expiryDate')} /></div>
      </div>
      <div className="modal-note" style={{ marginTop: '10px', color: 'var(--red)' }}>
        Added By: {userName}. This is automatically logged.
      </div>
    </Modal>
  );
}
