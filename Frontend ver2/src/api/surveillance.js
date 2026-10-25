import { request } from './client';

/**
 * GET /api/surveillance/alerts → this week's possible outbreaks (any signed-in user).
 * alerts[]: { college, complaint, cases, timesNormal, previousWeekCases, test, headline, detail, message }
 * e.g. headline "Possible outbreak: Viral Flu in CCSICT", detail "7 cases this week, about 4× the normal rate".
 */
export function getOutbreakAlerts(week) {
  return request('/surveillance/alerts', { query: { week } });
}
