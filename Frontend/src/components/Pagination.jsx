/**
 * The Figma's pager: "Show [50] per page" on the left, numbered pages on the
 * right with an ellipsis once the list gets long ("‹ 1 2 3 … 25 ›").
 */

/** Page numbers to render around `page`, with nulls standing in for ellipses. */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const shown = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out = [];
  let prev = 0;
  for (const p of shown) {
    if (prev && p - prev > 1) out.push(null);
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [25, 50, 100],
  label,
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="pagination-bar no-print">
      <div className="pg-size">
        {label ?? `Showing ${first}–${last} of ${total.toLocaleString()}`}{' '}
        <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
          {perPageOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>{' '}
        per page
      </div>

      <div className="pg-nav">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">‹</button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span className="pg-gap" key={`gap-${i}`}>…</span>
          ) : (
            <button
              key={p}
              className={p === page ? 'on' : ''}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">›</button>
      </div>
    </div>
  );
}
