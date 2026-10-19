// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
// Grouping, labels and icons follow the Figma v2 sidebar.
export const NAVS = {
  nurse: [
    { section: 'Clinical' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'patient-records', label: 'Patient records', icon: 'clipboard' },
    { id: 'flag-cases', label: 'Priority & special cases', icon: 'flag' },
    { id: 'search-history', label: 'Search & history', icon: 'search' },
    { section: 'Supplies & reports' },
    { id: 'stock', label: 'Stock & supplies', icon: 'box', badge: 'lowStock' },
    { id: 'reports', label: 'Reports', icon: 'chart' },
  ],
  admin: [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Management' },
    { id: 'stock-requests', label: 'Stock requests', icon: 'clipboardCheck', badge: 'pendingRequests' },
    { id: 'users', label: 'User management', icon: 'users' },
    { id: 'reports', label: 'Reports', icon: 'chart' },
    { section: 'System' },
    { id: 'audit-log', label: 'Audit log', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],
};

/** Just the real links, with the section headers dropped. */
export const linksOf = (role) => NAVS[role].filter((n) => n.id);

// Views reachable outside the sidebar (drill-down and print pages) still need a
// breadcrumb label. Add visit record is opened from the button on Patient
// records, so it isn't in the sidebar or on the dashboard.
export const EXTRA_VIEW_LABELS = {
  'add-visit': 'Patient records / Add visit record',
  profile: 'Patient records / Patient profile',
  'medical-certificate': 'Medical certificate',
  'parental-notification': 'Parental notification',
};
