// Search text Stock & supplies opens with. Clicking a medicine on a chart sets
// it just before navigating there; the page reads it once, then clears it so
// opening Stock from the sidebar shows the full list again.
let pending = '';

export function setStockSearch(search) {
  pending = search;
}

export function peekStockSearch() {
  return pending;
}

export function clearStockSearch() {
  pending = '';
}
