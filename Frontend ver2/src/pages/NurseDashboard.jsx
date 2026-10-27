import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { addDays, clinicDay, formatDate, formatTime, parseApiDate, presetRange } from '../lib/time';
import { isOpenVisit, initialsOf, VISIT_STATUS } from '../lib/format';
import { REFERRAL_DISPOSITIONS } from '../api/lookups';
import { listStock } from '../api/stock';
import { getPatterns } from '../api/insights';
import { getOutbreakAlerts } from '../api/surveillance';
import { summarize } from '../lib/insights';
import { LineChart } from '../components/Charts';
import {
  BusiestHoursCard, ClientBreakdownCard, ComplaintsCard, DepartmentsCard, DispositionsCard, MedicinesCard,
  MonthlyVisitsCard, PairingsCard, StaffAgesCard, StudentDemographicsCard,
} from '../components/InsightCards';
import Icon from '../components/Icon';
import QuickLinks from '../components/QuickLinks';

const today = clinicDay(new Date());
const shortDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' });

const QUICK_LINKS = [
  { view: 'patient-records', label: 'Patient records', icon: 'clipboard' },
  { view: 'flag-cases', label: 'Priority & special cases', icon: 'flag' },
  { view: 'search-history', label: 'Search & history', icon: 'search' },
  { view: 'stock', label: 'Stock & supplies', icon: 'box' },
  { view: 'reports', label: 'Reports', icon: 'chart' },
  { view: 'full-lists', label: 'Full lists', icon: 'list' },
];

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

export default function NurseDashboard() {
  const { navigate } = useApp();
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(() => presetRange('month', today));
  const [draft, setDraft] = useState(() => presetRange('month', today));
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
  // Monthly bars and treatment pairings need more than a week of history, so
  // they always look back over the semester.
  const semesterFrom = addDays(today, -179);
  const semesterQ = useVisitsInRange(semesterFrom, today);
  const patterns = useAsync(() => getPatterns({ dateFrom: semesterFrom, dateTo: today }), [semesterFrom]);

  const inCare = todayQ.visits.filter(isOpenVisit).length;
  const referredToday = todayQ.visits.filter((v) => REFERRAL_DISPOSITIONS.has(v.dispositionName)).length;

  const trend = useMemo(() => dailyTrend(trendQ.visits, trendDays), [trendQ.visits, trendDays]);
  const stats = useMemo(() => summarize(rangeQ.visits), [rangeQ.visits]);
  const semester = useMemo(() => summarize(semesterQ.visits), [semesterQ.visits]);
  const rangeLabel = `${formatDate(new Date(`${range.from}T00:00:00Z`))} – ${formatDate(new Date(`${range.to}T00:00:00Z`))}`;

  const queue = useMemo(() => {
    const list = [...todayQ.visits];
    return list.sort((a, b) =>
      queueSort === 'name'
        ? a.patientName.localeCompare(b.patientName)
        : parseApiDate(b.startedAt) - parseApiDate(a.startedAt));
  }, [todayQ.visits, queueSort]);

  const stock = useAsync(() => listStock({ perPage: 200 }), []);
  // Health surveillance: this week's possible outbreaks. If the check fails
  // (no model on the server, demo mode), the dashboard simply shows no banner.
  const outbreaks = useAsync(() => getOutbreakAlerts(), []);
  const outbreakList = outbreaks.data?.alerts || [];
  const [showOutbreaks, setShowOutbreaks] = useState(false);
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
      </div>

      <div className="range-row no-print">
        <span className="range-caption">Charts below cover</span>

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

      {outbreakList.length > 0 && (
        <div className="alert-banner danger outbreak-banner no-print">
          <div className="ic-wrap"><Icon name="alert" size={20} /></div>
          <div className="txt">
            <strong>
              {outbreakList[0].headline}
              {outbreakList.length > 1 ? ` (+${outbreakList.length - 1} more)` : ''}
            </strong>
            <span>{outbreakList[0].detail}</span>
            {showOutbreaks && (
              <ul className="outbreak-list">
                {outbreakList.map((a) => (
                  <li key={`${a.college}-${a.complaint}`}>
                    {outbreakList.length > 1 && <><b>{a.complaint} in {a.college}:</b> {a.detail}. </>}
                    Last week: {a.previousWeekCases} {a.complaint} case{a.previousWeekCases === 1 ? '' : 's'} in {a.college}.
                  </li>
                ))}
                <li>Check this week&rsquo;s visits in Search &amp; history.</li>
              </ul>
            )}
          </div>
          <button className="go" onClick={() => setShowOutbreaks((v) => !v)}>
            {showOutbreaks ? 'Hide' : 'View'}
          </button>
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
            <div className="foot">{rangeLabel}</div>
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

      <QuickLinks links={QUICK_LINKS} />

      <div className="chart-row even">
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

        <ComplaintsCard rows={stats.complaints} loading={rangeQ.loading} visits={rangeQ.visits} rangeLabel={rangeLabel} />
      </div>

      {/* Full width: the queue table needs the room, and a card beside it left a gap. */}
      <div>
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

      </div>

      <div className="section-title">
        <h2>Insights</h2>
        <span>{rangeLabel} · {stats.total} visits</span>
      </div>

      <div className="chart-flow">
        <MedicinesCard rows={stats.medicines} loading={rangeQ.loading} />
        <BusiestHoursCard bars={stats.byHour} loading={rangeQ.loading} />
        <ClientBreakdownCard rows={stats.clients} loading={rangeQ.loading} />
        <DispositionsCard rows={stats.dispositions} loading={rangeQ.loading} />
        <StaffAgesCard rows={stats.staffAges} loading={rangeQ.loading} />
        <DepartmentsCard rows={stats.departments} loading={rangeQ.loading} />
        <StudentDemographicsCard years={stats.studentYears} sex={stats.studentSex} loading={rangeQ.loading} />
      </div>

      <div className="section-title">
        <h2>This semester</h2>
        <span>Last 180 days · {semester.total} visits</span>
      </div>

      <div className="chart-row even">
        <MonthlyVisitsCard perMonth={semester.perMonth} loading={semesterQ.loading} />
        <PairingsCard patterns={patterns.data} loading={patterns.loading} error={patterns.error} />
      </div>
    </div>
  );
}
