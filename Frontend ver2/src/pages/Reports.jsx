import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { getPatterns } from '../api/insights';
import { getOutbreakAlerts, getOutbreakTrend } from '../api/surveillance';
import { SECTION_INFO } from '../config/reportSections';
import { addDays, clinicDay, formatDate } from '../lib/time';
import { summarize } from '../lib/insights';
import { downloadCsv, toCsv } from '../lib/csv';
import {
  BusiestHoursCard, ClientBreakdownCard, ComplaintsCard, DepartmentsCard, DispositionsCard, MedicinesCard,
  MonthlyVisitsCard, PairingsCard, StaffAgesCard, StudentDemographicsCard, WeekdayCard,
} from '../components/InsightCards';
import { OutbreakTableCard, OutbreakWatchCard } from '../components/OutbreakWatch';
import Icon from '../components/Icon';

const MONTH_LONG = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'long', year: 'numeric' });

const PRESETS = {
  today: { label: 'Today', days: 0 },
  '7d': { label: 'Past 7 days', days: 6 },
  '30d': { label: 'Past 30 days', days: 29 },
  semester: { label: 'Semester', days: 179 },
};

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

/**
 * One Reports page: mode 'charts' is a Reports / Analytics page, mode 'table'
 * a Reports / Tables page, and `section` picks the chart or table (see
 * config/reportSections.js and config/reportViews.jsx).
 */
export default function Reports({ mode = 'charts', section }) {
  const info = SECTION_INFO[mode][section] || { label: 'Reports' };
  const isOutbreak = section === 'outbreak';
  const [today] = useState(() => clinicDay(new Date()));
  const [preset, setPreset] = useState('semester');
  const [committed, setCommitted] = useState(() => ({ from: addDays(clinicDay(new Date()), -179), to: clinicDay(new Date()) }));
  const [draft, setDraft] = useState(committed);
  const [filters, setFilters] = useState({ sex: '', yearLevel: '', program: '', department: '' });

  const applyPreset = (key) => {
    const next = { from: addDays(today, -PRESETS[key].days), to: today };
    setPreset(key);
    setCommitted(next);
    setDraft(next);
  };

  const patterns = useAsync(
    () => (section === 'pairings' ? getPatterns({ dateFrom: committed.from, dateTo: committed.to }) : Promise.resolve(null)),
    [section, committed.from, committed.to],
  );
  // Outbreak watch always covers the last 8 weeks, whatever the range above says.
  const trend = useAsync(() => (isOutbreak ? getOutbreakTrend(8) : Promise.resolve(null)), [isOutbreak]);
  const alerts = useAsync(
    () => (isOutbreak && mode === 'charts' ? getOutbreakAlerts() : Promise.resolve(null)),
    [isOutbreak, mode],
  );
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
  const rangeLabel = `${formatDate(new Date(`${committed.from}T00:00:00Z`))} – ${formatDate(new Date(`${committed.to}T00:00:00Z`))}`;

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

  // Reports / Analytics: exactly one card for the section.
  const chart = () => {
    switch (section) {
      case 'months': return <MonthlyVisitsCard perMonth={s.perMonth} loading={loading} />;
      case 'weekday': return <WeekdayCard bars={s.byWeekday} loading={loading} />;
      case 'hours': return <BusiestHoursCard bars={s.byHour} loading={loading} />;
      case 'outcomes': return <DispositionsCard rows={s.dispositions} loading={loading} />;
      case 'complaints':
        return (
          <ComplaintsCard title="Frequent complaints" limit={10} rows={s.complaints} loading={loading}
            visits={visits} range={committed} rangeLabel={rangeLabel} />
        );
      case 'medicines': return <MedicinesCard rows={s.medicines} loading={loading} limit={10} />;
      case 'pairings': return <PairingsCard patterns={patterns.data} loading={patterns.loading} error={patterns.error} />;
      case 'clients': return <ClientBreakdownCard rows={s.clients} loading={loading} />;
      case 'departments': return <DepartmentsCard rows={s.departments} loading={loading} limit={10} />;
      case 'students': return <StudentDemographicsCard years={s.studentYears} sex={s.studentSex} loading={loading} />;
      case 'staffAges': return <StaffAgesCard rows={s.staffAges} loading={loading} />;
      case 'outbreak':
        return <OutbreakWatchCard trend={trend.data} alerts={alerts.data} loading={trend.loading} error={trend.error} />;
      default: return null;
    }
  };

  // Reports / Tables: exactly one table for the section.
  const table = () => {
    if (isOutbreak) return <OutbreakTableCard trend={trend.data} loading={trend.loading} error={trend.error} />;
    if (loading || (section === 'pairings' && patterns.loading)) return <div className="card"><div className="sub">Loading…</div></div>;
    switch (section) {
      case 'months':
        return (
          <ReportTable title="Visits per month" rows={monthRows} filename={`visits-per-month_${suffix}`}
            columns={withTotal(rankColumns('Month'))} />
        );
      case 'outcomes':
        return (
          <ReportTable title="Visit outcomes" rows={s.dispositions} filename={`visit-outcomes_${suffix}`}
            columns={withTotal(rankColumns('Disposition'))} />
        );
      case 'pairings':
        return (
          <ReportTable
            title="Common treatment pairings"
            sub={patterns.error || undefined}
            rows={(patterns.data || []).map((p) => ({ ...p, name: `${p.trigger} → ${p.associatedWith}` }))}
            filename={`treatment-pairings_${suffix}`}
            columns={[
              { header: 'Complaint', value: (r) => r.trigger, className: 'nm' },
              { header: 'Commonly receives', value: (r) => r.associatedWith },
              { header: 'Match rate', value: (r) => `${Math.round(r.matchRate * 100)}%`, csv: (r) => Math.round(r.matchRate * 100), csvHeader: 'Match rate (%)', num: true },
              { header: 'Visits', value: (r) => r.support, num: true },
            ]}
          />
        );
      case 'clients':
        return (
          <ReportTable title="Client breakdown" rows={s.clients} filename={`client-breakdown_${suffix}`}
            columns={withTotal(rankColumns('Client type'))} />
        );
      case 'studentYears':
        return (
          <ReportTable title="Students by year level" rows={s.studentYears} filename={`student-years_${suffix}`}
            columns={withTotal(rankColumns('Year level'))} />
        );
      case 'studentGender':
        return (
          <ReportTable title="Students by gender" rows={s.studentSex} filename={`student-gender_${suffix}`}
            columns={withTotal(rankColumns('Gender'))} />
        );
      case 'staffAges':
        return (
          <ReportTable title="Faculty & staff by age" rows={s.staffAges} filename={`staff-ages_${suffix}`}
            columns={withTotal(rankColumns('Age group'))} />
        );
      default: return null;
    }
  };

  const sub = mode === 'table' ? 'Rows and columns with CSV export' : info.sub;

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>{info.label}</h1>
          <div className="sub">{sub}{isOutbreak ? '' : `, ${s.total} visits in this range`}</div>
        </div>
        <div className="head-actions no-print">
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="printer" size={17} /> Print report
          </button>
        </div>
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
        </div>
      </div>

      {source.error && !isOutbreak && <div className="login-error" style={{ marginBottom: 14 }}>{source.error}</div>}

      {isOutbreak && (
        <div className="info-note">
          <Icon name="alert" size={18} />
          <span>Outbreak watch always shows the last 8 weeks, so the date range and filters above don&rsquo;t change it.</span>
        </div>
      )}

      {mode === 'charts' ? chart() : table()}
    </div>
  );
}
