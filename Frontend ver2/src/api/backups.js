import { request } from './client';

// Admin only — see "Backup and recovery" in BACKEND_REQUIREMENTS.md.

/** GET /api/backups → [{ backupId, fileName, createdAt, sizeBytes, kind: 'manual' | 'automatic', createdByName }] */
export function listBackups() {
  return request('/backups');
}

/** POST /api/backups — takes a snapshot now and returns it. */
export function createBackup() {
  return request('/backups', { method: 'POST' });
}

/** POST /api/backups/{id}/restore — rolls the database back to that snapshot. */
export function restoreBackup(backupId) {
  return request(`/backups/${backupId}/restore`, { method: 'POST' });
}
