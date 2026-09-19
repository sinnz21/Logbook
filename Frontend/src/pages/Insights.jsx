import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { getPatterns } from '../api/insights';
import { addDays, clinicDay, parseApiDate } from '../lib/time';
import { topComplaintsFrom } from '../lib/insights';

const MONTH = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short' });

const PRESETS = {
  '7d': { label: 'Past 7 days', days: 6 },
  '30d': { label: 'Past 30 days', days: 29 },
  semester: { label: 'Semester', days: 179 },
};

// matchRate 0–1 → the Figma's plain-language strength pill.
function strength(rate) {
  if (rate >= 0.8) return { label: 'Very common', pill: 'high-stock' };
  if (rate >= 0.6) return { label: 'Common', pill: 'low-stock' };
  return { label: 'Occasional', pill: 'pending' };
}

/** Horizontal bar rows from a name → count map, sorted and percentaged. */
function barsFrom(counts, { limit = 10, ofTotal = true } = {}) {
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return entries.map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / (ofTotal ? Math.max(1, total) : max)) * 100),
    width: Math.round((count / max) * 100),
  }));
}

function tally(visits, key) {
  const counts = new Map();
  for (const v of visits) {
    const value = typeof key === 'function' ? key(v) : v[key];
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

/** Faculty/staff age bands — the Figma groups them for BP and hypertension checks. */
function ageBand(age) {
  if (age == null) return null;
  if (age < 30) return 'Under 30';
  if (age <= 44) return '30–44 years';
  if (age <= 60) return '45–60 years';
  return 'Over 60';
}

export default function Insights() {
  const [today] = useState(() => clinicDay(new Date()));
  const [preset, setPreset] = useState('30d');
  const [committed, setCommitted] = useState(() => ({ from: addDays(clinicDay(new Date()), -29), to: clinicDay(new Date()) }));
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
      const key = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const months = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
    const max = Math.max(1, ...months.map(([, n]) => n));
    return months.map(([key, count]) => ({
      label: MONTH.format(new Date(`${key}-01T00:00:00Z`)),
      count,
      pct: Math.round((count / max) * 100),
    }));
  }, [visits]);

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
        return {
          name,
          count,
          share: Math.round((count / Math.max(1, total)) * 100),
          topComplaint: top?.[0] || '—',
        };
      });
  }, [visits, order]);

  const studentYears = useMemo(
    () => barsFrom(tally(visits.filter((v) => v.patientTypeName === 'Student'), 'yearLevel')),
    [visits],
  );

  const studentSex = useMemo(() => {
    const counts = tally(visits.filter((v) => v.patientTypeName === 'Student'), 'sex');
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    if (!total) return null;
    return [...counts.entries()]
      .map(([name, n]) => `${name} ${Math.round((n / total) * 100)}%`)
      .join(' · ');
  }, [visits]);

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
      </div>

      <div className="range-bar no-print">
        <div className="presets">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} className={preset === key ? 'active' : ''} onClick={() => applyPreset(key)}>
              {p.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>From</span>
        <input type="date" value={draft.from} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }} style={{ maxWidth: '150px' }} />
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
        <input type="date" value={draft.to} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }} style={{ maxWidth: '150px' }} />
        <button className="btn btn-primary btn-sm" onClick={() => setCommitted(draft)}>Apply</button>
      </div>

      <div className="card no-print" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <select style={{ maxWidth: '150px' }} value={filters.sex} onChange={setFilter('sex')}>
            <option value="">Gender: All</option><option value="Female">Female</option><option value="Male">Male</option>
          </select>
          <select style={{ maxWidth: '160px' }} value={filters.yearLevel} onChange={setFilter('yearLevel')}>
            <option value="">Year level: All</option>
            {optionsFor('yearLevel').map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select style={{ maxWidth: '180px' }} value={filters.program} onChange={setFilter('program')}>
            <option value="">Program: All</option>
            {optionsFor('program').map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select style={{ maxWidth: '190px' }} value={filters.department} onChange={setFilter('department')}>
            <option value="">Department: All</option>
            {optionsFor('department').map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <select style={{ maxWidth: '160px' }} value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">Highest first</option>
              <option value="asc">Lowest first</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>Print report</button>
          </div>
        </div>
      </div>

      {source.error && <div className="login-error">{source.error}</div>}

      <div className="chart-row">
        <div className="card">
          <h3>Visits Per Month</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '6px' }}>Across the selected range</div>
          {perMonth.length === 0 ? (
            <div className="sub">{source.loading ? 'Loading…' : 'No visits in this range.'}</div>
          ) : (
            <div className="bars">
              {perMonth.map((m) => (
                <div className="bar-col" key={m.label}>
                  <span className="num">{m.count}</span>
                  <div className="bar" style={{ height: `${Math.max(m.pct, 3)}%` }} />
                  <span className="lbl">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Frequent Complaints</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Across the selected range</div>
          {complaints.length === 0 ? (
            <div className="sub">{source.loading ? 'Loading…' : 'No complaints tagged yet.'}</div>
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
        <h3>Common Treatment Pairings</h3>
        <div className="sub" style={{ marginTop: '-8px', marginBottom: '6px' }}>Plain sentences — no data-mining jargon on screen</div>
        {patterns.error && <div className="login-error">{patterns.error}</div>}
        {patterns.loading ? (
          <div className="sub">Loading…</div>
        ) : (patterns.data || []).length === 0 ? (
          <div className="sub">Not enough tagged visits in this period to find patterns yet.</div>
        ) : (
          patterns.data.map((p) => {
            const s = strength(p.matchRate);
            return (
              <div className="pairing-row" key={`${p.trigger}->${p.associatedWith}`}>
                <div>
                  <div className="t">{p.trigger} commonly receives {p.associatedWith}</div>
                  <div className="d">{Math.round(p.matchRate * 100)}% of {p.trigger.toLowerCase()} visits · {p.support} visits</div>
                </div>
                <span className={`pill ${s.pill}`}>{s.label}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="chart-row">
        <div className="card">
          <h3>Client Breakdown</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Who the clinic serves</div>
          {clientBreakdown.length === 0 ? (
            <div className="sub">No visits in this range.</div>
          ) : (
            <div className="hbar-list">
              {clientBreakdown.map((r) => (
                <div className="hbar" key={r.name}>
                  <span className="name">{r.name}</span>
                  <span className="track"><span className="fill" style={{ width: `${r.width}%`, background: 'var(--teal-500)' }} /></span>
                  <span className="pct">{r.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '18px 20px 6px' }}>
          <h3>Highest Visiting Departments</h3>
          <div className="sub" style={{ marginTop: '-8px' }}>Share of recorded visits</div>
          <div className="table-card" style={{ margin: '10px -20px 0' }}>
            <table>
              <thead>
                <tr><th>Department / College</th><th>Visits</th><th>Share</th><th>Most Common Complaint</th></tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan={4} className="sub empty-cell">No department data in this range.</td></tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d.name}>
                      <td className="nm">{d.name}</td>
                      <td>{d.count}</td>
                      <td>{d.share}%</td>
                      <td>{d.topComplaint}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card">
          <h3>Student Demographics</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Sortable by course, year level, gender and age</div>
          {studentYears.length === 0 ? (
            <div className="sub">No student visits in this range.</div>
          ) : (
            <>
              <div className="hbar-list">
                {studentYears.map((r) => (
                  <div className="hbar" key={r.name}>
                    <span className="name">{r.name}</span>
                    <span className="track"><span className="fill" style={{ width: `${r.width}%`, background: 'var(--teal-500)' }} /></span>
                    <span className="pct">{r.pct}%</span>
                  </div>
                ))}
              </div>
              {studentSex && <div className="sub" style={{ marginTop: '12px' }}>{studentSex}</div>}
            </>
          )}
        </div>

        <div className="card">
          <h3>Faculty &amp; Staff Demographics</h3>
          <div className="sub" style={{ marginTop: '-8px', marginBottom: '12px' }}>Age groups matter for BP and hypertension checks</div>
          {staffAges.length === 0 ? (
            <div className="sub">No age data recorded for faculty or staff visits in this range.</div>
          ) : (
            <div className="hbar-list">
              {staffAges.map((r) => (
                <div className="hbar" key={r.name}>
                  <span className="name">{r.name}</span>
                  <span className="track"><span className="fill" style={{ width: `${r.width}%`, background: 'var(--teal-500)' }} /></span>
                  <span className="pct">{r.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
