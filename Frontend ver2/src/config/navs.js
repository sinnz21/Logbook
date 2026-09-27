// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
// Grouping, labels and icons follow the Figma v2 sidebar.
export const NAVS = {
  nurse: [
    { section: 'Clinical' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'add-visit', label: 'Add visit record', icon: 'plusSquare' },
    { id: 'patient-records', label: 'Patient records', icon: 'clipboard' },
    { id: 'flag-cases', label: 'Priority & special cases', icon: 'flag' },
    { id: 'search-history', label: 'Search & history', icon: 'search' },
    { section: 'Supplies & reports' },
    { id: 'stock', label: 'Stock & supplies', icon: 'box', badge: 'lowStock' },
    { id: 'insights', label: 'Insights', icon: 'chart' },
  ],
  admin: [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Management' },
    { id: 'stock-requests', label: 'Stock requests', icon: 'clipboardCheck', badge: 'pendingRequests' },
    { id: 'users', label: 'User management', icon: 'users' },
    { section: 'System' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],
};

/** Just the real links, with the section headers dropped. */
export const linksOf = (role) => NAVS[role].filter((n) => n.id);

// Views reachable outside the sidebar (drill-down and print pages) still need a
// breadcrumb label.
export const EXTRA_VIEW_LABELS = {
  profile: 'Patient records / Patient profile',
  'medical-certificate': 'Medical certificate',
  'parental-notification': 'Parental notification',
};
