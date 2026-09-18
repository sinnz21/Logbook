import { useMemo, useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useVisitsInRange } from '../hooks/useVisits';
import { getPatterns } from '../api/insights';
import { clinicDay, presetRange } from '../lib/time';
import { topComplaintsFrom } from '../lib/insights';

// matchRate 0–1 → the Figma's strength pill.
function strength(rate) {
  if (rate >= 0.8) return { label: 'Very Strong Pattern', pill: 'high-stock' };
  if (rate >= 0.75) return { label: 'Strong Pattern', pill: 'high-stock' };
  return { label: 'Moderate Pattern', pill: 'low-stock' };
}

export default function Insights() {
  const [today] = useState(() => clinicDay(new Date()));
  const [preset, setPreset] = useState('month');
  const range = useMemo(() => presetRange(preset === 'year' ? 'month' : preset, today), [preset, today]);
  const from = preset === 'year' ? `${today.slice(0, 4)}-01-01` : range.from;

  const patterns = useAsync(() => getPatterns({ dateFrom: from, dateTo: range.to }), [from, range.to]);
  const visits = useVisitsInRange(from, range.to);
  const top = useMemo(() => topComplaintsFrom(visits.visits, { limit: 5 }), [visits.visits]);

  return (
    <div className="view active">
      <div className="page-head">
        <div><h1>Reports &amp; Health Insights</h1><div className="sub">Symptom associations · Usage patterns · Forecasts</div></div>
      </div>

      <div className="range-bar">
        <div className="presets">
          <button className={preset === 'week' ? 'active' : ''} onClick={() => setPreset('week')}>This Week</button>
          <button className={preset === 'month' ? 'active' : ''} onClick={() => setPreset('month')}>This Month</button>
          <button className={preset === 'year' ? 'active' : ''} onClick={() => setPreset('year')}>This Year</button>
        </div>
        <div className="live-note"><span className="dot"></span>Auto-updates on change</div>
      </div>

      <div className="card">
        <h3>Common Complaint &amp; Prescription Patterns</h3>
        <div className="sub" style={{ marginBottom: '12px' }}>Identifies symptoms that occur together frequently to optimize clinic preparedness.</div>
        {patterns.error && <div className="login-error">{patterns.error}</div>}
        <table>
          <thead>
            <tr>
              <th>When Patient Has (Symptom / Trigger)</th>
              <th>Commonly Associated With / Treatment Given</th>
              <th>Likelihood (Match Rate)</th>
              <th>Occurrence Strength</th>
            </tr>
          </thead>
          <tbody>
            {patterns.loading ? (
              <tr><td colSpan={4} className="sub empty-cell">Loading…</td></tr>
            ) : (patterns.data || []).length === 0 ? (
              <tr><td colSpan={4} className="sub empty-cell">Not enough tagged visits in this period to find patterns yet.</td></tr>
            ) : (
              patterns.data.map((p) => {
                const s = strength(p.matchRate);
                return (
                  <tr key={`${p.trigger}→${p.associatedWith}`}>
                    <td className="nm">{p.trigger}</td>
                    <td>{p.associatedWith}</td>
                    <td><strong style={{ color: 'var(--teal-700)' }}>{Math.round(p.matchRate * 100)}% of patients</strong> <span className="sub">({p.support} visits)</span></td>
                    <td><span className={`pill ${s.pill}`}>{s.label}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Most Common Complaints</h3>
        {visits.error && <div className="login-error">{visits.error}</div>}
        {top.length === 0 ? (
          <div className="sub">{visits.loading ? 'Loading…' : 'No visits in this period.'}</div>
        ) : (
          <div className="hbar-list">
            {top.map((c) => (
              <div className="hbar" key={c.name}>
                <span className="name">{c.name}</span>
                <span className="track"><span className="fill" style={{ width: `${c.pct}%`, background: c.color }}></span></span>
                <span className="pct">{c.pct}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
