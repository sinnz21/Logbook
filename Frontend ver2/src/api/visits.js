import { request } from './client';
import { addDays, parseApiDate, startOfClinicDay } from '../lib/time';

const MAX_PER_PAGE = 200; // backend limit (le=200)

/**
 * GET /api/visits → { items: VisitOut[], total, page, perPage }
 *
 * Only page/per_page/status/sort_by/order exist on the backend today. The
 * other filters (search, sex, year_level, program, department, patient_id,
 * date_from, date_to) are specified in BACKEND_REQUIREMENTS.md — until they
 * ship, FastAPI ignores unknown query params, so callers also filter the
 * returned rows client-side.
 */
export function listVisits({
  page = 1,
  perPage = 50,
  status,
  patientId,
  search,
  sex,
  yearLevel,
  program,
  department,
  dateFrom,
  dateTo,
  sortBy = 'started_at',
  order = 'desc',
} = {}) {
  return request('/visits', {
    query: {
      page,
      per_page: perPage,
      status,
      patient_id: patientId,
      search,
      sex,
      year_level: yearLevel,
      program,
      department,
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: sortBy,
      order,
    },
  });
}

/** POST /api/visits — nurse only. Stamps started_at server-side. */
export function createVisit(payload) {
  return request('/visits', { method: 'POST', body: payload });
}

/** PATCH /api/visits/{id} — correct vitals / complaint / notes after the fact. */
export function updateVisit(visitId, payload) {
  return request(`/visits/${visitId}`, { method: 'PATCH', body: payload });
}

/** DELETE /api/visits/{id} — soft delete (sets deleted_at). */
export function deleteVisit(visitId) {
  return request(`/visits/${visitId}`, { method: 'DELETE' });
}

/** POST /api/visits/{id}/sign-out — nurse only. Stamps ended_at server-side. */
export function signOutVisit(visitId, payload) {
  return request(`/visits/${visitId}/sign-out`, { method: 'POST', body: payload });
}

/**
 * Every visit started between two clinic days (inclusive, YYYY-MM-DD).
 *
 * Sends date_from/date_to so the backend can filter once it supports them,
 * and still walks the newest-first list and filters locally so it's correct
 * against today's backend too.
 */
export async function listVisitsBetween(from, to, { maxPages = 20, ...filters } = {}) {
  const start = startOfClinicDay(from);
  const end = startOfClinicDay(addDays(to, 1));
  const visits = [];

  for (let page = 1; page <= maxPages; page++) {
    const res = await listVisits({ ...filters, page, perPage: MAX_PER_PAGE, dateFrom: from, dateTo: to });
    for (const visit of res.items) {
      const startedAt = parseApiDate(visit.startedAt);
      if (startedAt < start) return visits;
      if (startedAt < end) visits.push(visit);
    }
    if (page * res.perPage >= res.total) break;
  }
  return visits;
}

/** Every visit matching the filters, across pages (for CSV export). */
export async function listAllVisits(filters = {}, { maxPages = 50 } = {}) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await listVisits({ ...filters, page, perPage: MAX_PER_PAGE });
    all.push(...res.items);
    if (page * res.perPage >= res.total) break;
  }
  return all;
}
