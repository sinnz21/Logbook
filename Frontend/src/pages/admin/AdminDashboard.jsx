import { useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { useVisitsInRange } from '../../hooks/useVisits';
import { listUsers } from '../../api/users';
import { listStock, listStockRequests } from '../../api/stock';
import { getSettings } from '../../api/settings';
import { clinicDay, formatDate, presetRange } from '../../lib/time';
import { topComplaintsFrom } from '../../lib/insights';
import { notConnected } from '../../lib/notConnected';

const today = clinicDay(new Date());

const REPORTS = [
  { name: 'Monthly Supply Report', cadence: 'Generated at the start of every month' },
  { name: 'Medicine Restock Cycle Report', cadence: 'Audited every 1–2 months' },
  { name: 'System & Account Activity Report', cadence: 'Generated at the start of every month' },
];

export default function AdminDashboard() {
  const { navigate } = useApp();
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(() => presetRange('month', today));
  const [draft, setDraft] = useState(range);

  const applyPreset = (p) => {
    const next = presetRange(p, today);
    setPreset(p);
    setRange(next);
    setDraft(next);
  };

  const users = useAsync(() => listUsers(), []);
  const requests = useAsync(() => listStockRequests({ perPage: 200 }), []);
  const stock = useAsync(() => listStock(), []);
  const settings = useAsync(() => getSettings(), []);
  const visits = useVisitsInRange(range.from, range.to);

  const userList = users.data?.items || [];
  const active = userList.filter((u) => u.status === 'active').length;
  const pending = (requests.data?.items || []).filter((r) => r.status === 'pending');
  const stockItems = stock.data?.items || [];
  const needsAttention = stockItems.filter((i) => i.stockStatus !== 'high').length;

  const complaints = useMemo(() => topComplaintsFrom(visits.visits, { limit: 5 }), [visits.visits]);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Admin Dashboard</h1>
          <div className="sub">
            ISU Infirmary · {formatDate(new Date(`${today}T00:00:00Z`))} · system oversight
          </div>
        </div>
      </div>

      <div className="range-bar no-print">
        <div className="presets">
          <button className={preset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>Today</button>
          <button className={preset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>This Week</button>
          <button className={preset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>This Month</button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>From</span>
        <input type="date" value={draft.from} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }} style={{ maxWidth: '150px' }} />
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
        <input type="date" value={draft.to} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }} style={{ maxWidth: '150px' }} />
        <button className="btn btn-primary btn-sm" onClick={() => setRange(draft)}>Apply</button>
      </div>

      <div className="kpi-row">
        <div className="kpi" onClick={() => navigate('settings')}>
          <div className="label">Automated Backups</div>
          <div className="value" style={{ fontSize: '19px' }}>
            {settings.loading ? '…' : settings.error ? '—' : settings.data?.autoBackupEnabled ? 'On' : 'Off'}
          </div>
          <div className="foot">Manage in Settings</div>
        </div>
        <div className="kpi" onClick={() => navigate('users')}>
          <div className="label">Active Accounts</div>
          <div className="value">{users.loading ? '…' : users.error ? '—' : active}</div>
          <div className="foot">
            {users.error ? 'Unavailable' : `${active} active · ${userList.length - active} inactive`}
          </div>
        </div>
        <div className="kpi warn" onClick={() => navigate('stock-requests')}>
          <div className="label">Stock Needing Attention</div>
          <div className="value">{stock.loading ? '…' : stock.error ? '—' : needsAttention}</div>
          <div className="foot">Low or out of stock</div>
        </div>
        <div className="kpi pending" onClick={() => navigate('stock-requests')}>
          <div className="label">Pending Requisitions</div>
          <div className="value">{requests.loading ? '…' : requests.error ? '—' : pending.length}</div>
          <div className="foot">Waiting for your approval</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <h3>Sign-in Activity</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Successful sign-ins per day this week</div>
          <div className="info-note">
            This chart needs a sign-in audit endpoint, which the backend doesn&rsquo;t expose yet —
            see the &ldquo;System &amp; Account Activity&rdquo; section of BACKEND_REQUIREMENTS.md.
          </div>
          <div className="sub" style={{ marginTop: '10px' }}>
            Accounts lock for {settings.data?.lockoutMinutes ?? 15} minutes after{' '}
            {settings.data?.failedLoginLimit ?? 5} failed attempts.
          </div>
        </div>

        <div className="card">
          <h3>Campus Complaint Summary</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Read-only — recorded by the nurses</div>
          {visits.error && <div className="login-error">{visits.error}</div>}
          {complaints.length === 0 ? (
            <div className="sub">{visits.loading ? 'Loading…' : 'No visits recorded in this range.'}</div>
          ) : (
            <div className="hbar-list">
              {complaints.map((c) => (
                <div className="hbar" key={c.name}>
                  <span className="name">{c.name}</span>
                  <span className="track"><span className="fill" style={{ width: `${c.pct}%`, background: c.color }} /></span>
                  <span className="pct">{c.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Reports</h3>
        <div className="cadence-note">
          Supply reports generate monthly. Medicine stock is audited every 1–2 months — when the due
          date arrives, a restock is needed.
        </div>
        {REPORTS.map((r) => (
          <div className="settings-row" key={r.name}>
            <div>
              <div className="t">{r.name}</div>
              <div className="d">{r.cadence}</div>
            </div>
            <button
              className="btn btn-outline btn-sm no-print"
              onClick={() => notConnected(r.name, 'the report template isn\'t built yet')}
            >
              Generate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
