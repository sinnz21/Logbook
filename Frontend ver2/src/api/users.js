import { request } from './client';

// Targets endpoints that don't exist yet — see "User Management" in
// BACKEND_REQUIREMENTS.md. Admin only (require_admin).

/** GET /api/users → Page[UserOut] */
export function listUsers({ page = 1, perPage = 100 } = {}) {
  return request('/users', { query: { page, per_page: perPage } });
}

/** POST /api/users — password is hashed server-side, never stored plain. */
export function createUser(payload) {
  return request('/users', { method: 'POST', body: payload });
}

/** PATCH /api/users/{id} — any subset of fields; `password` resets it. */
export function updateUser(userId, payload) {
  return request(`/users/${userId}`, { method: 'PATCH', body: payload });
}
