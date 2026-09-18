import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { addDays, clinicDay, formatDate, parseApiDate, presetRange, weekdayOf } from '../lib/time';
import { isOpenVisit } from '../lib/format';
import { REFERRAL_DISPOSITIONS } from '../api/lookups';
import { listStock } from '../api/stock';
import { topComplaintsFrom } from '../lib/insights';

const today = clinicDay(new Date());
const thisWeek = presetRange('week', today);

function weekdaysBetween(from, to) {
  const days = [];
  for (let d = from; d <= to && days.length < 7; d = addDays(d, 1)) {
    const dow = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (dow >= 1 && dow <= 5) days.push(d);
  }
  return days;
}

export default function NurseDashboard() {
  const { navigate, openModal } = useApp();
  const [preset, setPreset] = useState('today');
  const [range, setRange] = useState(() => presetRange('today', today));

  const applyPreset = (p) => {
    setPreset(p);
    setRange(presetRange(p, today));
  };

  const todayQ = useVisitsInRange(today, today);
  const rangeQ = useVisitsInRange(range.from, range.to);
  // "Weekly Visit Trend" is always the current Mon–Fri, independent of the
  // range picker above (which only drives the Range Total KPI).
  const weekQ = useVisitsInRange(thisWeek.from, thisWeek.to);

  const waitingCheckout = todayQ.visits.filter(isOpenVisit).length;
  const referredToday = todayQ.visits.filter((v) => REFERRAL_DISPOSITIONS.has(v.dispositionName)).length;

  const weeklyTrend = useMemo(() => {
    const byDay = new Map();
    for (const v of weekQ.visits) {
      const day = clinicDay(parseApiDate(v.startedAt));
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }
    const days = weekdaysBetween(thisWeek.from, thisWeek.to);
    const counts = days.map((d) => byDay.get(d) || 0);
    const max = Math.max(1, ...counts);
    return days.map((d, i) => ({
      day: weekdayOf(new Date(`${d}T00:00:00Z`)),
      count: counts[i],
      pct: Math.round((counts[i] / max) * 100),
    }));
  }, [weekQ.visits]);

  const topComplaints = useMemo(() => topComplaintsFrom(rangeQ.visits), [rangeQ.visits]);

  const stock = useAsync(() => listStock(), []);
  const stockItems = stock.data?.items || [];
  const lowStock = stockItems.filter((i) => i.stockStatus === 'low');
  const outStock = stockItems.filter((i) => i.stockStatus === 'out_of_stock');
  const lowOutTotal = lowStock.length + outStock.length;
  const refreshAll = () => {
    todayQ.reload();
    rangeQ.reload();
    weekQ.reload();
  };

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Nurse Dashboard</h1>
          <div className="sub">ISU Infirmary · {formatDate(new Date(`${today}T00:00:00Z`))}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => openModal('addPatient', { onSuccess: refreshAll })}>＋ Add Patient Record</button>
      </div>

      <div className="range-bar">
        <div className="presets">
          <button className={preset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>Today</button>
          <button className={preset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>This Week</button>
          <button className={preset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>This Month</button>
        </div>
        <div className="divider" style={{ width: '1px', height: '22px', background: 'var(--line)' }}></div>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>From</label>
        <input
          type="date"
          value={range.from}
          onChange={(e) => { setPreset('custom'); setRange((r) => ({ ...r, from: e.target.value })); }}
          style={{ maxWidth: '145px' }}
        />
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
        <input
          type="date"
          value={range.to}
          onChange={(e) => { setPreset('custom'); setRange((r) => ({ ...r, to: e.target.value })); }}
          style={{ maxWidth: '145px' }}
        />
        <div className="live-note"><span className="dot"></span>Auto-updates on change</div>
      </div>

      {rangeQ.error && (
        <div className="alert-banner" style={{ background: 'var(--red-bg)', borderColor: 'var(--red-line)' }}>
          <span className="ic" style={{ color: 'var(--red)' }}>⚠</span>
          <div className="txt"><strong style={{ color: 'var(--red)' }}>Couldn't reach the server</strong><span style={{ color: 'var(--red)' }}>{rangeQ.error}</span></div>
        </div>
      )}

      <div className="kpi-row">
        <div className="kpi primary" onClick={() => navigate('visit-hub')}>
          <div className="ic-badge">🩺</div>
          <div className="label">Today's Visits</div>
          <div className="value">{todayQ.loading ? '…' : todayQ.visits.length}</div>
          <div className="foot">{waitingCheckout} Waiting Check-Out</div>
        </div>
        <div className="kpi" onClick={() => navigate('visit-hub')}>
          <div className="ic-badge">📈</div>
          <div className="label">Range Total</div>
          <div className="value">{rangeQ.loading ? '…' : rangeQ.visits.length}</div>
          <div className="foot">{formatDate(new Date(`${range.from}T00:00:00Z`))} – {formatDate(new Date(`${range.to}T00:00:00Z`))}</div>
        </div>
        <div className="kpi" onClick={() => navigate('visit-hub')}>
          <div className="ic-badge">⚠</div>
          <div className="label">Referred Today</div>
          <div className="value">{todayQ.loading ? '…' : referredToday}</div>
          <div className="foot">To hospital/doctor</div>
        </div>
        <div className="kpi warn" onClick={() => navigate('stock')}>
          <div className="ic-badge">🧪</div>
          <div className="label">Low / Out of Stock</div>
          <div className="value">{stock.loading ? '…' : stock.error ? '—' : lowOutTotal}</div>
          <div className="foot">{stock.error ? 'Inventory unavailable' : `${lowStock.length} Low · ${outStock.length} Out of Stock`}</div>
        </div>
      </div>

      {lowOutTotal > 0 && (
        <div className="alert-banner">
          <span className="ic">⚠</span>
          <div className="txt">
            <strong>{lowOutTotal} stock item{lowOutTotal > 1 ? 's' : ''} need{lowOutTotal > 1 ? '' : 's'} restocking</strong>
            <span>
              {outStock.length > 0
                ? `${outStock.map((i) => i.name).join(', ')} ${outStock.length > 1 ? 'are' : 'is'} Out of Stock.`
                : `${lowStock.map((i) => i.name).join(', ')} ${lowStock.length > 1 ? 'are' : 'is'} running low.`}
            </span>
          </div>
          <button className="go" onClick={() => openModal('requestRestock', { item: outStock[0] || lowStock[0], onSuccess: stock.reload })}>Request Restock to Admin →</button>
        </div>
      )}

      <div className="chart-row">
        <div className="card">
          <h3>Weekly Visit Trend</h3>
          <div className="bars">
            {weekQ.loading ? (
              <div className="sub">Loading…</div>
            ) : (
              weeklyTrend.map((d) => (
                <div className="bar-col" key={d.day}>
                  <span className="num">{d.count}</span>
                  <div className="bar" style={{ height: `${Math.max(d.pct, 3)}%` }}></div>
                  <span className="lbl">{d.day}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <h3>Top Complaints</h3>
          {topComplaints.length === 0 ? (
            <div className="sub">No visits recorded in this range yet.</div>
          ) : (
            <div className="donut-wrap">
              <svg width="100" height="100" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e3f3ef" strokeWidth="6"></circle>
                {topComplaints.map((c) => (
                  <circle
                    key={c.name}
                    cx="21" cy="21" r="15.9" fill="transparent"
                    stroke={c.color} strokeWidth="6"
                    strokeDasharray={c.dasharray} strokeDashoffset={c.dashoffset}
                  ></circle>
                ))}
              </svg>
              <div className="donut-legend">
                {topComplaints.map((c) => (
                  <div className="legend-row" key={c.name}>
                    <span className="sw" style={{ background: c.color }}></span>
                    <span className="name">{c.name}</span>
                    <span className="pct">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
