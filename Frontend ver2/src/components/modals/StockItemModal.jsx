import { useState } from 'react';
import Modal from '../Modal';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { useLookups } from '../../hooks/useLookups';
import { createStockItem, listStock, restockItem, updateStockItem } from '../../api/stock';
import { formatQty, initialsOf } from '../../lib/format';

const UNITS = ['Box', 'Tablet', 'Capsule', 'Bottle', 'Sachet', 'Piece', 'Pair', 'Roll'];
const keyOf = (i) => `${i.itemType}:${i.itemId}`;

// modal.data: { item?: StockItemOut, onSuccess? }
// The design's one modal covers both jobs: "Add new item" registers a catalog
// entry with its opening stock, "Restock existing" tops an item back up.
export default function StockItemModal() {
  const { closeModal, modal, userName } = useApp();
  const { item, onSuccess } = modal.data || {};
  const { itemCategories } = useLookups();
  const stock = useAsync(() => listStock({ perPage: 200 }), []);

  const [mode, setMode] = useState(item ? 'restock' : 'new');
  const [target, setTarget] = useState(item ? keyOf(item) : '');
  const [form, setForm] = useState(() => ({
    itemType: item?.itemType || 'medicine',
    name: item?.name || '',
    categoryId: item?.categoryId ?? '',
    unit: item?.unit || 'Box',
    quantity: item ? '' : '1',
    reorderLevel: item ? formatQty(item.reorderLevel) : '50',
    expiryDate: item?.expiryDate?.slice(0, 10) || '',
    batch: '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const items = stock.data?.items || [];
  const chosen = items.find((i) => keyOf(i) === target) || item || null;
  const categories = itemCategories.filter((c) => c.appliesTo === 'both' || c.appliesTo === form.itemType);

  const handleSave = async () => {
    const qty = Number(form.quantity);
    const reorder = Number(form.reorderLevel);

    if (mode === 'restock') {
      if (!chosen) return setError('Pick the item to restock.');
      if (!Number.isFinite(qty) || qty <= 0) return setError('Enter how many units arrived.');
    } else {
      if (!form.name.trim()) return setError('Item name is required.');
      if (!Number.isFinite(qty) || qty < 0) return setError('Quantity must be 0 or more.');
      if (!Number.isFinite(reorder) || reorder < 0) return setError('Reorder level must be 0 or more.');
    }

    setSaving(true);
    setError(null);
    try {
      if (mode === 'restock') {
        await restockItem(chosen.itemType, chosen.itemId, {
          quantity: String(qty),
          expiryDate: form.expiryDate || null,
        });
        if (form.reorderLevel !== '' && String(reorder) !== formatQty(chosen.reorderLevel)) {
          await updateStockItem(chosen.itemType, chosen.itemId, { reorderLevel: String(reorder) });
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
      title="Add or restock item"
      subtitle="Adds a new item or increases the quantity of an existing one."
      onClose={closeModal}
      actions={
        <>
          <button className="btn btn-link" onClick={closeModal} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="segmented full" style={{ marginBottom: 18 }}>
        <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Add new item</button>
        <button className={mode === 'restock' ? 'active' : ''} onClick={() => setMode('restock')}>Restock existing</button>
      </div>

      {mode === 'new' ? (
        <>
          <div className="field full" style={{ marginBottom: 14 }}>
            <label>Item name</label>
            <input type="text" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={set('name')} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Kind</label>
              <select value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value, categoryId: '' })}>
                <option value="medicine">Medicine</option>
                <option value="supply">Supply</option>
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.categoryId} onChange={set('categoryId')}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row three">
            <div className="field">
              <label>Unit</label>
              <select value={form.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="field"><label>Quantity</label><input type="number" min="0" step="any" value={form.quantity} onChange={set('quantity')} /></div>
            <div className="field"><label>Reorder level</label><input type="number" min="0" step="any" value={form.reorderLevel} onChange={set('reorderLevel')} /></div>
          </div>
        </>
      ) : (
        <>
          <div className="field full" style={{ marginBottom: 14 }}>
            <label>Item to restock</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={stock.loading && !item}>
              <option value="">{stock.loading && !item ? 'Loading items…' : 'Select an item…'}</option>
              {(items.length ? items : item ? [item] : []).map((i) => (
                <option key={keyOf(i)} value={keyOf(i)}>
                  {i.name} — {formatQty(i.quantity)} {i.unit} on hand
                </option>
              ))}
            </select>
          </div>
          <div className="field-row three">
            <div className="field">
              <label>Quantity received{chosen ? ` (${chosen.unit})` : ''}</label>
              <input type="number" min="0" step="any" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div className="field"><label>Reorder level</label><input type="number" min="0" step="any" value={form.reorderLevel} onChange={set('reorderLevel')} /></div>
            <div className="field"><label>Category</label><input type="text" value={chosen?.categoryName || '—'} readOnly /></div>
          </div>
        </>
      )}

      <div className="field-row">
        <div className="field"><label>Expiry date</label><input type="date" value={form.expiryDate} onChange={set('expiryDate')} /></div>
        <div className="field">
          {/* Shown because the design asks for it, but there is nowhere to store
              it: one stock row holds one expiry (Plan v2 section 6 leaves batch
              tracking to a future stock_batches table), so this is not sent. */}
          <label>Batch or lot <span className="opt">(not stored yet)</span></label>
          <input type="text" placeholder="e.g. B-2026-04" value={form.batch} onChange={set('batch')} />
        </div>
      </div>

      <div className="info-note">
        <div className="avatar sm">{initialsOf(userName) || 'NS'}</div>
        <span>Added by {userName || 'the signed-in nurse'}. This is logged automatically to the audit ledger.</span>
      </div>
    </Modal>
  );
}
