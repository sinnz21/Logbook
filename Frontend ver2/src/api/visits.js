import { request } from './client';
import { addDays, parseApiDate, startOfClinicDay } from '../lib/time';

const MAX_PER_PAGE = 1000; // backend limit (le=1000) — a year of visits is ~9 requests

/**
 * GET /api/visits → { items: VisitOut[], total, page, perPage }
 *
 * Only page/per_page/status/sort_by/order exist on the backend today. The
 * other filters (search, sex, year_level, program, department, patient_id,
 * date_from, date_to, complaint, medicine, referred) are specified in BACKEND_REQUIREMENTS.md — until they
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
  complaint,
  medicine,
  referred,
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
      complaint,
      medicine,
      referred,
      date_from: dateFrom,
      date_to: dateTo,
      sort_by: sortBy,
      order,
    },
  });
}

/** POST /api/visits — nurse only. Stamps started_at server-side. */
export function createVisit(payload) {
  clearRangeCache();
  return request('/visits', { method: 'POST', body: payload });
}

/** PATCH /api/visits/{id} — correct vitals / complaint / notes after the fact. */
export function updateVisit(visitId, payload) {
  clearRangeCache();
  return request(`/visits/${visitId}`, { method: 'PATCH', body: payload });
}

/** DELETE /api/visits/{id} — soft delete (sets deleted_at). */
export function deleteVisit(visitId) {
  clearRangeCache();
  return request(`/visits/${visitId}`, { method: 'DELETE' });
}

/** POST /api/visits/{id}/sign-out — nurse only. Stamps ended_at server-side. */
export function signOutVisit(visitId, payload) {
  clearRangeCache();
  return request(`/visits/${visitId}/sign-out`, { method: 'POST', body: payload });
}

/**
 * Every visit started between two clinic days (inclusive, YYYY-MM-DD).
 *
 * The backend filters by date_from/date_to; the rows are still checked here
 * so the result is right even against an older backend. After the first page
 * the rest are fetched in parallel, and the result is kept for a minute so
 * moving between Reports pages doesn't download the same year of visits again.
 * Any visit change below clears that cache.
 */
const rangeCache = new Map(); // key -> { at, promise }
const RANGE_CACHE_MS = 60_000;

function clearRangeCache() {
  rangeCache.clear();
}

async function fetchVisitsBetween(from, to, { maxPages = 60, ...filters } = {}) {
  const start = startOfClinicDay(from);
  const end = startOfClinicDay(addDays(to, 1));
  const query = { ...filters, perPage: MAX_PER_PAGE, dateFrom: from, dateTo: to };
  const first = await listVisits({ ...query, page: 1 });
  const pages = Math.min(maxPages, Math.ceil(first.total / first.perPage));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => listVisits({ ...query, page: i + 2 })),
  );
  return [first, ...rest]
    .flatMap((res) => res.items)
    .filter((visit) => {
      const startedAt = parseApiDate(visit.startedAt);
      return startedAt >= start && startedAt < end;
    });
}

export function listVisitsBetween(from, to, options = {}) {
  const key = JSON.stringify([from, to, options]);
  const hit = rangeCache.get(key);
  if (hit && Date.now() - hit.at < RANGE_CACHE_MS) return hit.promise;
  const promise = fetchVisitsBetween(from, to, options).catch((e) => {
    rangeCache.delete(key);
    throw e;
  });
  rangeCache.set(key, { at: Date.now(), promise });
  return promise;
}

/** Every visit matching the filters, across pages (for CSV export). Pages after the first load in parallel. */
export async function listAllVisits(filters = {}, { maxPages = 60 } = {}) {
  const first = await listVisits({ ...filters, page: 1, perPage: MAX_PER_PAGE });
  const pages = Math.min(maxPages, Math.ceil(first.total / first.perPage));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => listVisits({ ...filters, page: i + 2, perPage: MAX_PER_PAGE })),
  );
  return [first, ...rest].flatMap((res) => res.items);
}
