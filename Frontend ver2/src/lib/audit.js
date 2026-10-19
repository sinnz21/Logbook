// Display metadata for audit-log actions (GET /api/audit-logs → action).
export const AUDIT_ACTIONS = {
  login: { label: 'Signed in', pill: 'teal', color: '#107a6b' },
  logout: { label: 'Signed out', pill: 'grey', color: '#9db4ae' },
  login_failed: { label: 'Failed sign-in', pill: 'red', color: '#c0392b' },
  create: { label: 'Added', pill: 'green', color: '#3ea892' },
  update: { label: 'Edited', pill: 'blue', color: '#2563eb' },
  delete: { label: 'Deleted', pill: 'amber', color: '#d9a13b' },
  backup: { label: 'Backup', pill: 'violet', color: '#7c3aed' },
  restore: { label: 'Restore', pill: 'violet', color: '#5b21b6' },
};

/** "visit" → "Visit record", for the Record column. */
export const AUDIT_ENTITIES = {
  visit: 'Visit record',
  patient: 'Patient',
  special_case: 'Special case flag',
  stock: 'Stock item',
  stock_request: 'Restock request',
  user: 'User account',
  settings: 'System settings',
  backup: 'Database backup',
  session: 'Session',
};
