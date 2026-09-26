// Nav metadata per role — drives the sidebar AND the topbar breadcrumb.
// Keep 'id' values in sync with the view switch in App.jsx.
// Order and labels follow the Figma (LogbookISU) sidebar exactly.
export const NAVS = {
  nurse: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'add-visit', label: 'Add Visit Record' },
    { id: 'patient-records', label: 'Patient Records' },
    { id: 'flag-cases', label: 'Priority & Special Cases' },
    { id: 'search-history', label: 'Search & History' },
    { id: 'stock', label: 'Stock & Supplies' },
    { id: 'insights', label: 'Insights' },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'stock-requests', label: 'Stock Requests' },
    { id: 'users', label: 'User Management' },
    { id: 'settings', label: 'Settings' },
  ],
};

// Views reachable outside the sidebar (drill-down and print pages) still need a
// breadcrumb label.
export const EXTRA_VIEW_LABELS = {
  profile: 'Patient Records',
  'medical-certificate': 'Medical Certificate',
  'parental-notification': 'Parental Notification',
};
