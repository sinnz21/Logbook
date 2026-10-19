/**
 * The Insights content as dashboard chart cards. Each card takes rows from
 * summarize() (lib/insights.js), shows the top few as a chart with counts and
 * percentages, and opens the complete ranking in the "View full list" modal.
 */
import { useApp } from '../context/useApp';
import { rowsFrom, totalOf } from '../lib/insights';
import { formatQty } from '../lib/format';
import { BarChart, CountPct, DonutLegend, HBars } from './Charts';

/** Top `limit` rows with the remainder folded into "Others" — for donuts. */
const topWithOthers = (rows, limit) =>
  rowsFrom(new Map(rows.map((r) => [r.name, r.count])), { limit, others: true });

function FullListButton({ title, rows, nameLabel, countLabel, formatCount, limit }) {
  const { openModal } = useApp();
  if (rows.length <= limit) return null;
  return (
    <button
      className="btn btn-soft btn-sm no-print"
      onClick={() => openModal('fullList', { title, rows, nameLabel, countLabel, formatCount })}
    >
      View full list ({rows.length})
    </button>
  );
}

function ChartCard({ title, sub, action, loading, empty, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {action}
      </div>
      {loading ? <div className="sub">Loading…</div> : empty ? <div className="sub">{empty}</div> : children}
    </div>
  );
}

export function MonthlyVisitsCard({ perMonth, loading }) {
  const total = perMonth.reduce((sum, m) => sum + m.value, 0);
  const avg = perMonth.length ? Math.round(total / perMonth.length) : 0;
  return (
    <ChartCard
      title="Visits per month"
      sub={perMonth.length ? `${total} visits over ${perMonth.length} months, about ${avg} a month` : null}
      loading={loading}
      empty={!perMonth.length && 'No visits in this range.'}
    >
      <BarChart bars={perMonth} />
    </ChartCard>
  );
}

export function ComplaintsCard({ rows, loading, title = 'Top complaints', limit = 5 }) {
  return (
    <ChartCard
      title={title}
      sub={rows.length ? `${totalOf(rows)} complaint tags, ${rows.length} kinds` : 'Across the selected range'}
      loading={loading}
      empty={!rows.length && 'No complaints recorded in this range.'}
      action={<FullListButton title="All complaints / illnesses" rows={rows} nameLabel="Complaint" countLabel="Visits" limit={limit} />}
    >
      <DonutLegend rows={topWithOthers(rows, limit)} centerLabel="tags" />
    </ChartCard>
  );
}

export function MedicinesCard({ rows, loading, limit = 5 }) {
  const fmt = (n) => formatQty(n);
  return (
    <ChartCard
      title={`Top ${limit} most requested medicines`}
      sub={rows.length ? `${fmt(totalOf(rows))} units dispensed, ${rows.length} medicines` : 'Units dispensed in the range'}
      loading={loading}
      empty={!rows.length && 'Nothing dispensed in this range yet.'}
      action={<FullListButton title="All medicines dispensed" rows={rows} nameLabel="Medicine" countLabel="Units" formatCount={fmt} limit={limit} />}
    >
      <HBars rows={rows.slice(0, limit)} showValue={(r) => <CountPct count={fmt(r.count)} pct={r.pct} unit="units" />} />
    </ChartCard>
  );
}

export function ClientBreakdownCard({ rows, loading }) {
  return (
    <ChartCard title="Client breakdown" sub="Who the clinic serves" loading={loading} empty={!rows.length && 'No visits in this range.'}>
      <DonutLegend rows={rows} centerLabel="visits" />
    </ChartCard>
  );
}

export function DispositionsCard({ rows, loading }) {
  return (
    <ChartCard title="Visit outcomes" sub="Where patients went after their visit" loading={loading} empty={!rows.length && 'No completed visits in this range.'}>
      <DonutLegend rows={rows} centerLabel="completed" />
    </ChartCard>
  );
}

export function DepartmentsCard({ rows, loading, limit = 5 }) {
  return (
    <ChartCard
      title="Highest visiting departments"
      sub="Visits and share of the total"
      loading={loading}
      empty={!rows.length && 'No department data in this range.'}
      action={<FullListButton title="All departments" rows={rows} nameLabel="Department or college" countLabel="Visits" limit={limit} />}
    >
      <HBars rows={rows.slice(0, limit)} />
    </ChartCard>
  );
}

export function StudentDemographicsCard({ years, sex, loading }) {
  return (
    <ChartCard title="Student demographics" sub="By year level and gender" loading={loading} empty={!years.length && !sex.length && 'No student visits in this range.'}>
      {sex.length > 0 && <div style={{ marginBottom: 18 }}><DonutLegend rows={sex} size={130} centerLabel="students" /></div>}
      <HBars rows={years} />
    </ChartCard>
  );
}

export function StaffAgesCard({ rows, loading }) {
  return (
    <ChartCard
      title="Faculty and staff by age"
      sub="Age groups matter for blood pressure checks"
      loading={loading}
      empty={!rows.length && 'No age data for faculty or staff visits in this range.'}
    >
      <HBars rows={rows} />
    </ChartCard>
  );
}

/** Treatment pairings as bars: how often the treatment follows the complaint. */
export function PairingsCard({ patterns, loading, error }) {
  const rows = (patterns || []).map((p) => ({
    name: `${p.trigger} → ${p.associatedWith}`,
    count: p.support,
    pct: Math.round(p.matchRate * 100),
    width: Math.round(p.matchRate * 100),
  }));
  return (
    <ChartCard
      title="Common treatment pairings"
      sub="How often each complaint receives the same treatment"
      loading={loading}
      empty={error || (!rows.length && 'Not enough tagged visits in this period to find patterns yet.')}
    >
      <HBars rows={rows} showValue={(r) => <>{r.pct}%<span className="share"> of {r.count} visits</span></>} />
    </ChartCard>
  );
}
