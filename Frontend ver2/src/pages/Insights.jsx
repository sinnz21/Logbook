import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { getPatterns } from '../api/insights';
import { addDays, clinicDay, parseApiDate } from '../lib/time';
import { barsFrom, tally, topComplaintsFrom } from '../lib/insights';
import { BarChart, HBars } from '../components/Charts';
import Icon from '../components/Icon';

const MONTH = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short' });
const MONTH_LONG = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' });

const PRESETS = {
  '7d': { label: 'Past 7 days', days: 6 },
  '30d': { label: 'Past 30 days', days: 29 },
  semester: { label: 'Semester', days: 179 },
};

// matchRate 0–1 → the design's plain-language strength pill.
function strength(rate) {
  if (rate >= 0.8) return { label: 'Very common', pill: 'green' };
  if (rate >= 0.6) return { label: 'Common', pill: 'amber' };
  return { label: 'Occasional', pill: 'grey' };
}

/** Faculty and staff age bands — the design groups them for BP checks. */
function ageBand(age) {
  if (age == null) return null;
  if (age < 30) return 'Under 30';
  if (age <= 44) return '30 to 44 years';
  if (age <= 60) return '45 to 60 years';
  return 'Over 60';
}

export default function Insights() {
  const [today] = useState(() => clinicDay(new Date()));
  const [preset, setPreset] = useState('semester');
  const [committed, setCommitted] = useState(() => ({ from: addDays(clinicDay(new Date()), -179), to: clinicDay(new Date()) }));
  const [draft, setDraft] = useState(committed);
  const [filters, setFilters] = useState({ sex: '', yearLevel: '', program: '', department: '' });
  const [order, setOrder] = useState('desc');

  const applyPreset = (key) => {
    const next = { from: addDays(today, -PRESETS[key].days), to: today };
    setPreset(key);
    setCommitted(next);
    setDraft(next);
  };

  const patterns = useAsync(() => getPatterns({ dateFrom: committed.from, dateTo: committed.to }), [committed.from, committed.to]);
  const source = useVisitsInRange(committed.from, committed.to);

  const visits = useMemo(() => source.visits.filter((v) => {
    if (filters.sex && (v.sex || '').toLowerCase() !== filters.sex.toLowerCase()) return false;
    if (filters.yearLevel && v.yearLevel !== filters.yearLevel) return false;
    if (filters.program && v.program !== filters.program) return false;
    if (filters.department && v.department !== filters.department) return false;
    return true;
  }), [source.visits, filters]);

  const optionsFor = (field) => [...new Set(source.visits.map((v) => v[field]).filter(Boolean))].sort();
  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const perMonth = useMemo(() => {
    const counts = new Map();
    for (const v of visits) {
      const at = parseApiDate(v.startedAt);
      counts.set(`${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, '0')}`, 0);
    }
    for (const v of visits) {
      const at = parseApiDate(v.startedAt);
      const key = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const months = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
    return months.map(([key, value]) => ({
      key,
      label: MONTH.format(new Date(`${key}-01T00:00:00Z`)),
      value,
    }));
  }, [visits]);

  const monthSpan = perMonth.length
    ? `${MONTH_LONG.format(new Date(`${perMonth[0].key}-01T00:00:00Z`))} to ${MONTH_LONG.format(new Date(`${perMonth[perMonth.length - 1].key}-01T00:00:00Z`))}`
    : 'No visits in this range';

  const complaints = useMemo(() => topComplaintsFrom(visits, { limit: 5 }), [visits]);
  const clientBreakdown = useMemo(() => barsFrom(tally(visits, 'patientTypeName')), [visits]);

  const departments = useMemo(() => {
    const counts = tally(visits, 'department');
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    const dir = order === 'asc' ? 1 : -1;
    return [...counts.entries()]
      .sort((a, b) => (a[1] - b[1]) * dir)
      .slice(0, 5)
      .map(([name, count]) => {
        const inDept = visits.filter((v) => v.department === name);
        const top = [...tally(inDept, (v) => (v.complaints?.length ? v.complaints[0] : v.chiefComplaint)).entries()]
          .sort((a, b) => b[1] - a[1])[0];
        return { name, count, share: Math.round((count / Math.max(1, total)) * 100), topComplaint: top?.[0] || '—' };
      });
  }, [visits, order]);

  const students = useMemo(() => visits.filter((v) => v.patientTypeName === 'Student'), [visits]);
  const studentYears = useMemo(() => barsFrom(tally(students, 'yearLevel')), [students]);
  const studentSummary = useMemo(() => {
    const counts = tally(students, 'sex');
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (!total) return null;
    return [...counts.entries()].map(([n, c]) => `${n} ${Math.round((c / total) * 100)}%`).join(', ');
  }, [students]);

  const staffAges = useMemo(
    () => barsFrom(tally(visits.filter((v) => v.patientTypeName && v.patientTypeName !== 'Student'), (v) => ageBand(v.age))),
    [visits],
  );

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Insights</h1>
          <div className="sub">Plain-language clinical trends from the visit records</div>
        </div>
        <button className="btn btn-ghost no-print" onClick={() => window.print()}>
          <Icon name="printer" size={17} /> Print report
        </button>
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="segmented solid">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button key={key} className={preset === key ? 'active' : ''} onClick={() => applyPreset(key)}>{p.label}</button>
            ))}
          </div>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draft.from} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }} />
            <span>to</span>
            <input type="date" value={draft.to} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setCommitted(draft)}>Apply</button>
        </div>
        <div className="filter-row">
          <select className="auto" value={filters.sex} onChange={setFilter('sex')}>
            <option value="">Gender: all</option><option value="Female">Female</option><option value="Male">Male</option>
          </select>
          <select className="auto" value={filters.yearLevel} onChange={setFilter('yearLevel')}>
            <option value="">Year level: all</option>
            {optionsFor('yearLevel').map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="auto" value={filters.program} onChange={setFilter('program')}>
            <option value="">Program: all</option>
            {optionsFor('program').map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="auto" value={filters.department} onChange={setFilter('department')}>
            <option value="">Department: all</option>
            {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="spacer" />
          <select className="auto" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="desc">Sort: frequency, highest</option>
            <option value="asc">Sort: frequency, lowest</option>
          </select>
        </div>
      </div>

      {source.error && <div className="login-error" style={{ marginBottom: 14 }}>{source.error}</div>}

      <div className="chart-row even">
        <div className="card">
          <h3>Visits per month</h3>
          <div className="card-sub">{monthSpan}</div>
          {source.loading ? <div className="sub">Loading…</div> : <BarChart bars={perMonth} />}
        </div>

        <div className="card">
          <h3>Frequent complaints</h3>
          <div className="card-sub">Across the selected range</div>
          {complaints.length === 0 ? (
            <div className="sub">{source.loading ? 'Loading…' : 'No complaints tagged yet.'}</div>
          ) : (
            <HBars rows={complaints} />
          )}
        </div>
      </div>

      <div className="card">
        <h3>Common treatment pairings</h3>
        <div className="card-sub">Plain sentences, no data-mining jargon on screen</div>
        {patterns.error && <div className="login-error">{patterns.error}</div>}
        {patterns.loading ? (
          <div className="sub">Loading…</div>
        ) : (patterns.data || []).length === 0 ? (
          <div className="sub">Not enough tagged visits in this period to find patterns yet.</div>
        ) : (
          <div className="pairing-grid">
            {patterns.data.map((p) => {
              const s = strength(p.matchRate);
              return (
                <div className="pairing-card" key={`${p.trigger}->${p.associatedWith}`}>
                  <div>
                    <div className="t">{p.trigger} commonly receives {p.associatedWith}</div>
                    <div className="d">{Math.round(p.matchRate * 100)}% of {p.trigger.toLowerCase()} visits</div>
                  </div>
                  <span className={`pill ${s.pill}`}><span className="dot" />{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="chart-row narrow-left">
        <div className="card">
          <h3>Client breakdown</h3>
          <div className="card-sub">Who the clinic serves</div>
          {clientBreakdown.length === 0 ? (
            <div className="sub">No visits in this range.</div>
          ) : (
            <HBars rows={clientBreakdown.map((r) => ({ ...r, color: 'var(--teal)' }))} />
          )}
        </div>

        <div className="card" style={{ padding: '20px 22px 6px' }}>
          <h3>Highest visiting departments</h3>
          <div className="card-sub">Share of recorded visits</div>
          <div className="table-card">
            <table>
              <thead>
                <tr><th>Department or college</th><th>Visits</th><th>Share</th><th>Most common complaint</th></tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan={4} className="empty-cell">No department data in this range.</td></tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.name}>
                      <td className="nm">{d.name}</td>
                      <td>{d.count}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="track" style={{ display: 'block', width: 90, height: 8, background: 'var(--line-soft)', borderRadius: 999, overflow: 'hidden' }}>
                            <span style={{ display: 'block', height: '100%', width: `${d.share}%`, background: 'var(--teal)', borderRadius: 999 }} />
                          </span>
                          <span className="nm">{d.share}%</span>
                        </div>
                      </td>
                      <td>{d.topComplaint}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="chart-row even">
        <div className="card">
          <h3>Student demographics</h3>
          <div className="card-sub">{studentSummary ? `${studentSummary}.` : 'Sortable by course, year level, gender and age'}</div>
          {studentYears.length === 0 ? (
            <div className="sub">No student visits in this range.</div>
          ) : (
            <HBars rows={studentYears.map((r) => ({ ...r, color: 'var(--teal)' }))} />
          )}
        </div>

        <div className="card">
          <h3>Faculty and staff demographics</h3>
          <div className="card-sub">Age groups matter for blood pressure and hypertension checks</div>
          {staffAges.length === 0 ? (
            <div className="sub">No age data recorded for faculty or staff visits in this range.</div>
          ) : (
            <HBars rows={staffAges.map((r) => ({ ...r, color: 'var(--teal)' }))} />
          )}
        </div>
      </div>
    </div>
  );
}
