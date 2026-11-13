// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
// Grouping, labels and icons follow the Figma v2 sidebar. A `group` entry is a
// collapsible menu whose `children` are the real links, or further groups.
import { ANALYTICS_SECTIONS, TABLE_SECTIONS } from './reportSections';

const ANALYTICS_GROUP = {
  group: 'Analytics',
  children: ANALYTICS_SECTIONS.map(({ id, label }) => ({ id, label })),
};

const TABLES_GROUP = {
  group: 'Tables',
  children: TABLE_SECTIONS.map(({ id, label }) => ({ id, label })),
};

const REPORTS_GROUP = {
  group: 'Reports',
  icon: 'chart',
  children: [
    ANALYTICS_GROUP,
    TABLES_GROUP,
    { id: 'supply-report', label: 'Monthly supply report' },
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
  ],
  admin: [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { section: 'Management' },
    { id: 'stock-requests', label: 'Stock requests', icon: 'clipboardCheck', badge: 'pendingRequests' },
    { id: 'users', label: 'User management', icon: 'users' },
    // Admins only get the monthly supply report; the clinical analytics and tables are for nurses.
    { id: 'supply-report', label: 'Monthly supply report', icon: 'chart' },
    { section: 'System' },
    { id: 'audit-log', label: 'Audit log', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ],
};

/** Real links under a list of nav items: section headers dropped, groups flattened at any depth. */
const flatten = (items) => items.flatMap((n) => (n.children ? flatten(n.children) : n.id ? [n] : []));

/** Just the real links for a role. */
export const linksOf = (role) => flatten(NAVS[role]);

/** "Reports / Analytics / Busiest hours" for every page under the Reports group. */
function reportCrumbs(items, path) {
  return Object.fromEntries(items.flatMap((n) => (n.children
    ? Object.entries(reportCrumbs(n.children, [...path, n.group]))
    : [[n.id, [...path, n.label].join(' / ')]])));
}

// Views reachable outside the sidebar (drill-down and print pages) still need a
// breadcrumb label. Add visit record is opened from the button on Patient
// records, so it isn't in the sidebar or on the dashboard. The Reports
// sub-pages are listed here so the breadcrumb names the group too.
export const EXTRA_VIEW_LABELS = {
  'add-visit': 'Patient records / Add visit record',
  profile: 'Patient records / Patient profile',
  'medical-certificate': 'Medical certificate',
  'parental-notification': 'Parental notification',
  ...reportCrumbs(REPORTS_GROUP.children, [REPORTS_GROUP.group]),
};
