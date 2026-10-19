import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { getPatterns } from '../api/insights';
import { addDays, clinicDay } from '../lib/time';
import { summarize } from '../lib/insights';
import { formatQty } from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';
import {
  ClientBreakdownCard, ComplaintsCard, DepartmentsCard, DispositionsCard, MedicinesCard,
  MonthlyVisitsCard, PairingsCard, StaffAgesCard, StudentDemographicsCard,
} from '../components/InsightCards';
import Icon from '../components/Icon';
import MonthlySupplyReport from '../components/MonthlySupplyReport';

const MONTH_LONG = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' });

const PRESETS = {
  '7d': { label: 'Past 7 days', days: 6 },
  '30d': { label: 'Past 30 days', days: 29 },
  semester: { label: 'Semester', days: 179 },
};

const VIEW_KEY = 'isu-infirmary.reports-view';

function savedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'charts';
  } catch {
    return 'charts';
  }
}

// Standard columns for a { name, count, pct } ranking.
const rankColumns = (nameLabel, countLabel = 'Visits', fmt = (n) => n) => [
  { header: '#', value: (r, i) => i + 1, className: 'sub', width: 50 },
  { header: nameLabel, value: (r) => r.name, className: 'nm' },
  { header: countLabel, value: (r) => fmt(r.count), num: true },
  { header: 'Share', value: (r) => `${r.pct}%`, csv: (r) => r.pct, csvHeader: 'Share (%)', num: true },
];

/** One report section as rows and columns, with its own CSV export. */
function ReportTable({ title, sub, rows, columns, filename }) {
  const exportCsv = () => {
    const csv = toCsv(rows.map((r, i) => ({ r, i })), columns.map((c) => ({
      header: c.csvHeader || c.header,
      value: ({ r, i }) => (c.csv ? c.csv(r, i) : c.value(r, i)),
    })));
    downloadCsv(`${filename}.csv`, csv);
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={exportCsv} disabled={!rows.length}>
          <Icon name="download" size={15} /> CSV
        </button>
      </div>
      <div className="table-card bordered">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={c.num ? 'num' : ''} style={c.width ? { width: c.width } : undefined}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-cell">Nothing recorded in this range.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.name ?? r.key ?? i}>
                  {columns.map((c) => (
                    <td key={c.header} className={[c.className, c.num && 'num'].filter(Boolean).join(' ')}>{c.value(r, i)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 1 && columns.some((c) => c.total) && (
            <tfoot>
              <tr>
                {columns.map((c, i) => (
                  <td key={c.header} className={c.num ? 'num' : ''}>{c.total ? c.total(rows) : i === 1 ? 'Total' : ''}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export default function Reports() {
  const [today] = useState(() => clinicDay(new Date()));
  const [view, setView] = useState(savedView);
  const [preset, setPreset] = useState('semester');
  const [committed, setCommitted] = useState(() => ({ from: addDays(clinicDay(new Date()), -179), to: clinicDay(new Date()) }));
  const [draft, setDraft] = useState(committed);
  const [filters, setFilters] = useState({ sex: '', yearLevel: '', program: '', department: '' });

  const changeView = (next) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // storage blocked — the choice just won't be remembered
    }
  };

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

  const s = useMemo(() => summarize(visits), [visits]);
  const loading = source.loading;
  const suffix = `${committed.from}_to_${committed.to}`;

  const monthRows = useMemo(() => {
    const total = s.perMonth.reduce((sum, m) => sum + m.value, 0) || 1;
    return s.perMonth.map((m) => ({
      name: MONTH_LONG.format(new Date(`${m.key}-15T00:00:00Z`)),
      count: m.value,
      pct: Math.round((m.value / total) * 1000) / 10,
    }));
  }, [s.perMonth]);

  const sumCount = (fmt = (n) => n) => (rows) => fmt(rows.reduce((sum, r) => sum + r.count, 0));
  const withTotal = (cols, fmt) => cols.map((c, i) => (i === 2 ? { ...c, total: sumCount(fmt) } : i === 3 ? { ...c, total: () => '100%' } : c));

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <div className="sub">Clinic trends from the visit records, {s.total} visits in this range</div>
        </div>
        <div className="head-actions no-print">
          <div className="segmented">
            <button className={view === 'charts' ? 'active' : ''} onClick={() => changeView('charts')}>
              <Icon name="chart" size={15} /> Charts
            </button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => changeView('table')}>
              <Icon name="table" size={15} /> Table
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="printer" size={17} /> Print report
          </button>
        </div>
      </div>

      {/* Always a table, in both the Charts and Table views, with its own month
          picker. It sits above the visit filters because they don't apply to it. */}
      <MonthlySupplyReport />

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
        </div>
      </div>

      {source.error && <div className="login-error" style={{ marginBottom: 14 }}>{source.error}</div>}

      {view === 'charts' ? (
        <>
          {/* chart-flow packs the cards into columns so a short card never leaves a gap. */}
          <div className="chart-flow">
            <MonthlyVisitsCard perMonth={s.perMonth} loading={loading} />
            <ComplaintsCard title="Frequent complaints" rows={s.complaints} loading={loading} />
            <MedicinesCard rows={s.medicines} loading={loading} />
            <PairingsCard patterns={patterns.data} loading={patterns.loading} error={patterns.error} />
            <ClientBreakdownCard rows={s.clients} loading={loading} />
            <DispositionsCard rows={s.dispositions} loading={loading} />
            <StaffAgesCard rows={s.staffAges} loading={loading} />
            <DepartmentsCard rows={s.departments} loading={loading} />
            <StudentDemographicsCard years={s.studentYears} sex={s.studentSex} loading={loading} />
          </div>
        </>
      ) : loading ? (
        <div className="card"><div className="sub">Loading…</div></div>
      ) : (
        <>
          <div className="chart-row even">
            <ReportTable title="Visits per month" rows={monthRows} filename={`visits-per-month_${suffix}`}
              columns={withTotal(rankColumns('Month'))} />
            <ReportTable title="Client breakdown" rows={s.clients} filename={`client-breakdown_${suffix}`}
              columns={withTotal(rankColumns('Client type'))} />
          </div>
          <ReportTable title="Complaints / illnesses" sub="A visit can carry more than one complaint tag" rows={s.complaints}
            filename={`complaints_${suffix}`} columns={withTotal(rankColumns('Complaint', 'Tags'))} />
          <ReportTable title="Medicines dispensed" rows={s.medicines} filename={`medicines_${suffix}`}
            columns={withTotal(rankColumns('Medicine', 'Units', formatQty), formatQty)} />
          <ReportTable title="Departments" rows={s.departments} filename={`departments_${suffix}`}
            columns={[...withTotal(rankColumns('Department or college')), { header: 'Most common complaint', value: (r) => r.topComplaint }]} />
          <div className="chart-row even">
            <ReportTable title="Visit outcomes" rows={s.dispositions} filename={`visit-outcomes_${suffix}`}
              columns={withTotal(rankColumns('Disposition'))} />
            <ReportTable title="Faculty and staff by age" rows={s.staffAges} filename={`staff-ages_${suffix}`}
              columns={withTotal(rankColumns('Age group'))} />
          </div>
          <div className="chart-row even">
            <ReportTable title="Students by year level" rows={s.studentYears} filename={`student-years_${suffix}`}
              columns={withTotal(rankColumns('Year level'))} />
            <ReportTable title="Students by gender" rows={s.studentSex} filename={`student-gender_${suffix}`}
              columns={withTotal(rankColumns('Gender'))} />
          </div>
          <ReportTable
            title="Common treatment pairings"
            rows={(patterns.data || []).map((p) => ({ ...p, name: `${p.trigger} → ${p.associatedWith}` }))}
            filename={`treatment-pairings_${suffix}`}
            columns={[
              { header: 'Complaint', value: (r) => r.trigger, className: 'nm' },
              { header: 'Commonly receives', value: (r) => r.associatedWith },
              { header: 'Match rate', value: (r) => `${Math.round(r.matchRate * 100)}%`, csv: (r) => Math.round(r.matchRate * 100), csvHeader: 'Match rate (%)', num: true },
              { header: 'Visits', value: (r) => r.support, num: true },
            ]}
          />
        </>
      )}
    </div>
  );
}
