import { useMemo, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import {
  approveStockRequest, denyStockRequest, listStock, listStockRequests,
} from '../../api/stock';
import Pagination from '../../components/Pagination';
import Icon from '../../components/Icon';
import { formatDate, parseApiDate } from '../../lib/time';
import { formatQty } from '../../lib/format';
import { downloadCsv, toCsv } from '../../lib/csv';

const STATUS_PILL = { pending: 'amber', approved: 'teal', completed: 'green', denied: 'red' };

const dash = (v) => v || '—';
const requestDate = (r) => r.requestDate || r.requestedAt || r.createdAt || null;
const itemKey = (i) => `${i.itemType}:${i.medicineId ?? i.supplyId ?? i.itemId}`;
const summarise = (r) =>
  r.items.map((i) => `${i.itemName} × ${formatQty(i.approvedQuantity ?? i.requestedQuantity)}`).join(', ');

const CSV_COLUMNS = [
  { header: 'Request', value: (r) => r.requestNumber || `REQ-${r.requestId}` },
  { header: 'Items', value: summarise },
  { header: 'Requested by', value: (r) => r.requestedByName },
  { header: 'Date', value: (r) => (requestDate(r) ? formatDate(parseApiDate(requestDate(r))) : '') },
  { header: 'Approved by', value: (r) => r.approvedByName },
  { header: 'Received by', value: (r) => r.receivedByName },
  { header: 'Status', value: (r) => r.status },
  { header: 'Remarks', value: (r) => r.remarks },
];

/** The review panel keeps its own edited quantities and note per request. */
function ReviewCard({ request, stockByKey, onDone }) {
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(request.items.map((i) => [itemKey(i), String(i.approvedQuantity ?? i.requestedQuantity ?? '')])));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const date = requestDate(request);

  const submit = async (kind) => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'approve') {
        await approveStockRequest(request.requestId, {
          items: request.items.map((i) => ({
            itemType: i.itemType,
            medicineId: i.medicineId ?? null,
            supplyId: i.supplyId ?? null,
            approvedQuantity: String(quantities[itemKey(i)] ?? i.requestedQuantity),
          })),
          adminResponse: note.trim() || null,
        });
      } else {
        await denyStockRequest(request.requestId, { adminResponse: note.trim() || null });
      }
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  };

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div className="card-head">
        <div>
          <h3>
            {request.requestNumber || `REQ-${request.requestId}`}, awaiting your decision{' '}
            <span className="pill amber" style={{ marginLeft: 8 }}><span className="dot" />Pending</span>
          </h3>
          <div className="sub">
            Requested by {dash(request.requestedByName)}
            {date ? ` on ${formatDate(parseApiDate(date))}` : ''}
          </div>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Item</th><th>Kind</th><th>On hand</th><th>Reorder level</th>
              <th>Requested</th><th>Approved qty</th><th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((i) => {
              const key = itemKey(i);
              const onHand = stockByKey.get(key);
              return (
                <tr key={key}>
                  <td className="nm">{i.itemName}</td>
                  <td><span className={`pill ${i.itemType === 'medicine' ? 'blue' : 'teal'}`}>{i.itemType === 'medicine' ? 'Medicine' : 'Supply'}</span></td>
                  <td className={onHand && Number(onHand.quantity) <= 0 ? 'num-red' : ''}>
                    {onHand ? `${formatQty(onHand.quantity)} ${onHand.unit}` : '—'}
                  </td>
                  <td className="sub">{onHand ? formatQty(onHand.reorderLevel) : '—'}</td>
                  <td>{formatQty(i.requestedQuantity)} {i.unit}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      style={{ width: 92, textAlign: 'center' }}
                      value={quantities[key] ?? ''}
                      onChange={(e) => setQuantities({ ...quantities, [key]: e.target.value })}
                    />
                  </td>
                  <td className="sub">{dash(i.reason)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="field full" style={{ marginTop: 18 }}>
        <label>Admin response</label>
        <textarea
          placeholder="Approval notes or denial justification"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="head-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-deny" onClick={() => submit('deny')} disabled={Boolean(busy)}>
          {busy === 'deny' ? 'Denying…' : 'Deny request'}
        </button>
        <button className="btn btn-primary" onClick={() => submit('approve')} disabled={Boolean(busy)}>
          {busy === 'approve' ? 'Approving…' : 'Approve request'}
        </button>
      </div>
    </div>
  );
}

export default function StockRequests() {
  const requests = useAsync(() => listStockRequests({ perPage: 200 }), []);
  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const [filters, setFilters] = useState({ search: '', status: '', requestedBy: '', itemKind: '' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  const all = useMemo(() => requests.data?.items || [], [requests.data]);
  const stockByKey = useMemo(
    () => new Map((stock.data?.items || []).map((i) => [`${i.itemType}:${i.itemId}`, i])),
    [stock.data],
  );

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, completed: 0, denied: 0 };
    for (const r of all) if (c[r.status] != null) c[r.status] += 1;
    return c;
  }, [all]);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const filtered = all.filter((r) => {
      const number = r.requestNumber || `REQ-${r.requestId}`;
      if (q && ![number, summarise(r), r.requestedByName].some((s) => s && String(s).toLowerCase().includes(q))) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.requestedBy && r.requestedByName !== filters.requestedBy) return false;
      if (filters.itemKind && !r.items.some((i) => i.itemType === filters.itemKind)) return false;
      const date = requestDate(r);
      if (committed.dateFrom && (!date || date.slice(0, 10) < committed.dateFrom)) return false;
      if (committed.dateTo && (!date || date.slice(0, 10) > committed.dateTo)) return false;
      return true;
    });
    const dir = order === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => ((requestDate(a) || '') < (requestDate(b) || '') ? -dir : dir));
  }, [all, filters, committed, order]);

  const pageRows = rows.slice((page - 1) * perPage, page * perPage);
  const pending = all.filter((r) => r.status === 'pending');
  const requesters = [...new Set(all.map((r) => r.requestedByName).filter(Boolean))].sort();

  const refresh = () => {
    requests.reload();
    stock.reload();
  };

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Restock review pipeline</h1>
          <div className="sub">Approve, adjust quantities, or deny nurse requisitions with notes</div>
        </div>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="text" placeholder="Search request number or item" value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="auto" value={filters.status} onChange={setFilter('status')}>
            <option value="">Status: all</option>
            <option value="pending">Pending</option><option value="approved">Approved</option>
            <option value="completed">Completed</option><option value="denied">Denied</option>
          </select>
          <select className="auto" value={filters.requestedBy} onChange={setFilter('requestedBy')}>
            <option value="">Requested by: all</option>
            {requesters.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="auto" value={filters.itemKind} onChange={setFilter('itemKind')}>
            <option value="">Item kind: all</option>
            <option value="medicine">Medicine</option><option value="supply">Supply</option>
          </select>
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => { setCommitted(draftRange); setPage(1); }}>Apply</button>
          <div className="spacer" />
          <select className="auto" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Sort: date, newest</option>
            <option value="asc">Sort: date, oldest</option>
          </select>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => downloadCsv('restock-requisitions.csv', toCsv(rows, CSV_COLUMNS))}
            disabled={rows.length === 0}
          >
            <Icon name="download" size={16} /> Export list
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="cap amber">Pending</div>
          <div className="value">{counts.pending}</div>
          <div className="foot">Awaiting your decision</div>
        </div>
        <div className="kpi">
          <div className="cap teal">Approved</div>
          <div className="value">{counts.approved}</div>
          <div className="foot">Awaiting delivery</div>
        </div>
        <div className="kpi">
          <div className="cap green">Completed</div>
          <div className="value">{counts.completed}</div>
          <div className="foot">Delivered and stocked</div>
        </div>
        <div className="kpi">
          <div className="cap red">Denied</div>
          <div className="value">{counts.denied}</div>
          <div className="foot">With justification</div>
        </div>
      </div>

      {requests.error && <div className="login-error" style={{ marginBottom: 14 }}>{requests.error}</div>}

      {pending.map((r) => (
        <ReviewCard key={r.requestId} request={r} stockByKey={stockByKey} onDone={refresh} />
      ))}

      <div className="card" style={{ padding: '20px 22px 6px' }}>
        <div className="card-head">
          <div>
            <h3>All requisitions</h3>
            <div className="sub">Approved tickets stay open until clinic staff confirms the delivery</div>
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Request</th><th>Items</th><th>Requested by</th><th>Date</th>
                <th>Approved by</th><th>Received by</th><th>Status</th><th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {requests.loading ? (
                <tr><td colSpan={8} className="empty-cell">Loading requisitions…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No requisitions found.</td></tr>
              ) : (
                pageRows.map((r) => {
                  const date = requestDate(r);
                  return (
                    <tr key={r.requestId}>
                      <td className="nm">{r.requestNumber || `REQ-${r.requestId}`}</td>
                      <td>{summarise(r)}</td>
                      <td>{dash(r.requestedByName)}</td>
                      <td className="nowrap">{date ? formatDate(parseApiDate(date)) : '—'}</td>
                      <td>{dash(r.approvedByName)}</td>
                      <td>{dash(r.receivedByName)}</td>
                      <td><span className={`pill ${STATUS_PILL[r.status] || 'grey'}`}><span className="dot" />{r.status}</span></td>
                      <td className="no-print">
                        <div className="cell-actions">
                          <button
                            className={`btn btn-sm ${r.status === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => document.querySelector('.card')?.scrollIntoView({ behavior: 'smooth' })}
                          >
                            {r.status === 'pending' ? 'Review' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} perPage={perPage} total={rows.length} onPageChange={setPage} />
      </div>
    </div>
  );
}
