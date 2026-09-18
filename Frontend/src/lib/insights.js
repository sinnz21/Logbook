// Client-side stand-in for the "Top Complaints" donut.
//
// The real aggregation belongs on the backend (an insights.py endpoint
// grouping visit_complaints — see ISU_Infirmary_Database_Plan_v2 §8), but that
// route doesn't exist yet. This tallies the `complaints` array the visits
// endpoint already returns for whatever page of visits is loaded client-side.
const PALETTE = ['#137a6d', '#1a9484', '#6fb8ac', '#b8790f', '#c8d6d2'];
const CIRCUMFERENCE = 100; // matches the mockup's r=15.9 donut (2*pi*r ~= 99.9)

export function topComplaintsFrom(visits, { limit = 4 } = {}) {
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

  let offset = 0;
  return slices.map(([name, count], i) => {
    const pct = Math.round((count / total) * 100);
    const dash = (pct / 100) * CIRCUMFERENCE;
    const entry = {
      name,
      pct,
      color: PALETTE[i % PALETTE.length],
      dasharray: `${dash.toFixed(1)} ${(CIRCUMFERENCE - dash).toFixed(1)}`,
      dashoffset: -offset,
    };
    offset += dash;
    return entry;
  });
}
