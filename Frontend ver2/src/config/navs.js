// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
// Grouping, labels and icons follow the Figma v2 sidebar. A `group` entry is a
// collapsible menu whose `children` are the real links.
const REPORTS_GROUP = {
  group: 'Reports',
  icon: 'chart',
  children: [
    { id: 'reports', label: 'Analytics' },
    { id: 'supply-report', label: 'Monthly supply report' },
    { id: 'report-tables', label: 'Report tables' },
  ],
};

export const NAVS = {
  nurse: [
    { section: 'Clinical' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'patient-records', label: 'Patient records', icon: 'clipboard' },
    { id: 'flag-cases', label: 'Priority & special cases', icon: 'flag' },
    { id: 'search-history', label: 'Search & history', icon: 'search' },
    { section: 'Supplies & reports' },
    { id: 'stock', label: 'Stock & supplies', icon: 'box', badge: 'lowStock' },
    REPORTS_GROUP,
    { id: 'full-lists', label: 'Full lists', icon: 'list' },
  ],
  admin: [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Management' },
    { id: 'stock-requests', label: 'Stock requests', icon: 'clipboardCheck', badge: 'pendingRequests' },
    { id: 'users', label: 'User management', icon: 'users' },
    REPORTS_GROUP,
    { id: 'full-lists', label: 'Full lists', icon: 'list' },
    { section: 'System' },
    { id: 'audit-log', label: 'Audit log', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],
};

/** Just the real links: section headers dropped, group children flattened. */
export const linksOf = (role) => NAVS[role].flatMap((n) => n.children || (n.id ? [n] : []));

// Views reachable outside the sidebar (drill-down and print pages) still need a
// breadcrumb label. Add visit record is opened from the button on Patient
// records, so it isn't in the sidebar or on the dashboard. The Reports
// sub-pages are listed here so the breadcrumb names the group too.
export const EXTRA_VIEW_LABELS = {
  'add-visit': 'Patient records / Add visit record',
  profile: 'Patient records / Patient profile',
  'medical-certificate': 'Medical certificate',
  'parental-notification': 'Parental notification',
  reports: 'Reports / Analytics',
  'supply-report': 'Reports / Monthly supply report',
  'report-tables': 'Reports / Report tables',
};
