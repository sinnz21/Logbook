// Client-side stand-in for the complaint aggregations the Insights and
// dashboard screens need.
//
// The real aggregation belongs on the backend (an insights.py endpoint
// grouping visit_complaints — see ISU_Infirmary_Database_Plan_v2 §8), but that
// route doesn't exist yet. This tallies the `complaints` array the visits
// endpoint already returns for whatever page of visits is loaded client-side.

/** Slice colours, in the order the v2 design uses them. */
export const CHART_COLORS = ['#107a6b', '#3ea892', '#8ecabb', '#d9a13b', '#cbd8d4', '#6b9e93'];

/**
 * Returns [{ name, count, pct, value, color }] sorted high → low, with a
 * trailing "Others" bucket once the list runs past `limit`. `value` is the raw
 * count, which is what <Donut> sizes its arcs from.
 */
export function topComplaintsFrom(visits, { limit = 5 } = {}) {
  const counts = new Map();
  for (const visit of visits) {
    const tags = visit.complaints?.length ? visit.complaints : [visit.chiefComplaint];
    for (const tag of tags) {
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit);
  const otherCount = sorted.slice(limit).reduce((sum, [, n]) => sum + n, 0);
  const slices = otherCount > 0 ? [...top, ['Others', otherCount]] : top;

  const max = Math.max(...slices.map(([, n]) => n));
  return slices.map(([name, count], i) => ({
    name,
    count,
    value: count,
    pct: Math.round((count / total) * 1000) / 10, // one decimal, like the design
    width: Math.round((count / max) * 100),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** name → count map into the shape <HBars> expects. */
export function barsFrom(counts, { limit = 10, ofTotal = true } = {}) {
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!entries.length) return [];
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...entries.map(([, n]) => n));
  return entries.map(([name, count], i) => ({
    name,
    count,
    pct: Math.round((count / (ofTotal ? total : max)) * 100),
    width: Math.round((count / max) * 100),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

/** Counts a field (or derived value) across a list of rows. */
export function tally(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const value = typeof key === 'function' ? key(row) : row[key];
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}
