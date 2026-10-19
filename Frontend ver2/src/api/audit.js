import { request } from './client';

// Admin only — see "Audit log" in BACKEND_REQUIREMENTS.md.

/**
 * GET /api/audit-logs → Page[AuditLogOut]
 * AuditLogOut: { logId, at, userId, username, fullName, role, action, entity, entityId, details }
 * action is one of: login, login_failed, logout, create, update, delete, backup, restore.
 */
export function listAuditLogs({ page = 1, perPage = 50, action, userId, search, dateFrom, dateTo } = {}) {
  return request('/audit-logs', {
    query: {
      page,
      per_page: perPage,
      action,
      user_id: userId,
      search,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
}
