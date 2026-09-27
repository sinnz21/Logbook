import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests, receiveStockRequest } from '../api/stock';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { formatDate, parseApiDate } from '../lib/time';
import { formatQty, STOCK_STATUS } from '../lib/format';

const dash = (v) => v || '—';
const requestDate = (r) => r.requestDate || r.requestedAt || r.createdAt || null;

const STATUS_PILL = { pending: 'amber', approved: 'teal', completed: 'green', denied: 'red' };
const STOCK_PILL = { high: 'green', low: 'amber', out_of_stock: 'red' };

/** Days until an item expires, or null when it has no expiry on file. */
function daysToExpiry(item) {
  if (!item.expiryDate) return null;
  const expiry = new Date(`${item.expiryDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.round((expiry - Date.now()) / 86400000);
}

export default function StockSupplies() {
  const { openModal } = useApp();
  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const requests = useAsync(() => listStockRequests({ perPage: 100 }), []);

  const [filters, setFilters] = useState({ search: '', kind: '', category: '', status: '', expiry: '' });
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [committed, setCommitted] = useState({ dateFrom: '', dateTo: '' });
  const [draftRange, setDraftRange] = useState({ dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [receiving, setReceiving] = useState(null);

  const items = useMemo(() => stock.data?.items || [], [stock.data]);
  const categories = useMemo(() => [...new Set(items.map((i) => i.categoryName).filter(Boolean))].sort(), [items]);

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
    const dir = sort.endsWith('asc') ? 1 : -1;
    return items
      .filter((i) => {
        if (tab !== 'all' && i.stockStatus !== tab) return false;
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
      .sort((a, b) => (sort.startsWith('quantity')
        ? (Number(a.quantity) - Number(b.quantity)) * dir
        : a.name.localeCompare(b.name) * dir));
  }, [items, filters, tab, sort]);

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

  const TABS = [
    ['all', `All ${counts.total}`],
    ['high', `High ${counts.high}`],
    ['low', `Low ${counts.low}`],
    ['out_of_stock', `Out ${counts.out_of_stock}`],
  ];

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Stock and supplies</h1>
          <div className="sub">Monitor levels and raise a restock requisition. The admin approves it.</div>
        </div>
        <div className="head-actions no-print">
          <button className="btn btn-ghost" onClick={() => openModal('stockItem', { onSuccess: refresh })}>
            <Icon name="plus" size={17} /> Add or restock item
          </button>
          <button className="btn btn-primary" onClick={() => openModal('requestRestock', { onSuccess: refresh })}>
            <Icon name="send" size={17} /> Create restock requisition
          </button>
        </div>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="text" placeholder="Search item name or category" value={filters.search} onChange={setFilter('search')} />
          </div>
          <select className="auto" value={filters.kind} onChange={setFilter('kind')}>
            <option value="">Kind: all</option>
            <option value="medicine">Medicine</option>
            <option value="supply">Supply</option>
          </select>
          <select className="auto" value={filters.category} onChange={setFilter('category')}>
            <option value="">Category: all</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="auto" value={filters.status} onChange={setFilter('status')}>
            <option value="">Status: all</option>
            <option value="high">High stock</option>
            <option value="low">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
          <select className="auto" value={filters.expiry} onChange={setFilter('expiry')}>
            <option value="">Expiry: all</option>
            <option value="soon">Expiring in 60 days</option>
            <option value="expired">Already expired</option>
            <option value="none">No expiry on file</option>
          </select>
        </div>
        <div className="filter-row">
          <div className="date-range">
            <span>Requisitions from</span>
            <input type="date" value={draftRange.dateFrom} onChange={(e) => setDraftRange({ ...draftRange, dateFrom: e.target.value })} />
            <span>to</span>
            <input type="date" value={draftRange.dateTo} onChange={(e) => setDraftRange({ ...draftRange, dateTo: e.target.value })} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setCommitted(draftRange)}>Apply</button>
          <div className="spacer" />
          <select className="auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name-asc">Sort: item name, A to Z</option>
            <option value="name-desc">Sort: item name, Z to A</option>
            <option value="quantity-asc">Sort: quantity, lowest</option>
            <option value="quantity-desc">Sort: quantity, highest</option>
          </select>
        </div>
      </div>

      <div className="kpi-row five">
        <div className="kpi">
          <div className="cap ink">Items tracked</div>
          <div className="value">{stock.loading ? '…' : counts.total}</div>
          <div className="foot">{counts.medicine} medicines, {counts.supply} supplies</div>
        </div>
        <div className="kpi">
          <div className="cap green">High stock</div>
          <div className="value">{counts.high}</div>
          <div className="foot">Above reorder level</div>
        </div>
        <div className="kpi">
          <div className="cap amber">Low stock</div>
          <div className="value">{counts.low}</div>
          <div className="foot">At or below reorder level</div>
        </div>
        <div className="kpi">
          <div className="cap red">Out of stock</div>
          <div className="value">{counts.out_of_stock}</div>
          <div className="foot">Reorder immediately</div>
        </div>
        <div className="kpi">
          <div className="cap amber">Expiring in 60 days</div>
          <div className="value">{counts.expiring}</div>
          <div className="foot">Check before dispensing</div>
        </div>
      </div>

      {stock.error && <div className="login-error" style={{ marginBottom: 14 }}>{stock.error}</div>}

      <div className="card" style={{ padding: '20px 22px 6px' }}>
        <div className="card-head">
          <div>
            <h3>Inventory stock monitor</h3>
            <div className="sub">Live high, low and out-of-stock badges</div>
          </div>
          <div className="segmented no-print">
            {TABS.map(([id, label]) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setPage(1); }}>{label}</button>
            ))}
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Item</th><th>Kind</th><th>Category</th><th>Quantity</th>
                <th>Reorder at</th><th>Expiry</th><th>Updated by</th><th>Status</th><th className="no-print" />
              </tr>
            </thead>
            <tbody>
              {stock.loading ? (
                <tr><td colSpan={9} className="empty-cell">Loading inventory…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">No items found.</td></tr>
              ) : (
                pageRows.map((i) => {
                  const status = STOCK_STATUS[i.stockStatus] || { label: i.stockStatus };
                  const days = daysToExpiry(i);
                  const qtyClass = i.stockStatus === 'out_of_stock' ? 'num-red' : i.stockStatus === 'low' ? 'num-amber' : 'nm';
                  return (
                    <tr key={`${i.itemType}:${i.itemId}`}>
                      <td className="nm">{i.name}</td>
                      <td><span className={`pill ${i.itemType === 'medicine' ? 'blue' : 'teal'}`}>{i.itemType === 'medicine' ? 'Medicine' : 'Supply'}</span></td>
                      <td>{dash(i.categoryName)}</td>
                      <td className={qtyClass}>{formatQty(i.quantity)} {i.unit}</td>
                      <td className="sub">{formatQty(i.reorderLevel)}</td>
                      <td className="nowrap">
                        {i.expiryDate ? i.expiryDate.slice(0, 7) : '—'}
                        {days != null && days <= 60 && (
                          <div className="lo" style={{ color: 'var(--amber)', fontSize: 12 }}>
                            {days < 0 ? 'expired' : `in ${days} days`}
                          </div>
                        )}
                      </td>
                      <td className="sub">{dash(i.updatedByName)}</td>
                      <td>
                        <span className={`pill ${STOCK_PILL[i.stockStatus] || 'grey'}`}><span className="dot" />{status.label}</span>
                      </td>
                      <td className="no-print">
                        <div className="cell-actions">
                          <button className="icon-btn" title="Edit or restock" onClick={() => openModal('stockItem', { item: i, onSuccess: refresh })}>
                            <Icon name="pencil" size={16} />
                          </button>
                          {i.stockStatus !== 'high' && (
                            <button className="btn btn-soft btn-sm" onClick={() => openModal('requestRestock', { item: i, onSuccess: refresh })}>
                              Request
                            </button>
                          )}
                        </div>
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

      <div className="card" style={{ padding: '20px 22px' }}>
        <div className="card-head">
          <div>
            <h3>My requisitions</h3>
            <div className="sub">Sent to the admin for approval, then received at the clinic door</div>
          </div>
        </div>

        {requests.error && <div className="login-error" style={{ marginBottom: 14 }}>{requests.error}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr><th>Request</th><th>Items</th><th>Sent</th><th>Approved by</th><th>Status</th><th className="no-print" /></tr>
            </thead>
            <tbody>
              {requests.loading ? (
                <tr><td colSpan={6} className="empty-cell">Loading…</td></tr>
              ) : myRequests.length === 0 ? (
                <tr><td colSpan={6} className="empty-cell">No requisitions raised yet.</td></tr>
              ) : (
                myRequests.map((r) => {
                  const at = requestDate(r);
                  return (
                    <tr key={r.requestId}>
                      <td className="nm">{r.requestNumber || `REQ-${r.requestId}`}</td>
                      <td>{r.items.map((i) => `${i.itemName} × ${formatQty(i.approvedQuantity ?? i.requestedQuantity)}`).join(', ')}</td>
                      <td className="nowrap">{at ? formatDate(parseApiDate(at)) : '—'}</td>
                      <td>{dash(r.approvedByName)}</td>
                      <td><span className={`pill ${STATUS_PILL[r.status] || 'grey'}`}><span className="dot" />{r.status}</span></td>
                      <td className="no-print">
                        <div className="cell-actions">
                          {r.status === 'approved' ? (
                            <button className="btn btn-primary btn-sm" disabled={receiving === r.requestId} onClick={() => confirmDelivery(r)}>
                              {receiving === r.requestId ? 'Saving…' : 'Confirm delivery'}
                            </button>
                          ) : (
                            <button className="btn btn-soft btn-sm" onClick={() => openModal('requestRestock', { request: r, onSuccess: refresh })}>
                              View
                            </button>
                          )}
                        </div>
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
