import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { addDays, clinicDay, formatDate, formatTime, parseApiDate, presetRange, weekdayOf } from '../lib/time';
import { formatQty, isOpenVisit, VISIT_STATUS } from '../lib/format';
import { REFERRAL_DISPOSITIONS } from '../api/lookups';
import { listStock } from '../api/stock';
import { topComplaintsFrom } from '../lib/insights';

const today = clinicDay(new Date());
const thisWeek = presetRange('week', today);

/** Every day in the range, capped at a week — the Figma's trend runs Mon→Sun. */
function daysBetween(from, to) {
  const days = [];
  for (let d = from; d <= to && days.length < 7; d = addDays(d, 1)) days.push(d);
  return days;
}

/** "Top 5 Most Requested Medicine" — tallies units dispensed across the range. */
function topMedicines(visits, limit = 5) {
  const counts = new Map();
  for (const v of visits) {
    for (const m of v.medicines || []) {
      const qty = Number(m.quantityGiven) || 0;
      counts.set(m.medicineName, (counts.get(m.medicineName) || 0) + qty);
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const max = Math.max(1, ...sorted.map(([, n]) => n));
  return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
}

export default function NurseDashboard() {
  const { navigate } = useApp();
  const [preset, setPreset] = useState('today');
  const [range, setRange] = useState(() => presetRange('today', today));
  const [draft, setDraft] = useState(() => presetRange('today', today));
  const [queueSort, setQueueSort] = useState({ by: 'time-in', order: 'desc' });
  const [now] = useState(() => new Date());

  const applyPreset = (p) => {
    const next = presetRange(p, today);
    setPreset(p);
    setRange(next);
    setDraft(next);
  };

  const todayQ = useVisitsInRange(today, today);
  const rangeQ = useVisitsInRange(range.from, range.to);
  // The visit trend is always the current Mon–Sun, independent of the range
  // picker above (which only drives the Range Total KPI).
  const weekQ = useVisitsInRange(thisWeek.from, thisWeek.to);

  const inCare = todayQ.visits.filter(isOpenVisit).length;
  const referredToday = todayQ.visits.filter((v) => REFERRAL_DISPOSITIONS.has(v.dispositionName)).length;

  const weeklyTrend = useMemo(() => {
    const byDay = new Map();
    for (const v of weekQ.visits) {
      const day = clinicDay(parseApiDate(v.startedAt));
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }
    const days = daysBetween(thisWeek.from, thisWeek.to);
    const counts = days.map((d) => byDay.get(d) || 0);
    const max = Math.max(1, ...counts);
    return days.map((d, i) => ({
      day: weekdayOf(new Date(`${d}T00:00:00Z`)),
      count: counts[i],
      pct: Math.round((counts[i] / max) * 100),
    }));
  }, [weekQ.visits]);

  const topComplaints = useMemo(() => topComplaintsFrom(rangeQ.visits, { limit: 5 }), [rangeQ.visits]);
  const medicines = useMemo(() => topMedicines(rangeQ.visits), [rangeQ.visits]);

  const queue = useMemo(() => {
    const dir = queueSort.order === 'asc' ? 1 : -1;
    return [...todayQ.visits].sort((a, b) =>
      queueSort.by === 'name'
        ? a.patientName.localeCompare(b.patientName) * dir
        : (parseApiDate(a.startedAt) - parseApiDate(b.startedAt)) * dir);
  }, [todayQ.visits, queueSort]);

  const stock = useAsync(() => listStock(), []);
  const stockItems = stock.data?.items || [];
  const lowStock = stockItems.filter((i) => i.stockStatus === 'low');
  const outStock = stockItems.filter((i) => i.stockStatus === 'out_of_stock');
  const lowOutTotal = lowStock.length + outStock.length;

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Nurse Dashboard</h1>
          <div className="sub">ISU Infirmary · {formatDate(new Date(`${today}T00:00:00Z`))}</div>
        </div>
      </div>

      <div className="range-bar no-print">
        <div className="presets">
          <button className={preset === 'today' ? 'active' : ''} onClick={() => applyPreset('today')}>Today</button>
          <button className={preset === 'week' ? 'active' : ''} onClick={() => applyPreset('week')}>This Week</button>
          <button className={preset === 'month' ? 'active' : ''} onClick={() => applyPreset('month')}>This Month</button>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>From</span>
        <input
          type="date"
          value={draft.from}
          onChange={(e) => { setPreset('custom'); setDraft((d) => ({ ...d, from: e.target.value })); }}
          style={{ maxWidth: '150px' }}
        />
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
        <input
          type="date"
          value={draft.to}
          onChange={(e) => { setPreset('custom'); setDraft((d) => ({ ...d, to: e.target.value })); }}
          style={{ maxWidth: '150px' }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => setRange(draft)}>Apply</button>
      </div>

      {rangeQ.error && (
        <div className="alert-banner danger">
          <span className="ic">⚠</span>
          <div className="txt">
            <strong>Couldn&rsquo;t reach the server</strong>
            <span>{rangeQ.error}</span>
          </div>
        </div>
      )}

      {lowOutTotal > 0 && (
        <div className="alert-banner danger">
          <span className="ic">⚠</span>
          <div className="txt">
            <strong>{lowOutTotal} stock item{lowOutTotal > 1 ? 's' : ''} need{lowOutTotal > 1 ? '' : 's'} attention</strong>
            <span>
              {outStock.length > 0
                ? `${outStock.map((i) => i.name).join(', ')} ${outStock.length > 1 ? 'are' : 'is'} out of stock.`
                : `${lowStock.map((i) => i.name).join(', ')} ${lowStock.length > 1 ? 'are' : 'is'} running low.`}
            </span>
          </div>
          <button className="go" onClick={() => navigate('stock')}>Manage stock →</button>
        </div>
      )}

      <div className="kpi-row">
        <div className="kpi" onClick={() => navigate('patient-records')}>
          <div className="label">Today&rsquo;s Visits</div>
          <div className="value">{todayQ.loading ? '…' : todayQ.visits.length}</div>
          <div className="foot">As of {formatTime(now)}</div>
        </div>
        <div className="kpi" onClick={() => navigate('patient-records')}>
          <div className="label">Range Total</div>
          <div className="value">{rangeQ.loading ? '…' : rangeQ.visits.length}</div>
          <div className="foot">
            {formatDate(new Date(`${range.from}T00:00:00Z`))} – {formatDate(new Date(`${range.to}T00:00:00Z`))}
          </div>
        </div>
        <div className="kpi" onClick={() => navigate('patient-records')}>
          <div className="label">Referred Today</div>
          <div className="value">{todayQ.loading ? '…' : referredToday}</div>
          <div className="foot">To hospital / physician</div>
        </div>
        <div className="kpi pending" onClick={() => navigate('stock')}>
          <div className="label">Low / Out of Stock</div>
          <div className="value">{stock.loading ? '…' : stock.error ? '—' : lowOutTotal}</div>
          <div className="foot">{stock.error ? 'Inventory unavailable' : 'Items need reorder'}</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <h3>Visit Trend</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '6px' }}>Monday to Sunday</div>
          <div className="bars">
            {weekQ.loading ? (
              <div className="sub">Loading…</div>
            ) : (
              weeklyTrend.map((d) => (
                <div className="bar-col" key={d.day}>
                  <span className="num">{d.count}</span>
                  <div className="bar" style={{ height: `${Math.max(d.pct, 3)}%` }} />
                  <span className="lbl">{d.day}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3>Top Complaints</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Across the selected range</div>
          {topComplaints.length === 0 ? (
            <div className="sub">No visits recorded in this range yet.</div>
          ) : (
            <div className="hbar-list">
              {topComplaints.map((c) => (
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
        <h3>Top 5 Most Requested Medicine</h3>
        <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Gamot na madalas kunin</div>
        {medicines.length === 0 ? (
          <div className="sub">Nothing dispensed in this range yet.</div>
        ) : (
          <div className="hbar-list">
            {medicines.map((m) => (
              <div className="hbar" key={m.name}>
                <span className="name">{m.name}</span>
                <span className="track"><span className="fill" style={{ width: `${m.pct}%`, background: 'var(--teal-500)' }} /></span>
                <span className="pct">{formatQty(m.count)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '18px 20px' }}>
        <div className="card-head">
          <div>
            <h3>Active Patient Queue</h3>
            <div className="sub">Live — {inCare} still in care</div>
          </div>
          <div className="head-actions no-print">
            <select
              style={{ maxWidth: '160px' }}
              value={queueSort.by}
              onChange={(e) => setQueueSort({ ...queueSort, by: e.target.value })}
            >
              <option value="time-in">Sort by: Time in</option>
              <option value="name">Sort by: Name</option>
            </select>
            <select
              style={{ maxWidth: '150px' }}
              value={queueSort.order}
              onChange={(e) => setQueueSort({ ...queueSort, order: e.target.value })}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('patient-records')}>
              Open Today&rsquo;s Visits
            </button>
          </div>
        </div>

        <div className="table-card" style={{ margin: '0 -20px -18px' }}>
          <table>
            <thead>
              <tr>
                <th>Patient</th><th>Type</th><th>Chief Complaint</th>
                <th>Time In</th><th>Time Out</th><th>Status</th><th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayQ.loading ? (
                <tr><td colSpan={7} className="sub empty-cell">Loading today&rsquo;s queue…</td></tr>
              ) : queue.length === 0 ? (
                <tr><td colSpan={7} className="sub empty-cell">No visits logged today yet.</td></tr>
              ) : (
                queue.map((v) => {
                  const status = VISIT_STATUS[v.status] || { label: v.status, pill: '' };
                  return (
                    <tr className="rowlink" key={v.visitId} onClick={() => navigate('profile', v)}>
                      <td className="nm">{v.patientName}</td>
                      <td><span className="pill active">{v.patientTypeName || '—'}</span></td>
                      <td>{v.chiefComplaint || '—'}</td>
                      <td className="nowrap">{formatTime(parseApiDate(v.startedAt))}</td>
                      <td className="nowrap">{v.endedAt ? formatTime(parseApiDate(v.endedAt)) : '—'}</td>
                      <td><span className={`pill ${status.pill}`}>{status.label}</span></td>
                      <td className="no-print nowrap" onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('profile', v)}>View</button>
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
