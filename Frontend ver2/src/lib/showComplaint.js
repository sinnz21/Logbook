// Where a click on a dashboard or report item leads. Patient records and
// Stock & supplies are nurse screens, so for admins these return false and the
// caller falls back (or does nothing).
import { visitsWithComplaint } from './insights';
import { setRecordsFilter } from './recordsFilter';
import { setStockSearch } from './stockFilter';

/** Opens Patient records with `filter` applied. app: useApp(). */
export function openRecords({ role, navigate }, filter) {
  if (role !== 'nurse') return false;
  setRecordsFilter(filter);
  navigate('patient-records');
  return true;
}

/** Opens Stock & supplies searched to `name`, to see how many are left. */
export function openStock({ role, navigate }, name) {
  if (role !== 'nurse') return false;
  setStockSearch(name);
  navigate('stock');
  return true;
}

/**
 * An illness was clicked. Nurses go to Patient records filtered to it and the
 * date range; admins get the "Patients with <illness>" popup.
 */
export function showComplaint(app, { name, visits, range, rangeLabel }) {
  if (openRecords(app, { complaint: name, dateFrom: range?.from || '', dateTo: range?.to || '' })) return;
  app.openModal('complaintPatients', { complaint: name, visits: visitsWithComplaint(visits || [], name), rangeLabel });
}
