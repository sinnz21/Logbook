// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
export const NAVS = {
  nurse: [
    { id: 'dashboard', ic: '▦', label: 'Dashboard' },
    { id: 'visit-hub', ic: '▤', label: 'Visit Records' },
    { id: 'flag-cases', ic: '🚩', label: 'Priority & Special Cases' },
    { id: 'stock', ic: '⚕', label: 'Stock & Supplies' },
    { id: 'insights', ic: '📈', label: 'Reports & Insights' },
  ],
  admin: [
    { id: 'dashboard', ic: '▦', label: 'Dashboard' },
    { id: 'users', ic: '👥', label: 'User Management' },
    { id: 'settings', ic: '⚙', label: 'Settings' },
  ],
};

// Views reachable outside the sidebar (drill-down pages) still need a breadcrumb label.
export const EXTRA_VIEW_LABELS = {
  profile: 'Patient Profile',
};
