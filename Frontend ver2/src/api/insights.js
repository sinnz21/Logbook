import { request } from './client';

/** GET /api/insights/patterns → PatternOut[] — see "Reports & Insights" in BACKEND_REQUIREMENTS.md. */
export function getPatterns({ dateFrom, dateTo } = {}) {
  return request('/insights/patterns', { query: { date_from: dateFrom, date_to: dateTo } });
}
