import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { listStock, listStockRequests } from '../api/stock';
import { clinicDay, parseApiDate } from '../lib/time';
import { formatQty, STOCK_STATUS } from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';
import Icon from './Icon';

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' });

/** "2026-10" → first and last clinic day of that month. */
function monthBounds(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` };
}

function statusOf(qty, reorderLevel) {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= Number(reorderLevel || 0)) return 'low';
  return 'high';
}

const key = (type, name) => `${type}:${name}`;
const add = (map, k, n) => map.set(k, (map.get(k) || 0) + (Number(n) || 0));

/**
 * Monthly supply report, always shown as a table: one row per medicine and
 * supply with its beginning stock, stock received, stock issued to patients,
 * and ending stock for the chosen month.
 *
 * Built from what the API already exposes: current stock levels, dispensed
 * medicines/supplies on visits, and completed restock deliveries. A past
 * month's ending stock is worked back from today's quantity by undoing what
 * was received and issued after that month ended.
 */
export default function MonthlySupplyReport() {
  const [today] = useState(() => clinicDay(new Date()));
  const [month, setMonth] = useState(() => clinicDay(new Date()).slice(0, 7));
  const { from, to } = monthBounds(month);
  const isCurrentMonth = month === today.slice(0, 7);

  const stock = useAsync(() => listStock({ perPage: 500 }), []);
  const deliveries = useAsync(() => listStockRequests({ status: 'completed', perPage: 200 }), []);
  // Everything from the start of the month up to today: what happened inside the
  // month, plus what happened after it (needed to work back to its ending stock).
  const visits = useVisitsInRange(from, today);

  const loading = stock.loading || deliveries.loading || visits.loading;
  const error = stock.error || deliveries.error || visits.error;

  const rows = useMemo(() => {
    const issuedIn = new Map();
    const issuedAfter = new Map();
    for (const v of visits.visits) {
      const day = clinicDay(parseApiDate(v.startedAt));
      if (day < from) continue;
      const target = day <= to ? issuedIn : issuedAfter;
      for (const m of v.medicines || []) add(target, key('medicine', m.medicineName), m.quantityGiven);
      for (const s of v.supplies || []) add(target, key('supply', s.supplyName), s.quantityUsed);
    }

    const receivedIn = new Map();
    const receivedAfter = new Map();
    for (const r of deliveries.data?.items || []) {
      // Only deliveries actually received at the clinic count as stock in.
      const when = r.receivedAt;
      if (!when) continue;
      const day = clinicDay(parseApiDate(when));
      if (day < from) continue;
      const target = day <= to ? receivedIn : receivedAfter;
      for (const line of r.items || []) {
        add(target, key(line.itemType, line.itemName), line.approvedQuantity ?? line.requestedQuantity);
      }
    }

    return (stock.data?.items || [])
      .map((item) => {
        const k = key(item.itemType, item.name);
        const current = Number(item.quantity) || 0;
        const received = receivedIn.get(k) || 0;
        const issued = issuedIn.get(k) || 0;
        const ending = current - (receivedAfter.get(k) || 0) + (issuedAfter.get(k) || 0);
        const beginning = ending - received + issued;
        return {
          key: k,
          name: item.name,
          kind: item.itemType === 'medicine' ? 'Medicine' : 'Supply',
          category: item.categoryName || '—',
          unit: item.unit || '',
          beginning,
          received,
          issued,
          ending,
          reorderLevel: item.reorderLevel,
          status: isCurrentMonth ? item.stockStatus : statusOf(ending, item.reorderLevel),
        };
      })
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  }, [stock.data, deliveries.data, visits.visits, from, to, isCurrentMonth]);

  const totals = rows.reduce(
    (t, r) => ({ received: t.received + r.received, issued: t.issued + r.issued, low: t.low + (r.status !== 'high' ? 1 : 0) }),
    { received: 0, issued: 0, low: 0 },
  );
  const monthName = MONTH_LABEL.format(new Date(`${from}T00:00:00Z`));

  const exportCsv = () => {
    downloadCsv(`monthly-supply-report_${month}.csv`, toCsv(rows, [
      { header: 'Item', value: (r) => r.name },
      { header: 'Kind', value: (r) => r.kind },
      { header: 'Category', value: (r) => r.category },
      { header: 'Unit', value: (r) => r.unit },
      { header: 'Beginning stock', value: (r) => formatQty(r.beginning) },
      { header: 'Received', value: (r) => formatQty(r.received) },
      { header: 'Issued', value: (r) => formatQty(r.issued) },
      { header: 'Ending stock', value: (r) => formatQty(r.ending) },
      { header: 'Reorder level', value: (r) => formatQty(r.reorderLevel) },
      { header: 'Status', value: (r) => STOCK_STATUS[r.status]?.label || r.status },
    ]));
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Monthly supply report</h3>
          <div className="sub">
            {loading
              ? 'Loading…'
              : `${monthName} · ${rows.length} items · ${formatQty(totals.received)} units received · ${formatQty(totals.issued)} units issued · ${totals.low} low or out of stock`}
          </div>
        </div>
        <div className="head-actions no-print">
          <input
            type="month"
            className="auto"
            value={month}
            max={today.slice(0, 7)}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            aria-label="Report month"
          />
          <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={!rows.length}>
            <Icon name="download" size={15} /> CSV
          </button>
        </div>
      </div>

      {error && <div className="login-error">{error}</div>}

      <div className="table-card bordered">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Kind</th>
              <th>Category</th>
              <th className="num">Beginning stock</th>
              <th className="num">Received</th>
              <th className="num">Issued</th>
              <th className="num">Ending stock</th>
              <th className="num">Reorder level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="empty-cell">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} className="empty-cell">No medicines or supplies on file.</td></tr>
            ) : (
              rows.map((r) => {
                const status = STOCK_STATUS[r.status] || { label: r.status, pill: '' };
                return (
                  <tr key={r.key}>
                    <td className="nm">{r.name}</td>
                    <td>{r.kind}</td>
                    <td>{r.category}</td>
                    <td className="num">{formatQty(r.beginning)} <span className="sub">{r.unit}</span></td>
                    <td className="num">{formatQty(r.received)}</td>
                    <td className="num">{formatQty(r.issued)}</td>
                    <td className="num"><strong>{formatQty(r.ending)}</strong> <span className="sub">{r.unit}</span></td>
                    <td className="num">{formatQty(r.reorderLevel)}</td>
                    <td><span className={`pill ${status.pill}`}>{status.label}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
          {!loading && rows.length > 1 && (
            <tfoot>
              <tr>
                <td>Total</td><td /><td /><td />
                <td className="num">{formatQty(totals.received)}</td>
                <td className="num">{formatQty(totals.issued)}</td>
                <td /><td />
                <td>{totals.low} need reorder</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
