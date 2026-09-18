import { request } from './client';

/** POST /api/auth/login → { accessToken, tokenType, userId, username, fullName, role } */
export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
}
