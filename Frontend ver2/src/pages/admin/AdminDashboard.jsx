import { useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { useVisitsInRange } from '../../hooks/useVisits';
import { listUsers } from '../../api/users';
import { listStock, listStockRequests } from '../../api/stock';
import { getSettings } from '../../api/settings';
import { clinicDay, formatDate, presetRange } from '../../lib/time';
import { topComplaintsFrom } from '../../lib/insights';
import { HBars } from '../../components/Charts';
import Icon from '../../components/Icon';
import { notConnected } from '../../lib/notConnected';

const today = clinicDay(new Date());

const REPORTS = [
  { name: 'Monthly supply report', cadence: 'Generated at the start of every month' },
  { name: 'Medicine restock cycle report', cadence: 'Audited every 1 to 2 months' },
  { name: 'System and account activity report', cadence: 'Generated at the start of every month' },
];

export default function AdminDashboard() {
  const { navigate } = useApp();
  const [preset, setPreset] = useState('week');
  const [range, setRange] = useState(() => presetRange('week', today));
  const [draft, setDraft] = useState(range);

  const applyPreset = (p) => {
    const next = presetRange(p, today);
    setPreset(p);
    setRange(next);
    setDraft(next);
  };

  const users = useAsync(() => listUsers(), []);
  const requests = useAsync(() => listStockRequests({ perPage: 200 }), []);
  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const settings = useAsync(() => getSettings(), []);
  const visits = useVisitsInRange(range.from, range.to);

  const userList = users.data?.items || [];
  const active = userList.filter((u) => u.status === 'active').length;
  const pending = (requests.data?.items || []).filter((r) => r.status === 'pending');
  const needsAttention = (stock.data?.items || []).filter((i) => i.stockStatus !== 'high').length;

  const complaints = useMemo(() => topComplaintsFrom(visits.visits, { limit: 4 }), [visits.visits]);

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Admin dashboard</h1>
          <div className="sub">ISU Infirmary, {formatDate(new Date(`${today}T00:00:00Z`))}, system oversight</div>
        </div>
        <div className="range-bar no-print">
          <div className="segmented solid">
            <button className={preset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>Today</button>
            <button className={preset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>This week</button>
            <button className={preset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>This month</button>
          </div>
          <div className="date-chip">
            <Icon name="calendar" size={17} />
            <input type="date" style={{ border: 'none', padding: 0, width: 120 }} value={draft.from}
              onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }} />
            <span style={{ color: 'var(--muted)' }}>–</span>
            <input type="date" style={{ border: 'none', padding: 0, width: 120 }} value={draft.to}
              onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }} />
          </div>
          <button className="btn btn-soft" onClick={() => setRange(draft)}>Apply</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi with-icon clickable" onClick={() => navigate('settings')}>
          <div className="ic-badge"><Icon name="cloudUp" size={24} /></div>
          <div>
            <div className="value" style={{ fontSize: 24 }}>
              {settings.loading ? '…' : settings.error ? '—' : settings.data?.autoBackupEnabled ? 'On' : 'Off'}
            </div>
            <div className="label">Automated backups</div>
            <div className="foot">Manage in Settings</div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('users')}>
          <div className="ic-badge blue"><Icon name="users" size={24} /></div>
          <div>
            <div className="value">{users.loading ? '…' : users.error ? '—' : active}</div>
            <div className="label">Active accounts</div>
            <div className="foot">{users.error ? 'Unavailable' : `${active} active, ${userList.length - active} inactive`}</div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('stock-requests')}>
          <div className="ic-badge violet"><Icon name="database" size={24} /></div>
          <div>
            <div className="value">{stock.loading ? '…' : stock.error ? '—' : needsAttention}</div>
            <div className="label">Stock needing attention</div>
            <div className="foot">Low or out of stock</div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('stock-requests')}>
          <div className="ic-badge amber"><Icon name="clipboardCheck" size={24} /></div>
          <div>
            <div className="value">{requests.loading ? '…' : requests.error ? '—' : pending.length}</div>
            <div className="label">Pending requisitions</div>
            <div className="foot">Waiting for your approval</div>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <h3>Sign-in activity</h3>
          <div className="card-sub">Successful sign-ins per day this week</div>
          <div className="info-note">
            <Icon name="alert" size={17} />
            <span>
              This chart needs a sign-in audit endpoint, which the backend doesn&rsquo;t expose yet.
              See the System and account activity section of BACKEND_REQUIREMENTS.md.
            </span>
          </div>
          <div className="warn-note" style={{ marginTop: 12 }}>
            Accounts lock for {settings.data?.lockoutMinutes ?? 15} minutes after{' '}
            {settings.data?.failedLoginLimit ?? 5} failed attempts.
          </div>
        </div>

        <div className="card">
          <h3>Campus complaint summary</h3>
          <div className="card-sub">Read-only, recorded by the nurses</div>
          {visits.error && <div className="login-error">{visits.error}</div>}
          {complaints.length === 0 ? (
            <div className="sub">{visits.loading ? 'Loading…' : 'No visits recorded in this range.'}</div>
          ) : (
            <HBars rows={complaints} />
          )}
        </div>
      </div>

      <div className="card">
        <h3>Reports</h3>
        <div className="info-note" style={{ margin: '12px 0 6px' }}>
          <span>
            Supply reports generate monthly. Medicine stock is audited every 1 to 2 months.
            When the due date arrives, a restock is needed.
          </span>
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
