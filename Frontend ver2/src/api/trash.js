import { request } from './client';

// Admin only. Soft-deleted patients and visits, kept for system_settings.soft_delete_days.

/** GET /api/trash → [{ kind: 'patient' | 'visit', id, label, detail, deletedAt, purgeAt }], newest first */
export function listTrash() {
  return request('/trash');
}

/** POST /api/trash/{kind}/{id}/restore — puts the record back where it was. */
export function restoreFromTrash(kind, id) {
  return request(`/trash/${kind}/${id}/restore`, { method: 'POST' });
}
