import { useMemo, useState } from 'react';
import { useApp } from '../../context/useApp';
import { useAsync } from '../../hooks/useAsync';
import { useVisitsInRange } from '../../hooks/useVisits';
import { listUsers } from '../../api/users';
import { listStock, listStockRequests } from '../../api/stock';
import { getSettings } from '../../api/settings';
import { listAuditLogs } from '../../api/audit';
import { addDays, clinicDay, formatDate, parseApiDate, presetRange } from '../../lib/time';
import { rowsFrom, summarize, tally } from '../../lib/insights';
import { AUDIT_ACTIONS } from '../../lib/audit';
import { BarChart, DonutLegend } from '../../components/Charts';
import {
  BusiestHoursCard, ClientBreakdownCard, ComplaintsCard, DepartmentsCard, MedicinesCard, MonthlyVisitsCard,
  WeekdayCard,
} from '../../components/InsightCards';
import Icon from '../../components/Icon';
import QuickLinks from '../../components/QuickLinks';

const today = clinicDay(new Date());
const shortDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short', day: 'numeric' });

const QUICK_LINKS = [
  { view: 'stock-requests', label: 'Stock requests', icon: 'clipboardCheck' },
  { view: 'users', label: 'User management', icon: 'users' },
  { view: 'reports', label: 'Reports', icon: 'chart' },
  { view: 'audit-log', label: 'Audit log', icon: 'history' },
  { view: 'full-lists', label: 'Full lists', icon: 'list' },
  { view: 'settings', label: 'Backup & recovery', icon: 'cloudUp' },
];

const STOCK_COLORS = { high: '#107a6b', low: '#d9a13b', out_of_stock: '#c0392b' };
const STOCK_LABELS = { high: 'In stock', low: 'Low', out_of_stock: 'Out of stock' };

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

  const weekFrom = addDays(today, -6);
  const users = useAsync(() => listUsers(), []);
  const requests = useAsync(() => listStockRequests({ perPage: 200 }), []);
  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const settings = useAsync(() => getSettings(), []);
  const audit = useAsync(() => listAuditLogs({ dateFrom: range.from, dateTo: range.to, perPage: 200 }), [range.from, range.to]);
  const weekAudit = useAsync(() => listAuditLogs({ action: 'login', dateFrom: weekFrom, dateTo: today, perPage: 200 }), [weekFrom]);
  const visits = useVisitsInRange(range.from, range.to);
  const semesterQ = useVisitsInRange(addDays(today, -179), today);

  const userList = users.data?.items || [];
  const active = userList.filter((u) => u.status === 'active').length;
  const pending = (requests.data?.items || []).filter((r) => r.status === 'pending');
  const stockItems = useMemo(() => stock.data?.items || [], [stock.data]);
  const needsAttention = stockItems.filter((i) => i.stockStatus !== 'high').length;

  const stats = useMemo(() => summarize(visits.visits), [visits.visits]);
  const rangeLabel = `${formatDate(new Date(`${range.from}T00:00:00Z`))} – ${formatDate(new Date(`${range.to}T00:00:00Z`))}`;
  const semester = useMemo(() => summarize(semesterQ.visits), [semesterQ.visits]);

  const stockRows = useMemo(
    () => rowsFrom(tally(stockItems, (i) => STOCK_LABELS[i.stockStatus]))
      .map((r) => ({ ...r, color: STOCK_COLORS[Object.keys(STOCK_LABELS).find((k) => STOCK_LABELS[k] === r.name)] })),
    [stockItems],
  );

  // One bar per day of the past week, zero-filled.
  const signIns = useMemo(() => {
    const counts = tally(weekAudit.data?.items || [], (e) => clinicDay(parseApiDate(e.at)));
    const bars = [];
    for (let d = weekFrom; d <= today; d = addDays(d, 1)) {
      bars.push({ label: shortDay.format(new Date(`${d}T12:00:00Z`)), value: counts.get(d) || 0 });
    }
    return bars;
  }, [weekAudit.data, weekFrom]);
  const weekSignIns = signIns.reduce((sum, b) => sum + b.value, 0);

  const activityRows = useMemo(
    () => rowsFrom(tally(audit.data?.items || [], (e) => AUDIT_ACTIONS[e.action]?.label || e.action))
      .map((r) => ({ ...r, color: Object.values(AUDIT_ACTIONS).find((a) => a.label === r.name)?.color || r.color })),
    [audit.data],
  );

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
            <div className="foot">Backup and restore in Settings</div>
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
            <div className="foot">{stock.error ? 'Unavailable' : `of ${stockItems.length} items (${stockItems.length ? Math.round((needsAttention / stockItems.length) * 100) : 0}%)`}</div>
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

      <QuickLinks links={QUICK_LINKS} />

      <div className="chart-row">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Sign-in activity</h3>
              <div className="sub">{weekAudit.error ? 'Successful sign-ins per day, past 7 days' : `${weekSignIns} successful sign-ins in the past 7 days`}</div>
            </div>
            <button className="btn btn-soft btn-sm no-print" onClick={() => navigate('audit-log')}>Open audit log</button>
          </div>
          {weekAudit.error ? (
            <div className="info-note"><Icon name="alert" size={17} /><span>{weekAudit.error}</span></div>
          ) : weekAudit.loading ? (
            <div className="sub">Loading…</div>
          ) : (
            <BarChart bars={signIns} height={210} />
          )}
          <div className="warn-note" style={{ marginTop: 12 }}>
            Accounts lock for {settings.data?.lockoutMinutes ?? 15} minutes after{' '}
            {settings.data?.failedLoginLimit ?? 5} failed attempts.
          </div>
        </div>

        <div className="card">
          <h3>Account activity</h3>
          <div className="card-sub">
            {audit.data ? `${audit.data.total ?? (audit.data.items || []).length} logged actions in the selected range` : 'Logged actions in the selected range'}
          </div>
          {audit.error ? (
            <div className="sub">{audit.error}</div>
          ) : audit.loading ? (
            <div className="sub">Loading…</div>
          ) : (
            <DonutLegend rows={activityRows} centerLabel="actions" />
          )}
        </div>
      </div>

      <div className="chart-row">
        <ComplaintsCard title="Campus complaint summary" rows={stats.complaints} loading={visits.loading} visits={visits.visits} rangeLabel={rangeLabel} />

        <div className="card">
          <h3>Stock status</h3>
          <div className="card-sub">{stockItems.length} medicines and supplies on hand</div>
          {stock.error ? <div className="sub">{stock.error}</div> : stock.loading ? <div className="sub">Loading…</div> : (
            <DonutLegend rows={stockRows} centerLabel="items" />
          )}
        </div>
      </div>

      <div className="section-title">
        <h2>Clinic insights</h2>
        <span>{rangeLabel} · {stats.total} visits</span>
      </div>

      <div className="chart-flow">
        <MonthlyVisitsCard perMonth={semester.perMonth} loading={semesterQ.loading} />
        <ClientBreakdownCard rows={stats.clients} loading={visits.loading} />
        <BusiestHoursCard bars={stats.byHour} loading={visits.loading} />
        <WeekdayCard bars={stats.byWeekday} loading={visits.loading} />
        <DepartmentsCard rows={stats.departments} loading={visits.loading} />
        <MedicinesCard rows={stats.medicines} loading={visits.loading} />
      </div>
    </div>
  );
}
