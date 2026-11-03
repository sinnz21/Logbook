import { request } from './client';

/**
 * GET /api/surveillance/alerts → this week's possible outbreaks (any signed-in user).
 * alerts[]: { college, complaint, cases, timesNormal, previousWeekCases, test, headline, detail, message }
 * e.g. headline "Possible outbreak: Viral Flu in CCSICT", detail "7 cases this week, about 4× the normal rate".
 * colleges[]: { college, cases, expected } — this week's cases of the watched illnesses per college.
 */
export function getOutbreakAlerts(week) {
  return request('/surveillance/alerts', { query: { week } });
}

/**
 * GET /api/surveillance/trend?weeks=8 → weekly cases of each watched illness (any signed-in user).
 * { weeks: ['YYYY-MM-DD' Mondays, oldest first], currentWeekProgress: 0–1,
 *   complaints: [{ complaint, points: [{ weekStart, cases, expected, alert }] }] }
 */
export function getOutbreakTrend(weeks = 8) {
  return request('/surveillance/trend', { query: { weeks } });
}
