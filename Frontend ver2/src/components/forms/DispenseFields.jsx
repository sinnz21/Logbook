import { useAsync } from '../../hooks/useAsync';
import { listStock } from '../../api/stock';
import { formatQty } from '../../lib/format';
import Icon from '../Icon';

const keyOf = (i) => `${i.itemType}:${i.itemId}`;

/**
 * Step 4 of Add visit record — "Treatment delivery".
 *
 * Medicines and supplies get their own labelled rows, as in the design, but
 * both live in one `value` array: [{ key, quantity, dosage }]. Each row becomes
 * a visit_medicines / visit_supplies line, and saving the visit deducts it from
 * stock in the same transaction (visit_service.create_visit).
 */
export default function DispenseFields({ value, onChange }) {
  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const items = stock.data?.items || [];
  const byKey = new Map(items.map((i) => [keyOf(i), i]));

  const update = (idx, patch) => onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));
  const add = (itemType) => onChange([...value, { key: '', itemType, quantity: '1', dosage: '' }]);

  const optionsFor = (itemType, currentKey) =>
    items.filter((i) => i.itemType === itemType && (keyOf(i) === currentKey || (Number(i.quantity) > 0 && !value.some((r) => r.key === keyOf(i)))));

  const rowFor = (row, idx) => {
    const item = byKey.get(row.key);
    const kind = item?.itemType || row.itemType || 'medicine';
    const isMedicine = kind === 'medicine';
    const over = item && Number(row.quantity) > Number(item.quantity);

    return (
      <div className="dispense-row" key={idx}>
        <div className="field">
          <label>{isMedicine ? 'Medicine' : 'Supply'}</label>
          <select value={row.key} onChange={(e) => update(idx, { key: e.target.value })}>
            <option value="">{stock.loading ? 'Loading inventory…' : `Select a ${kind}…`}</option>
            {optionsFor(kind, row.key).map((i) => (
              <option key={keyOf(i)} value={keyOf(i)}>
                {i.name} — {formatQty(i.quantity)} {i.unit} on hand
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{isMedicine ? 'Quantity' : 'Quantity used'}</label>
          <input type="number" min="0" step="any" value={row.quantity} onChange={(e) => update(idx, { quantity: e.target.value })} />
          {over && <span className="dispense-warn">Only {formatQty(item.quantity)} {item.unit} on hand</span>}
        </div>
        <div className="field">
          <label>{isMedicine ? 'Dosage or instructions' : 'Remarks'}</label>
          <input
            type="text"
            placeholder={isMedicine ? 'e.g. 500 mg, 1 tab after meals' : 'e.g. Used for arm laceration dressing'}
            value={row.dosage}
            onChange={(e) => update(idx, { dosage: e.target.value })}
          />
        </div>
        <button type="button" className="icon-btn danger" onClick={() => remove(idx)} title="Remove">
          <Icon name="trash" size={16} />
        </button>
      </div>
    );
  };

  const medicineRows = value.map((r, i) => [r, i]).filter(([r]) => (byKey.get(r.key)?.itemType || r.itemType) === 'medicine');
  const supplyRows = value.map((r, i) => [r, i]).filter(([r]) => (byKey.get(r.key)?.itemType || r.itemType) === 'supply');

  return (
    <>
      {stock.error && <div className="warn-note" style={{ marginBottom: 14 }}>Inventory unavailable: {stock.error}</div>}

      {medicineRows.map(([row, idx]) => rowFor(row, idx))}
      {supplyRows.map(([row, idx]) => rowFor(row, idx))}

      <div className="head-actions" style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add('medicine')} disabled={stock.loading}>
          <Icon name="plus" size={16} /> Add medicine
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => add('supply')} disabled={stock.loading}>
          <Icon name="plus" size={16} /> Add supply
        </button>
      </div>
    </>
  );
}
