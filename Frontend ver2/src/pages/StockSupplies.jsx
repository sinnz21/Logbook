import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests, receiveStockRequest } from '../api/stock';
import Pagination from '../components/Pagination';
import { formatDate, parseApiDate } from '../lib/time';
import { formatQty, STOCK_STATUS } from '../lib/format';

const dash = (v) => v || '—';
const requestDate = (r) => r.requestDate || r.requestedAt || r.createdAt || null;

const STATUS_PILL = {
  pending: 'pending',
  approved: 'active',
  completed: 'high-stock',
  denied: 'inactive',
};

/** Days until an item expires, or null when it has no expiry on file. */
function daysToExpiry(item) {
  if (!item.expiryDate) return null;
  const expiry = new Date(`${item.expiryDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.round((expiry - Date.now()) / 86400000);
}

export default function StockSupplies() {
  const { openModal } = useApp();
  const stock = useAsync(() => listStock(), []);
  const requests = useAsync(() => listStockRequests({ perPage: 100 }), []);

  const [filters, setFilters] = useState({ search: '', kind: '', category: '', status: '', expiry: '' });
  const [sort, setSort] = useState({ by: 'name', order: 'asc' });
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [receiving, setReceiving] = useState(null);

  const items = useMemo(() => stock.data?.items || [], [stock.data]);
  const categories = useMemo(
    () => [...new Set(items.map((i) => i.categoryName).filter(Boolean))].sort(),
    [items],
  );

  const counts = useMemo(() => {
    const c = { total: items.length, medicine: 0, supply: 0, high: 0, low: 0, out_of_stock: 0, expiring: 0 };
    for (const i of items) {
      c[i.itemType] = (c[i.itemType] || 0) + 1;
      c[i.stockStatus] = (c[i.stockStatus] || 0) + 1;
      const days = daysToExpiry(i);
      if (days != null && days <= 60) c.expiring += 1;
    }
    return c;
  }, [items]);

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const dir = sort.order === 'asc' ? 1 : -1;
    return items
      .filter((i) => {
        if (q && ![i.name, i.categoryName, i.updatedByName].some((s) => s && s.toLowerCase().includes(q))) return false;
        if (filters.kind && i.itemType !== filters.kind) return false;
        if (filters.category && i.categoryName !== filters.category) return false;
        if (filters.status && i.stockStatus !== filters.status) return false;
        if (filters.expiry) {
          const days = daysToExpiry(i);
          if (filters.expiry === 'soon' && !(days != null && days <= 60)) return false;
          if (filters.expiry === 'expired' && !(days != null && days < 0)) return false;
          if (filters.expiry === 'none' && i.expiryDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort.by === 'quantity') return (Number(a.quantity) - Number(b.quantity)) * dir;
        return a.name.localeCompare(b.name) * dir;
      });
  }, [items, filters, sort]);

  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

  // The date range filters the requisition log below; current stock levels have
  // no date to filter on.
  const myRequests = useMemo(() => {
    const list = requests.data?.items || [];
    return list.filter((r) => {
      const day = requestDate(r)?.slice(0, 10);
      if (committed.dateFrom && (!day || day < committed.dateFrom)) return false;
      if (committed.dateTo && (!day || day > committed.dateTo)) return false;
      return true;
    });
  }, [requests.data, committed]);

  const refresh = () => {
    stock.reload();
    requests.reload();
  };

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
    setPage(1);
  };

  const confirmDelivery = async (req) => {
    setReceiving(req.requestId);
    try {
      await receiveStockRequest(req.requestId);
      refresh();
    } catch (e) {
      window.alert(`Couldn't confirm delivery: ${e.message}`);
    } finally {
      setReceiving(null);
    }
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Stock &amp; Supplies</h1>
          <div className="sub">Monitor levels and raise a restock requisition — Admin approves it</div>
        </div>
      </div>

      <div className="card no-print" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: '10px' }}>
          <input type="text" placeholder="🔍 Search item name or category…" value={filters.search} onChange={setFilter('search')} />
          <select style={{ maxWidth: '140px' }} value={filters.kind} onChange={setFilter('kind')}>
            <option value="">Kind: All</option>
            <option value="medicine">Medicine</option>
            <option value="supply">Supply</option>
          </select>
          <select style={{ maxWidth: '180px' }} value={filters.category} onChange={setFilter('category')}>
            <option value="">Category: All</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={{ maxWidth: '160px' }} value={filters.status} onChange={setFilter('status')}>
            <option value="">Status: All</option>
            <option value="high">High</option>
            <option value="low">Low</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
          <select style={{ maxWidth: '180px' }} value={filters.expiry} onChange={setFilter('expiry')}>
            <option value="">Expiry: All</option>
            <option value="soon">Expiring ≤ 60 days</option>
            <option value="expired">Already expired</option>
            <option value="none">No expiry on file</option>
          </select>
        </div>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="date-range">
            <span>Requisitions from</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setCommitted(draftRange)}>Apply</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <select style={{ maxWidth: '180px' }} value={sort.by} onChange={(e) => setSort({ ...sort, by: e.target.value })}>
              <option value="name">Sort by: Item name</option>
              <option value="quantity">Sort by: Quantity</option>
            </select>
            <select style={{ maxWidth: '120px' }} value={sort.order} onChange={(e) => setSort({ ...sort, order: e.target.value })}>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => openModal('stockItem', { onSuccess: refresh })}>
              ＋ Add / Restock Item
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => openModal('requestRestock', { onSuccess: refresh })}>
              Create restock requisition
            </button>
          </div>
        </div>
      </div>

      <div className="kpi-row five">
        <div className="kpi">
          <div className="label">Items Tracked</div>
          <div className="value">{stock.loading ? '…' : counts.total}</div>
          <div className="foot">{counts.medicine} medicines · {counts.supply} supplies</div>
        </div>
        <div className="kpi">
          <div className="label">High</div>
          <div className="value" style={{ color: 'var(--green)' }}>{counts.high}</div>
          <div className="foot">Above reorder level</div>
        </div>
        <div className="kpi warn">
          <div className="label">Low</div>
          <div className="value">{counts.low}</div>
          <div className="foot">At or below reorder level</div>
        </div>
        <div className="kpi pending">
          <div className="label">Out of Stock</div>
          <div className="value">{counts.out_of_stock}</div>
          <div className="foot">Reorder immediately</div>
        </div>
        <div className="kpi warn">
          <div className="label">Expiring ≤ 60 days</div>
          <div className="value">{counts.expiring}</div>
          <div className="foot">Check before dispensing</div>
        </div>
      </div>

      {stock.error && <div className="login-error">{stock.error}</div>}

      <div className="card" style={{ padding: '18px 20px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Inventory Stock Monitor</h3>
            <div className="sub">Live high / low / out-of-stock badges</div>
          </div>
        </div>

        <div className="table-card" style={{ margin: '0 -20px' }}>
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Kind</th><th>Category</th><th>Quantity</th>
                <th>Reorder Level</th><th>Expiry</th><th>Updated By</th>
                <th>Status</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stock.loading ? (
                <tr><td colSpan={9} className="sub empty-cell">Loading inventory…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={9} className="sub empty-cell">No items found.</td></tr>
              ) : (
                pageRows.map((i) => {
                  const status = STOCK_STATUS[i.stockStatus] || { label: i.stockStatus, pill: '' };
                  const days = daysToExpiry(i);
                  return (
                    <tr key={`${i.itemType}:${i.itemId}`}>
                      <td className="nm">{i.name}</td>
                      <td><span className={`pill ${i.itemType === 'medicine' ? 'senior-badge' : 'pwd-badge'}`}>{i.itemType}</span></td>
                      <td>{dash(i.categoryName)}</td>
                      <td>{formatQty(i.quantity)} {i.unit}</td>
                      <td>{formatQty(i.reorderLevel)}</td>
                      <td className="nowrap">
                        {i.expiryDate ? i.expiryDate.slice(0, 7) : '—'}
                        {days != null && days <= 60 && (
                          <div className="sub" style={{ color: 'var(--amber)' }}>
                            {days < 0 ? 'expired' : `in ${days}d`}
                          </div>
                        )}
                      </td>
                      <td className="sub">{dash(i.updatedByName)}</td>
                      <td><span className={`pill ${status.pill}`}>{status.label}</span></td>
                      <td className="no-print nowrap">
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('stockItem', { item: i, onSuccess: refresh })}>Edit</button>{' '}
                        {i.stockStatus !== 'high' && (
                          <button className="btn btn-outline btn-sm" onClick={() => openModal('requestRestock', { item: i, onSuccess: refresh })}>Request</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          perPage={perPage}
          total={rows.length}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div className="card-head">
          <div>
            <h3>My Requisitions</h3>
            <div className="sub">Sent to Admin for approval, then received at the clinic door</div>
          </div>
        </div>

        {requests.error && <div className="login-error">{requests.error}</div>}

        <div className="table-card" style={{ margin: '0 -20px -18px' }}>
          <table>
            <thead>
              <tr>
                <th>Request</th><th>Items</th><th>Sent</th>
                <th>Approved By</th><th>Status</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.loading ? (
                <tr><td colSpan={6} className="sub empty-cell">Loading…</td></tr>
              ) : myRequests.length === 0 ? (
                <tr><td colSpan={6} className="sub empty-cell">No requisitions raised yet.</td></tr>
              ) : (
                myRequests.map((r) => {
                  const at = requestDate(r);
                  return (
                    <tr key={r.requestId}>
                      <td className="nm">{r.requestNumber || `REQ-${r.requestId}`}</td>
                      <td>{r.items.map((i) => `${i.itemName} ×${formatQty(i.approvedQuantity ?? i.requestedQuantity)}`).join(', ')}</td>
                      <td className="nowrap">{at ? formatDate(parseApiDate(at)) : '—'}</td>
                      <td>{dash(r.approvedByName)}</td>
                      <td><span className={`pill ${STATUS_PILL[r.status] || ''}`}>{r.status}</span></td>
                      <td className="no-print nowrap">
                        {r.status === 'approved' ? (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={receiving === r.requestId}
                            onClick={() => confirmDelivery(r)}
                          >
                            {receiving === r.requestId ? 'Saving…' : 'Confirm delivery'}
                          </button>
                        ) : (
                          <span className="sub">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
