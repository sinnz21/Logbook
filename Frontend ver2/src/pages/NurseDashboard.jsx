import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { addDays, clinicDay, formatDate, formatTime, parseApiDate, presetRange } from '../lib/time';
import { formatQty, isOpenVisit, initialsOf, VISIT_STATUS } from '../lib/format';
import { REFERRAL_DISPOSITIONS } from '../api/lookups';
import { listStock } from '../api/stock';
import { topComplaintsFrom } from '../lib/insights';
import { Donut, HBars, LineChart } from '../components/Charts';
import Icon from '../components/Icon';

const today = clinicDay(new Date());
const shortDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' });

const TREND_WINDOWS = {
  '7 days': 7,
  '30 days': 30,
  Semester: 180,
};

/** One point per clinic day across the window — the design's daily trend line. */
function dailyTrend(visits, days) {
  const counts = new Map();
  for (const v of visits) {
    const day = clinicDay(parseApiDate(v.startedAt));
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  const from = addDays(today, -(days - 1));
  const points = [];
  for (let d = from; d <= today; d = addDays(d, 1)) {
    points.push({
      label: shortDay.format(new Date(`${d}T00:00:00Z`)),
      value: counts.get(d) || 0,
    });
  }
  return points;
}

/** "Top 5 most requested medicine" — units dispensed across the range. */
function topMedicines(visits, limit = 5) {
  const counts = new Map();
  for (const v of visits) {
    for (const m of v.medicines || []) {
      counts.set(m.medicineName, (counts.get(m.medicineName) || 0) + (Number(m.quantityGiven) || 0));
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!sorted.length) return [];
  const max = Math.max(...sorted.map(([, n]) => n));
  return sorted.map(([name, count]) => ({ name, count, width: Math.round((count / max) * 100) }));
}

export default function NurseDashboard() {
  const { navigate } = useApp();
  const [preset, setPreset] = useState('today');
  const [range, setRange] = useState(() => presetRange('today', today));
  const [draft, setDraft] = useState(() => presetRange('today', today));
  const [trendWindow, setTrendWindow] = useState('30 days');
  const [queueSort, setQueueSort] = useState('time-in');
  const [now] = useState(() => new Date());

  const applyPreset = (p) => {
    const next = presetRange(p, today);
    setPreset(p);
    setRange(next);
    setDraft(next);
  };

  const todayQ = useVisitsInRange(today, today);
  const rangeQ = useVisitsInRange(range.from, range.to);
  // The trend line has its own window, independent of the range picker above.
  const trendDays = TREND_WINDOWS[trendWindow];
  const trendQ = useVisitsInRange(addDays(today, -(trendDays - 1)), today);

  const inCare = todayQ.visits.filter(isOpenVisit).length;
  const referredToday = todayQ.visits.filter((v) => REFERRAL_DISPOSITIONS.has(v.dispositionName)).length;

  const trend = useMemo(() => dailyTrend(trendQ.visits, trendDays), [trendQ.visits, trendDays]);
  const complaints = useMemo(() => topComplaintsFrom(rangeQ.visits, { limit: 4 }), [rangeQ.visits]);
  const medicines = useMemo(() => topMedicines(rangeQ.visits), [rangeQ.visits]);

  const queue = useMemo(() => {
    const list = [...todayQ.visits];
    return list.sort((a, b) =>
      queueSort === 'name'
        ? a.patientName.localeCompare(b.patientName)
        : parseApiDate(b.startedAt) - parseApiDate(a.startedAt));
  }, [todayQ.visits, queueSort]);

  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  const stockItems = stock.data?.items || [];
  const lowStock = stockItems.filter((i) => i.stockStatus === 'low');
  const outStock = stockItems.filter((i) => i.stockStatus === 'out_of_stock');
  const needsAttention = lowStock.length + outStock.length;

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Nurse dashboard</h1>
          <div className="sub">ISU Infirmary, {formatDate(new Date(`${today}T00:00:00Z`))}</div>
        </div>

        <div className="range-bar no-print">
          <div className="segmented solid">
            <button className={preset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>Today</button>
            <button className={preset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>This week</button>
            <button className={preset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>This month</button>
          </div>
          <div className="date-chip">
            <Icon name="calendar" size={17} />
            <input
              type="date"
              className="auto"
              style={{ border: 'none', padding: 0, width: '120px' }}
              value={draft.from}
              onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }}
            />
            <span style={{ color: 'var(--muted)' }}>–</span>
            <input
              type="date"
              className="auto"
              style={{ border: 'none', padding: 0, width: '120px' }}
              value={draft.to}
              onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }}
            />
          </div>
          <button className="btn btn-soft" onClick={() => setRange(draft)}>Apply</button>
        </div>
      </div>

      {rangeQ.error && (
        <div className="alert-banner danger">
          <div className="ic-wrap"><Icon name="alert" size={20} /></div>
          <div className="txt">
            <strong>Couldn&rsquo;t reach the server</strong>
            <span>{rangeQ.error}</span>
          </div>
        </div>
      )}

      {needsAttention > 0 && (
        <div className="alert-banner danger no-print">
          <div className="ic-wrap"><Icon name="alert" size={20} /></div>
          <div className="txt">
            <strong>{needsAttention} stock item{needsAttention > 1 ? 's' : ''} need attention</strong>
            <span>
              {outStock.length > 0
                ? `${outStock.slice(0, 2).map((i) => i.name).join(' and ')} ${outStock.length > 1 ? 'are' : 'is'} out of stock.`
                : `${lowStock.slice(0, 2).map((i) => i.name).join(' and ')} ${lowStock.length > 1 ? 'are' : 'is'} running low.`}
            </span>
          </div>
          <button className="go" onClick={() => navigate('stock')}>Manage stock</button>
        </div>
      )}

      <div className="kpi-row">
        <div className="kpi with-icon clickable" onClick={() => navigate('patient-records')}>
          <div className="ic-badge"><Icon name="activity" size={24} /></div>
          <div>
            <div className="value">{todayQ.loading ? '…' : todayQ.visits.length}</div>
            <div className="label">Today&rsquo;s visits</div>
            <div className="foot">As of {formatTime(now)}</div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('patient-records')}>
          <div className="ic-badge blue"><Icon name="calendar" size={24} /></div>
          <div>
            <div className="value">{rangeQ.loading ? '…' : rangeQ.visits.length}</div>
            <div className="label">Range total</div>
            <div className="foot">
              {formatDate(new Date(`${range.from}T00:00:00Z`))} – {formatDate(new Date(`${range.to}T00:00:00Z`))}
            </div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('patient-records')}>
          <div className="ic-badge amber"><Icon name="trendUp" size={24} /></div>
          <div>
            <div className="value">{todayQ.loading ? '…' : referredToday}</div>
            <div className="label">Referred today</div>
            <div className="foot">To hospital or physician</div>
          </div>
        </div>
        <div className="kpi with-icon clickable" onClick={() => navigate('stock')}>
          <div className="ic-badge red"><Icon name="box" size={24} /></div>
          <div>
            <div className="value">{stock.loading ? '…' : stock.error ? '—' : needsAttention}</div>
            <div className="label">Low or out of stock</div>
            <div className="foot">Items need reorder</div>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Visit trend</h3>
              <div className="sub">
                {trendQ.visits.length} visits in the last {trendDays} days, daily
              </div>
            </div>
            <div className="segmented no-print">
              {Object.keys(TREND_WINDOWS).map((k) => (
                <button key={k} className={trendWindow === k ? 'active' : ''} onClick={() => setTrendWindow(k)}>{k}</button>
              ))}
            </div>
          </div>
          {trendQ.loading ? <div className="sub">Loading…</div> : <LineChart points={trend} />}
        </div>

        <div className="card">
          <h3>Top complaints</h3>
          <div className="card-sub">Across the selected range</div>
          {complaints.length === 0 ? (
            <div className="sub">{rangeQ.loading ? 'Loading…' : 'No visits recorded in this range yet.'}</div>
          ) : (
            <div className="donut-wrap">
              <Donut slices={complaints} centerValue={rangeQ.visits.length} centerLabel="visits" />
              <div className="donut-legend">
                {complaints.map((c) => (
                  <div className="legend-row" key={c.name}>
                    <span className="sw" style={{ background: c.color }} />
                    <span className="name">{c.name}</span>
                    <span className="pct">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Active patient queue</h3>
              <div className="sub">Live, {inCare} still in care</div>
            </div>
            <div className="head-actions no-print">
              <select className="auto" value={queueSort} onChange={(e) => setQueueSort(e.target.value)}>
                <option value="time-in">Sort: time in</option>
                <option value="name">Sort: name</option>
              </select>
              <button className="btn btn-soft btn-sm" onClick={() => navigate('patient-records')}>
                Open today&rsquo;s visits
              </button>
            </div>
          </div>

          <div className="table-card" style={{ margin: '0 -22px -20px' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 22 }}>Patient</th>
                  <th>Chief complaint</th><th>Time</th><th>Status</th><th className="no-print" />
                </tr>
              </thead>
              <tbody>
                {todayQ.loading ? (
                  <tr><td colSpan={5} className="empty-cell">Loading today&rsquo;s queue…</td></tr>
                ) : queue.length === 0 ? (
                  <tr><td colSpan={5} className="empty-cell">No visits logged today yet.</td></tr>
                ) : (
                  queue.map((v) => {
                    const open = isOpenVisit(v);
                    const status = VISIT_STATUS[v.status] || { label: v.status, pill: 'grey' };
                    const at = parseApiDate(v.startedAt);
                    return (
                      <tr className="rowlink" key={v.visitId} onClick={() => navigate('profile', v)}>
                        <td style={{ paddingLeft: 22 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div className="avatar sm">{initialsOf(v.patientName)}</div>
                            <div>
                              <div className="nm">{v.patientName}</div>
                              <div className="sub">{[v.patientTypeName, v.patientNumber].filter(Boolean).join(', ')}</div>
                            </div>
                          </div>
                        </td>
                        <td>{v.chiefComplaint || '—'}</td>
                        <td className="nowrap">
                          {formatTime(at)}{open ? ' – now' : v.endedAt ? ` – ${formatTime(parseApiDate(v.endedAt))}` : ''}
                        </td>
                        <td>
                          <span className={`pill ${status.pill}`}><span className="dot" />{status.label}</span>
                        </td>
                        <td className="no-print" onClick={(e) => e.stopPropagation()}>
                          <div className="cell-actions">
                            <button className="btn btn-soft btn-sm" onClick={() => navigate('profile', v)}>View</button>
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

        <div className="card">
          <h3>Top 5 most requested medicine</h3>
          <div className="card-sub">Gamot na madalas kunin</div>
          {medicines.length === 0 ? (
            <div className="sub">Nothing dispensed in this range yet.</div>
          ) : (
            <HBars rows={medicines} showValue={(r) => formatQty(r.count)} />
          )}
        </div>
      </div>
    </div>
  );
}
