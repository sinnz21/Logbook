import { useMemo, useState } from 'react';
import { useApp } from '../context/useApp';
import { useVisitsInRange } from '../hooks/useVisits';
import { addDays, clinicDay, formatDate, presetRange } from '../lib/time';
import { summarize, visitsWithComplaint } from '../lib/insights';
import { getFullListTab, openFullListTab } from '../lib/fullListTab';
import { formatQty } from '../lib/format';
import { downloadCsv, toCsv } from '../lib/csv';
import Icon from '../components/Icon';

const TABS = {
  complaints: { label: 'Complaints / illnesses', countLabel: 'Visits', file: 'complaints' },
  medicines: { label: 'Medicines dispensed', countLabel: 'Units', file: 'medicines-dispensed', fmt: formatQty },
  departments: { label: 'Departments', countLabel: 'Visits', file: 'departments' },
};

const PRESETS = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  semester: 'Semester',
};

const rangeFor = (preset, today) =>
  preset === 'semester' ? { from: addDays(today, -179), to: today } : presetRange(preset, today);

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * The complete rankings behind the dashboard's top-5 cards, one tab each.
 * "View full list" on a card opens this page on its tab (lib/fullListTab.js).
 */
export default function FullLists() {
  const { openModal } = useApp();
  const [today] = useState(() => clinicDay(new Date()));
  const [tab, setTab] = useState(getFullListTab);
  const [preset, setPreset] = useState('month');
  const [range, setRange] = useState(() => rangeFor('month', clinicDay(new Date())));
  const [draft, setDraft] = useState(range);
  const [search, setSearch] = useState('');

  const changeTab = (next) => {
    openFullListTab(next);
    setTab(next);
  };

  const applyPreset = (p) => {
    const next = rangeFor(p, today);
    setPreset(p);
    setRange(next);
    setDraft(next);
  };

  const source = useVisitsInRange(range.from, range.to);
  const s = useMemo(() => summarize(source.visits), [source.visits]);
  const cfg = TABS[tab] || TABS.complaints;
  const fmt = cfg.fmt || ((n) => n);
  const isDepartments = tab === 'departments';
  const rangeLabel = `${formatDate(new Date(`${range.from}T00:00:00Z`))} – ${formatDate(new Date(`${range.to}T00:00:00Z`))}`;

  const ranked = useMemo(() => (s[tab] || []).map((r, i) => ({ ...r, rank: i + 1 })), [s, tab]);
  const q = search.trim().toLowerCase();
  const shown = q ? ranked.filter((r) => r.name.toLowerCase().includes(q)) : ranked;
  const shownTotal = shown.reduce((sum, r) => sum + r.count, 0);
  const shownPct = q ? round1(shown.reduce((sum, r) => sum + r.pct, 0)) : 100;

  const showPatients = (name) => openModal('complaintPatients', {
    complaint: name,
    visits: visitsWithComplaint(source.visits, name),
    rangeLabel,
  });

  const exportCsv = () => {
    const csv = toCsv(shown, [
      { header: 'Rank', value: (r) => r.rank },
      { header: 'Name', value: (r) => r.name },
      { header: cfg.countLabel, value: (r) => r.count },
      { header: '% of total', value: (r) => r.pct },
      ...(isDepartments ? [{ header: 'Most common complaint', value: (r) => r.topComplaint }] : []),
    ]);
    downloadCsv(`${cfg.file}_${range.from}_to_${range.to}.csv`, csv);
  };

  const cols = isDepartments ? 5 : 4;

  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Full lists</h1>
          <div className="sub">Every complaint, medicine and department, ranked, {rangeLabel}</div>
        </div>
      </div>

      <div className="segmented tabs-menu no-print" role="tablist">
        {Object.entries(TABS).map(([key, t]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={tab === key ? 'active' : ''} onClick={() => changeTab(key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="filter-card no-print">
        <div className="filter-row">
          <div className="segmented solid">
            {Object.entries(PRESETS).map(([key, label]) => (
              <button key={key} className={preset === key ? 'active' : ''} onClick={() => applyPreset(key)}>{label}</button>
            ))}
          </div>
          <div className="date-range">
            <span>From</span>
            <input type="date" value={draft.from} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, from: e.target.value }); }} />
            <span>to</span>
            <input type="date" value={draft.to} onChange={(e) => { setPreset('custom'); setDraft({ ...draft, to: e.target.value }); }} />
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setRange(draft)}>Apply</button>
        </div>
        <div className="filter-row">
          <div className="search-field">
            <Icon name="search" size={17} className="ic" />
            <input type="search" placeholder="Search this list…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {source.error && <div className="login-error" style={{ marginBottom: 14 }}>{source.error}</div>}

      <div className="card">
        <div className="card-head">
          <div>
            <h3>{cfg.label}</h3>
            <div className="sub">
              {source.loading
                ? 'Loading…'
                : `${ranked.length} entries, ${fmt(ranked.reduce((sum, r) => sum + r.count, 0))} ${cfg.countLabel.toLowerCase()} in total, from ${s.total} visits`}
              {tab === 'complaints' && ranked.length > 0 && '. Click an illness to see the patients.'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm no-print" onClick={exportCsv} disabled={!shown.length}>
            <Icon name="download" size={15} /> CSV
          </button>
        </div>

        <div className="table-card bordered">
          <table>
            <thead>
              <tr>
                <th style={{ width: 70 }}>Rank</th>
                <th>Name</th>
                <th className="num">{cfg.countLabel}</th>
                <th className="num">% of total</th>
                {isDepartments && <th>Most common complaint</th>}
              </tr>
            </thead>
            <tbody>
              {source.loading ? (
                <tr><td colSpan={cols} className="empty-cell">Loading…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={cols} className="empty-cell">{ranked.length ? 'No matches.' : 'Nothing recorded in this range.'}</td></tr>
              ) : (
                shown.map((r) => (
                  <tr key={r.name}>
                    <td className="sub">{r.rank}</td>
                    <td className="nm">
                      {tab === 'complaints' ? (
                        <button type="button" className="link-btn" title={`Show patients with ${r.name}`} onClick={() => showPatients(r.name)}>
                          {r.name}
                        </button>
                      ) : r.name}
                    </td>
                    <td className="num">{fmt(r.count)}</td>
                    <td className="num">{r.pct}%</td>
                    {isDepartments && <td>{r.topComplaint}</td>}
                  </tr>
                ))
              )}
            </tbody>
            {!source.loading && shown.length > 0 && (
              <tfoot>
                <tr>
                  <td />
                  <td>{q ? 'Total (shown)' : 'Total'}</td>
                  <td className="num">{fmt(shownTotal)}</td>
                  <td className="num">{shownPct}%</td>
                  {isDepartments && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
