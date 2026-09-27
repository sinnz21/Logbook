import Icon from './Icon';

/**
 * The design's pager: a count or "Show [50] per page" on the left, numbered
 * pages on the right with an ellipsis once the list gets long ("‹ 1 2 3 … 25 ›").
 *
 * Omit `onPerPageChange` to get the compact form used on the shorter tables,
 * which shows "Showing 1–5 of 12" instead of a page-size picker.
 */

/** Page numbers to render around `page`, with nulls standing in for ellipses. */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const shown = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  return shown.flatMap((p, i) => {
    const prev = shown[i - 1];
    return prev && p - prev > 1 ? [null, p] : [p];
  });
}

export default function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  perPageOptions = [25, 50, 100],
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <div className="pagination-bar no-print">
      {onPerPageChange ? (
        <div className="pg-size">
          Show
          <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))}>
            {perPageOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          per page
        </div>
      ) : (
        <div className="pg-size">Showing {first}–{last} of {total.toLocaleString()}</div>
      )}

      <div className="pg-nav">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <Icon name="chevronLeft" size={16} />
        </button>
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
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}
