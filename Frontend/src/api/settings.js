import { request } from './client';

// GET/PATCH /api/settings — admin only, backed by the existing system_settings
// table. See "System Settings" in BACKEND_REQUIREMENTS.md.

export function getSettings() {
  return request('/settings');
}

export function updateSettings(payload) {
  return request('/settings', { method: 'PATCH', body: payload });
}
