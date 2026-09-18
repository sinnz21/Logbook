import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { listUsers } from '../../api/users';
import { approveStockRequest, denyStockRequest, listStock, listStockRequests } from '../../api/stock';
import { formatDate, formatTime, parseApiDate } from '../../lib/time';
import { formatQty, STOCK_STATUS } from '../../lib/format';
import { notConnected } from '../../lib/notConnected';

export default function AdminDashboard() {
  const { navigate } = useApp();
  const users = useAsync(() => listUsers(), []);
  const pending = useAsync(() => listStockRequests({ status: 'pending' }), []);
  const stock = useAsync(() => listStock(), []);
  const [busy, setBusy] = useState(null);
  const [resolved, setResolved] = useState({}); // requestId → 'Approved' | 'Denied', shown briefly

  const userList = users.data?.items || [];
  const active = userList.filter((u) => u.status === 'active').length;
  const requests = pending.data?.items || [];
  const stockById = new Map((stock.data?.items || []).map((i) => [`${i.itemType}:${i.itemId}`, i]));

  const resolve = async (req, action) => {
    setBusy(req.requestId);
    try {
      if (action === 'Approved') await approveStockRequest(req.requestId);
      else await denyStockRequest(req.requestId, { adminResponse: 'Denied from Admin Dashboard' });
      setResolved((r) => ({ ...r, [req.requestId]: action }));
      setTimeout(() => pending.reload(), 1200);
    } catch (e) {
      window.alert(`Couldn't update request: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="view active">
      <div className="page-head"><div><h1>Admin Dashboard</h1><div className="sub">Executive &amp; IT Oversight</div></div></div>

      <div className="kpi-row">
        <div className="kpi" onClick={() => navigate('users')}>
          <div className="ic-badge">👥</div><div className="label">Active Accounts</div>
          <div className="value">{users.loading ? '…' : users.error ? '—' : active}</div>
          <div className="foot">{users.error ? 'Unavailable' : `${active} Active · ${userList.length - active} Inactive`}</div>
        </div>
        <div className="kpi warn">
          <div className="ic-badge">🔔</div><div className="label">Restock Requests</div>
          <div className="value">{pending.loading ? '…' : pending.error ? '—' : requests.length}</div>
          <div className="foot">From Duty Nurses</div>
        </div>
        <div className="kpi">
          <div className="ic-badge">🧪</div><div className="label">Low / Out of Stock</div>
          <div className="value">{stock.loading ? '…' : stock.error ? '—' : (stock.data?.items || []).filter((i) => i.stockStatus !== 'high').length}</div>
          <div className="foot">Across medicines &amp; supplies</div>
        </div>
        <div className="kpi" onClick={() => navigate('settings')}>
          <div className="ic-badge">💾</div><div className="label">Backups</div>
          <div className="value" style={{ fontSize: '16px' }}>Settings</div>
          <div className="foot">Backup &amp; retention options</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Nurse Restock Requests (Out of Stock / Low Supplies)</h3>
          <span className="sub">Action required to approve procurement</span>
        </div>
        {pending.error && <div className="login-error">{pending.error}</div>}
        <table>
          <thead>
            <tr><th>Requested Item</th><th>Category</th><th>Requested Qty</th><th>Urgency</th><th>Requested By</th><th>Action</th></tr>
          </thead>
          <tbody>
            {pending.loading ? (
              <tr><td colSpan={6} className="sub empty-cell">Loading…</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="sub empty-cell">No pending requests.</td></tr>
            ) : (
              requests.map((r) => {
                if (resolved[r.requestId]) {
                  return (
                    <tr key={r.requestId} style={{ opacity: 0.5 }}>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--teal-700)', fontWeight: 700 }}>Request has been {resolved[r.requestId]}</td>
                    </tr>
                  );
                }
                const first = r.items[0] || {};
                const live = stockById.get(`${first.itemType}:${first.itemId}`);
                const status = live && STOCK_STATUS[live.stockStatus];
                const at = parseApiDate(r.requestDate);
                return (
                  <tr key={r.requestId}>
                    <td className="nm">
                      {r.items.map((i) => i.itemName).join(', ')}
                      {r.remarks && <div className="sub">{r.remarks}</div>}
                    </td>
                    <td>{first.categoryName || '—'}</td>
                    <td>{r.items.map((i) => `${formatQty(i.requestedQuantity)} ${i.unit}`).join(', ')}</td>
                    <td>
                      {status ? <span className={`pill ${status.pill}`}>{status.label}</span> : <span className="sub">{first.reason || '—'}</span>}
                    </td>
                    <td className="sub">{r.requestedByName} ({formatDate(at)} {formatTime(at)})</td>
                    <td className="nowrap">
                      <button className="btn btn-primary btn-sm" disabled={busy === r.requestId} onClick={() => resolve(r, 'Approved')}>✓ Accept</button>{' '}
                      <button className="btn btn-ghost btn-sm" disabled={busy === r.requestId} onClick={() => resolve(r, 'Denied')}>✕ Deny</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="modal-note" style={{ marginTop: '10px' }}>
          Accepted requests appear on the nurse's Stock &amp; Supplies screen; stock is added when they confirm the delivery arrived.
        </div>
      </div>

      <div className="card">
        <h3>Monthly Reporting Cadence</h3>
        <div className="cadence-note">Supply reports generate monthly · Medicine stock is audited every 2–3 months.</div>
        <table>
          <tbody>
            <tr>
              <td><div className="nm">Monthly Supply Report</div><div className="sub">Due the 1st of every month</div></td>
              <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm" onClick={() => notConnected('Monthly Supply Report', 'the report template isn\'t built yet')}>Generate</button></td>
            </tr>
            <tr>
              <td><div className="nm">Medicine Release Cycle Report</div><div className="sub">Every 2–3 months</div></td>
              <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm" onClick={() => notConnected('Medicine Release Cycle Report', 'the report template isn\'t built yet')}>Generate</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
