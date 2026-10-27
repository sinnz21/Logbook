// Which tab the Full lists page opens on. A "View full list" button sets it
// just before navigating there, so the page lands on the matching list.
let tab = 'complaints';

export function openFullListTab(next) {
  tab = next;
}

export function getFullListTab() {
  return tab;
}
