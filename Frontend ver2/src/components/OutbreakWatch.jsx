/**
 * Health surveillance in Reports: weekly cases of each watched illness against
 * the normal level for this time of year (GET /api/surveillance/trend), plus
 * this week's cases per college (GET /api/surveillance/alerts).
 *
 * The charts are dependency-free inline SVG, like components/Charts.jsx.
 */
import { downloadCsv, toCsv } from '../lib/csv';
import Icon from './Icon';

const WEEK_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
/** 'YYYY-MM-DD' Monday → "Sep 8" */
const weekLabel = (day) => WEEK_DAY.format(new Date(`${day}T00:00:00Z`));

/** "about 4× normal", "about 1.4× normal", "below normal" or "normal". */
function timesNormal(cases, expected) {
  if (!expected) return cases ? 'above normal' : 'normal';
  const r = cases / expected;
  if (r >= 2) return `about ${Math.round(r)}× normal`;
  if (r >= 1.15) return `about ${r.toFixed(1)}× normal`;
  if (r <= 0.85) return 'below normal';
  return 'normal';
}

const casesText = (n) => `${n} case${n === 1 ? '' : 's'}`;

function OutbreakState({ loading, error, empty }) {
  if (loading) return <div className="sub">Loading…</div>;
  if (error) return <div className="sub">Couldn&rsquo;t load the outbreak data: {error}</div>;
  if (empty) return <div className="sub">No watched illnesses to show yet.</div>;
  return null;
}

/* ── One small line chart per illness ─────────────────────────────────── */

function IllnessChart({ complaint, points, progress }) {
  const W = 320;
  const H = 150;
  const pad = { t: 22, r: 14, b: 22, l: 26 };

  const max = Math.max(1, ...points.flatMap((p) => [p.cases, p.expected]));
  // Even top so the middle tick is a whole number too.
  const top = Math.max(2, Math.ceil(max / 2) * 2);
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, points.length - 1);
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const path = (key) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p[key])}`).join(' ');

  const last = points[points.length - 1];
  const alertNow = Boolean(last?.alert);
  const earlier = !alertNow && points.slice(0, -1).some((p) => p.alert);

  return (
    <div className={`ow-chart${alertNow ? ' alert' : ''}`}>
      <div className="ow-chart-head">
        <h4>{complaint}</h4>
        {alertNow && <span className="pill red"><span className="dot" />Alert this week</span>}
        {earlier && <span className="pill amber"><span className="dot" />Earlier alert</span>}
      </div>
      {last && (
        <div className="ow-now">
          This week{progress < 1 ? ' so far' : ''}: {casesText(last.cases)}, {timesNormal(last.cases, last.expected)}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${complaint}: weekly cases against the normal level`}>
        {[0, top / 2, top].map((v) => (
          <g key={v}>
            <line className="grid-line" x1={pad.l} y1={y(v)} x2={W - pad.r} y2={y(v)} />
            <text className="ow-axis" x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}

        <path className="ow-normal" d={path('expected')} />
        <path className="ow-cases" d={path('cases')} />

        {points.map((p, i) => (
          <g key={p.weekStart}>
            <circle className={`ow-dot${p.alert ? ' alert' : ''}`} cx={x(i)} cy={y(p.cases)} r={p.alert ? 5 : 3.2}>
              <title>
                {`${i === points.length - 1 ? 'This week' : `Week of ${weekLabel(p.weekStart)}`}: ${casesText(p.cases)}, normal ${p.expected.toFixed(1)}${p.alert ? ', outbreak alert' : ''}`}
              </title>
            </circle>
            <text className={`ow-val${p.alert ? ' alert' : ''}`} x={x(i)} y={y(p.cases) - (p.alert ? 9 : 7)} textAnchor="middle">
              {p.cases}
            </text>
          </g>
        ))}

        {points.length > 0 && (
          <>
            <text className="ow-axis" x={x(0)} y={H - 4} textAnchor="start">{weekLabel(points[0].weekStart)}</text>
            <text className="ow-axis" x={x(points.length - 1)} y={H - 4} textAnchor="end">This week</text>
          </>
        )}
      </svg>
    </div>
  );
}

/* ── This week by college ─────────────────────────────────────────────── */

function CollegeBars({ colleges, alerts }) {
  if (!colleges.length) return null;
  const alerting = new Set(alerts.map((a) => a.college));
  const max = Math.max(1, ...colleges.flatMap((c) => [c.cases, c.expected]));
  return (
    <div className="ow-colleges">
      <h4>This week by college <span className="sub">(the watched illnesses combined; the line marks the normal level)</span></h4>
      {colleges.map((c) => {
        const alert = alerting.has(c.college);
        return (
          <div className={`ow-college${alert ? ' alert' : ''}`} key={c.college}>
            <span className="ow-name">
              {alert && <Icon name="alert" size={15} />} {c.college}
            </span>
            <span className="ow-track" title={`${casesText(c.cases)}, normal about ${Math.round(c.expected)}`}>
              <span className="ow-fill" style={{ width: `${Math.max((c.cases / max) * 100, 1)}%` }} />
              <span className="ow-tick" style={{ left: `calc(${(c.expected / max) * 100}% - 1px)` }} />
            </span>
            <span className="ow-count">
              {casesText(c.cases)} (normal ≈ {Math.round(c.expected)}){alert && <b className="ow-flag"> ALERT</b>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const rangeText = (weeks) => (weeks.length ? `last ${weeks.length} weeks (${weekLabel(weeks[0])} – this week)` : 'last 8 weeks');

/** Reports / Analytics / Outbreak watch */
export function OutbreakWatchCard({ trend, alerts, loading, error }) {
  const weeks = trend?.weeks || [];
  const complaints = trend?.complaints || [];
  const progress = trend?.currentWeekProgress ?? 1;
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Outbreak watch</h3>
          <div className="sub">
            Weekly cases of each watched illness against the normal level for this time of year, {rangeText(weeks)}
          </div>
        </div>
        <div className="ow-legend">
          <span className="ow-key">
            <svg width="22" height="10" aria-hidden="true"><line className="ow-cases" x1="1" y1="5" x2="21" y2="5" /></svg>
            Cases
          </span>
          <span className="ow-key">
            <svg width="22" height="10" aria-hidden="true"><line className="ow-normal" x1="1" y1="5" x2="21" y2="5" /></svg>
            Normal level
          </span>
          <span className="ow-key">
            <svg width="12" height="12" aria-hidden="true"><circle className="ow-dot alert" cx="6" cy="6" r="5" /></svg>
            Outbreak alert
          </span>
        </div>
      </div>

      {loading || error || !complaints.length ? (
        <OutbreakState loading={loading} error={error} empty={!complaints.length} />
      ) : (
        <>
          <div className="ow-grid-charts">
            {complaints.map((c) => (
              <IllnessChart key={c.complaint} complaint={c.complaint} points={c.points} progress={progress} />
            ))}
          </div>
          <CollegeBars colleges={alerts?.colleges || []} alerts={alerts?.alerts || []} />
        </>
      )}
    </div>
  );
}

/** Reports / Tables / Outbreak watch: the same numbers as rows and columns. */
export function OutbreakTableCard({ trend, loading, error }) {
  const weeks = trend?.weeks || [];
  const complaints = trend?.complaints || [];
  const head = (w, i) => (i === weeks.length - 1 ? 'This week' : weekLabel(w));

  const exportCsv = () => {
    const columns = [
      { header: 'Illness', value: (c) => c.complaint },
      ...weeks.flatMap((w, i) => [
        { header: `${head(w, i)} cases`, value: (c) => c.points[i]?.cases ?? '' },
        { header: `${head(w, i)} normal`, value: (c) => c.points[i]?.expected ?? '' },
        { header: `${head(w, i)} alert`, value: (c) => (c.points[i]?.alert ? 'yes' : 'no') },
      ]),
    ];
    downloadCsv(`outbreak-watch_${weeks[0]}_to_${weeks[weeks.length - 1]}.csv`, toCsv(complaints, columns));
  };

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3>Outbreak watch</h3>
          <div className="sub">
            Weekly cases of each watched illness, {rangeText(weeks)}. Cells show cases (normal level). Red means an outbreak alert.
          </div>
        </div>
        <button className="btn btn-ghost btn-sm no-print" onClick={exportCsv} disabled={loading || !complaints.length}>
          <Icon name="download" size={15} /> CSV
        </button>
      </div>

      {loading || error || !complaints.length ? (
        <OutbreakState loading={loading} error={error} empty={!complaints.length} />
      ) : (
        <div className="table-card bordered">
          <table>
            <thead>
              <tr>
                <th>Illness</th>
                {weeks.map((w, i) => <th key={w} className="num">{head(w, i)}</th>)}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaint}>
                  <td className="nm">{c.complaint}</td>
                  {weeks.map((w, i) => {
                    const p = c.points[i];
                    return (
                      <td key={w} className={`num nowrap${p?.alert ? ' ow-alert-cell' : ''}`}>
                        {p ? `${p.cases} (${p.expected.toFixed(1)})${p.alert ? ' !' : ''}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
