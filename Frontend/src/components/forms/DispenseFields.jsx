import { useAsync } from '../../hooks/useAsync';
import { listStock } from '../../api/stock';
import { formatQty } from '../../lib/format';

const keyOf = (i) => `${i.itemType}:${i.itemId}`;

/**
 * "Medicines & Supplies Given" — each row becomes a visit_medicines /
 * visit_supplies line, and saving the visit deducts it from stock in the same
 * transaction (visit_service.create_visit). value: [{ key, quantity, dosage }]
 */
export default function DispenseFields({ value, onChange }) {
  const stock = useAsync(() => listStock(), []);
  const items = stock.data?.items || [];
  const byKey = new Map(items.map((i) => [keyOf(i), i]));
  const available = items.filter((i) => Number(i.quantity) > 0 && !value.some((r) => r.key === keyOf(i)));

  const update = (idx, patch) => onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx) => onChange(value.filter((_, i) => i !== idx));
  const add = (key) => key && onChange([...value, { key, quantity: '1', dosage: '' }]);

  return (
    <div className="field full" style={{ marginBottom: '14px' }}>
      <label>Medicines &amp; Supplies Given <span className="opt">(deducted from stock on save)</span></label>
      {stock.error && <div className="sub">Inventory unavailable: {stock.error}</div>}

      {value.map((row, idx) => {
        const item = byKey.get(row.key);
        const over = item && Number(row.quantity) > Number(item.quantity);
        return (
          <div className="dispense-row" key={row.key}>
            <div className="nm">
              {item?.name || 'Unknown item'}
              <div className={over ? 'dispense-warn' : 'sub'}>{item ? `${formatQty(item.quantity)} ${item.unit} on hand` : ''}</div>
            </div>
            <input type="number" min="0" step="any" value={row.quantity} onChange={(e) => update(idx, { quantity: e.target.value })} title="Quantity" />
            {item?.itemType === 'medicine' ? (
              <input type="text" placeholder="Dosage, e.g. 500mg" value={row.dosage} onChange={(e) => update(idx, { dosage: e.target.value })} />
            ) : <span />}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(idx)} title="Remove">✕</button>
          </div>
        );
      })}

      <select value="" onChange={(e) => add(e.target.value)} disabled={stock.loading || available.length === 0}>
        <option value="">{stock.loading ? 'Loading inventory…' : available.length ? '＋ Add a medicine or supply…' : 'Nothing in stock to add'}</option>
        {available.map((i) => (
          <option key={keyOf(i)} value={keyOf(i)}>
            {i.itemType === 'medicine' ? '💊' : '🩹'} {i.name} — {formatQty(i.quantity)} {i.unit}
          </option>
        ))}
      </select>
    </div>
  );
}
