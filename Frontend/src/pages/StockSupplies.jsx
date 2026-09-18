import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests, receiveStockRequest } from '../api/stock';
import { formatDate, parseApiDate } from '../lib/time';
import { formatQty, STOCK_STATUS } from '../lib/format';

const TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'high', label: 'High Stock' },
  { id: 'low', label: 'Low Stock' },
  { id: 'out_of_stock', label: 'Out of Stock' },
];

export default function StockSupplies() {
  const { openModal } = useApp();
  const stock = useAsync(() => listStock(), []);
  // Approved requests are waiting on the supplier — the nurse confirms delivery here.
  const approved = useAsync(() => listStockRequests({ status: 'approved' }), []);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [receiving, setReceiving] = useState(null);

  const items = useMemo(() => stock.data?.items || [], [stock.data]);
  const counts = useMemo(() => {
    const c = { all: items.length, high: 0, low: 0, out_of_stock: 0 };
    for (const i of items) c[i.stockStatus] = (c[i.stockStatus] || 0) + 1;
    return c;
  }, [items]);
  const categories = useMemo(() => [...new Set(items.map((i) => i.categoryName).filter(Boolean))].sort(), [items]);

  const rows = items.filter((i) => {
    if (tab !== 'all' && i.stockStatus !== tab) return false;
    if (category && i.categoryName !== category) return false;
    const q = search.trim().toLowerCase();
    return !q || [i.name, i.categoryName, i.updatedByName].some((s) => s && s.toLowerCase().includes(q));
  });

  const refresh = () => {
    stock.reload();
    approved.reload();
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

  const awaiting = approved.data?.items || [];

  return (
    <div className="view active">
      <div className="page-head">
        <div><h1>Stock &amp; Supplies</h1><div className="sub">{items.length} items tracked · Live clinic inventory</div></div>
        <div className="head-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openModal('requestRestock', { onSuccess: refresh })}>📢 Request Restock</button>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('stockItem', { onSuccess: refresh })}>＋ Add / Restock Item</button>
        </div>
      </div>

      {awaiting.length > 0 && (
        <div className="card">
          <h3>Approved — Awaiting Delivery</h3>
          <table>
            <thead><tr><th>Items</th><th>Approved</th><th>Requested By</th><th></th></tr></thead>
            <tbody>
              {awaiting.map((r) => (
                <tr key={r.requestId}>
                  <td className="nm">{r.items.map((i) => `${i.itemName} × ${formatQty(i.approvedQuantity ?? i.requestedQuantity)} ${i.unit}`).join(', ')}</td>
                  <td className="sub">{r.approvedAt ? formatDate(parseApiDate(r.approvedAt)) : '—'}{r.approvedByName ? ` · ${r.approvedByName}` : ''}</td>
                  <td className="sub">{r.requestedByName}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-primary btn-sm" disabled={receiving === r.requestId} onClick={() => confirmDelivery(r)}>
                      {receiving === r.requestId ? 'Saving…' : '✓ Confirm Delivery'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label} ({counts[t.id] || 0})
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input type="text" placeholder="Search items or medicine..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: '160px' }}>
          <option value="">Category: All</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {stock.error && <div className="login-error">{stock.error}</div>}

      <div className="card table-card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr><th>Item</th><th>Category</th><th>Qty / Unit</th><th>Reorder Level</th><th>Added By</th><th>Expiry</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {stock.loading ? (
              <tr><td colSpan={8} className="sub empty-cell">Loading inventory…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="sub empty-cell">No items found.</td></tr>
            ) : (
              rows.map((i) => {
                const status = STOCK_STATUS[i.stockStatus] || { label: i.stockStatus, pill: '' };
                return (
                  <tr key={`${i.itemType}:${i.itemId}`}>
                    <td className="nm">{i.name}</td>
                    <td>{i.categoryName || '—'}</td>
                    <td>{formatQty(i.quantity)} {i.unit}</td>
                    <td>{formatQty(i.reorderLevel)} {i.unit}</td>
                    <td className="sub">{i.updatedByName || '—'}</td>
                    <td>{i.expiryDate ? i.expiryDate.slice(0, 7) : 'N/A'}</td>
                    <td><span className={`pill ${status.pill}`}>{status.label}</span></td>
                    <td>
                      {i.stockStatus === 'high' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('stockItem', { item: i, onSuccess: refresh })}>Edit</button>
                      )}
                      {i.stockStatus === 'low' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal('requestRestock', { item: i, onSuccess: refresh })}>Request</button>
                      )}
                      {i.stockStatus === 'out_of_stock' && (
                        <button className="btn btn-danger btn-sm" onClick={() => openModal('requestRestock', { item: i, onSuccess: refresh })}>Request Restock</button>
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
  );
}
