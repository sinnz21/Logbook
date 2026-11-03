// Filters Patient records opens with. A dashboard tile or an illness sets them
// just before navigating there; the page reads them once, then clears them so
// opening Patient records from the sidebar shows everything again.
let pending = null;

export function setRecordsFilter(filter) {
  pending = filter;
}

export function peekRecordsFilter() {
  return pending;
}

export function clearRecordsFilter() {
  pending = null;
}
