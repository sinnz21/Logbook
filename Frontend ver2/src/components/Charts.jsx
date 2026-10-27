/**
 * The v2 design's three chart forms, as dependency-free inline SVG:
 * an area line chart, a donut, and a vertical bar chart.
 *
 * Each renders into a fixed viewBox and scales with its container, so they
 * stay crisp at any card width and print cleanly.
 */

/* ── Area line chart — "Visit trend" on the nurse dashboard ───────────── */

export function LineChart({ points, height = 250, yTicks = 4, highlight }) {
  const W = 760;
  const H = height;
  const pad = { t: 18, r: 14, b: 32, l: 38 };

  if (!points.length) return <div className="sub">No data in this range.</div>;

  const max = Math.max(1, ...points.map((p) => p.value));
  // Round the axis up to a friendly number so gridlines land on whole values.
  const step = Math.max(1, Math.ceil(max / yTicks / 5) * 5);
  const top = step * yTicks;

  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, points.length - 1);
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  const peakIndex = highlight ?? points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const peak = points[peakIndex];

  // Roughly six x labels, evenly spaced, so they never collide.
  const labelEvery = Math.max(1, Math.round(points.length / 6));

  return (
    <div className="chart-box">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Visit trend">
        <defs>
          <linearGradient id="areaFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#107a6b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#107a6b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = (top / yTicks) * i;
          return (
            <g key={v}>
              <line className="grid-line" x1={pad.l} y1={y(v)} x2={W - pad.r} y2={y(v)} />
              <text className="axis-label" x={pad.l - 10} y={y(v) + 4} textAnchor="end">{v}</text>
            </g>
          );
        })}

        <path d={area} fill="url(#areaFade)" />
        <path d={line} fill="none" stroke="#107a6b" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />

        {peak && (
          <g>
            <line className="grid-line" x1={x(peakIndex)} y1={y(peak.value)} x2={x(peakIndex)} y2={H - pad.b} strokeDasharray="3 3" />
            <circle cx={x(peakIndex)} cy={y(peak.value)} r="5" fill="#fff" stroke="#107a6b" strokeWidth="2.5" />
            <TipBubble x={x(peakIndex)} y={y(peak.value) - 16} text={`${peak.label}: ${peak.value} visits`} width={W} />
          </g>
        )}

        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <text
              key={p.label + i}
              className={`axis-label${i === peakIndex ? ' peak' : ''}`}
              x={x(i)}
              y={H - pad.b + 20}
              textAnchor="middle"
            >
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

/** Dark rounded callout, nudged inward so it never overflows the viewBox. */
function TipBubble({ x, y, text, width }) {
  const w = text.length * 6.6 + 20;
  const cx = Math.min(Math.max(x, w / 2 + 4), width - w / 2 - 4);
  return (
    <g>
      <rect x={cx - w / 2} y={y - 26} width={w} height={27} rx="8" fill="#0b3b35" />
      <text className="chart-tip-text" x={cx} y={y - 8} textAnchor="middle">{text}</text>
    </g>
  );
}

/* ── Donut — "Top complaints" ─────────────────────────────────────────── */

/** With onSelect, every slice except the folded "Others" can be clicked. */
const selectable = (onSelect, name) => Boolean(onSelect) && name !== 'Others';

export function Donut({ slices, size = 172, thickness = 26, centerValue, centerLabel, onSelect }) {
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;

  // Cumulative start angle per slice, computed without mutating across renders.
  const arcs = slices.map((s, i) => {
    const before = slices.slice(0, i).reduce((n, x) => n + x.value, 0);
    return {
      ...s,
      dash: (s.value / total) * circumference,
      offset: (before / total) * circumference,
    };
  });

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Breakdown">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />
        {arcs.map((s) => {
          const clickable = selectable(onSelect, s.name);
          return (
            <circle
              key={s.name}
              className={clickable ? 'slice-link' : undefined}
              onClick={clickable ? () => onSelect(s.name) : undefined}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${c} ${c})`}
            >
              {clickable && <title>{`${s.name}: show patients`}</title>}
            </circle>
          );
        })}
      </svg>
      {centerValue != null && (
        <div className="donut-center">
          <div className="v">{centerValue}</div>
          {centerLabel && <div className="l">{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}

/* ── Vertical bars — "Visits per month", "Sign-in activity" ───────────── */

/** `dense` tightens the spacing for charts with many bars (e.g. one per hour). */
export function BarChart({ bars, height = 230, dense = false }) {
  if (!bars.length) return <div className="sub">No data in this range.</div>;
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peak = bars.reduce((best, b, i) => (b.value > bars[best].value ? i : best), 0);

  return (
    <div className={`bars${dense ? ' dense' : ''}`} style={{ height }}>
      {bars.map((b, i) => (
        <div className={`bar-col${i === peak ? ' peak' : ''}`} key={b.label + i}>
          <span className="num">{b.value}</span>
          <div className="bar" style={{ height: `${Math.max((b.value / max) * 100, 2)}%` }} />
          <span className="lbl">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Horizontal bars — complaints, medicines, demographics ────────────── */

/** "12 · 34.5%" — the count first, then its share, so every bar has real numbers. */
export function CountPct({ count, pct, unit }) {
  return (
    <>
      {count}{unit ? ` ${unit}` : ''}
      {pct != null && <span className="share"> · {pct}%</span>}
    </>
  );
}

export function HBars({ rows, showValue = (r) => <CountPct count={r.count} pct={r.pct} /> }) {
  if (!rows.length) return <div className="sub">Nothing to show yet.</div>;
  return (
    <div className="hbar-list">
      {rows.map((r) => (
        <div className="hbar" key={r.name}>
          <div className="top">
            <span className="name">{r.name}</span>
            <span className="pct">{showValue(r)}</span>
          </div>
          <span className="track">
            <span className="fill" style={{ width: `${Math.max(r.width ?? r.pct, 1)}%`, background: r.color || 'var(--teal)' }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut + legend with counts and shares ────────────────────────────── */

export function DonutLegend({ rows, centerValue, centerLabel, size, onSelect }) {
  if (!rows.length) return <div className="sub">Nothing to show yet.</div>;
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <div className="donut-wrap">
      <Donut slices={rows} size={size} centerValue={centerValue ?? total} centerLabel={centerLabel} onSelect={onSelect} />
      <div className="donut-legend">
        {rows.map((r) => {
          const inner = (
            <>
              <span className="sw" style={{ background: r.color }} />
              <span className="name">{r.name}</span>
              <span className="pct"><CountPct count={r.count} pct={r.pct} /></span>
            </>
          );
          return selectable(onSelect, r.name) ? (
            <button
              type="button"
              className="legend-row legend-link"
              key={r.name}
              title={`Show patients with ${r.name}`}
              onClick={() => onSelect(r.name)}
            >
              {inner}
            </button>
          ) : (
            <div className="legend-row" key={r.name}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
