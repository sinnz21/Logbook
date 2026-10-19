import { request } from './client';

/**
 * POST /api/auth/login → { accessToken, tokenType, userId, username, fullName, role }
 * The role comes from the account itself, so the login screen doesn't ask for it.
 */
export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
}

// Password reset by email — see "Password reset" in BACKEND_REQUIREMENTS.md.

/**
 * POST /api/auth/forgot-password → { expiresInSeconds }
 * Always answers 200, whether or not the email has an account, so the form
 * can't be used to find out which emails are registered.
 */
export function requestPasswordReset(email) {
  return request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
}

/** POST /api/auth/verify-reset-code → { resetToken } — 400 when the code is wrong or expired. */
export function verifyResetCode(email, code) {
  return request('/auth/verify-reset-code', { method: 'POST', body: { email, code }, auth: false });
}

/** POST /api/auth/reset-password → { ok: true } */
export function resetPassword(resetToken, newPassword) {
  return request('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword }, auth: false });
}
