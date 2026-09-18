// Thin fetch wrapper for the FastAPI backend (isu_infirmary_backend).
//
// In dev, Vite proxies /api to http://localhost:8000 (see vite.config.js), so
// requests stay same-origin. Set VITE_API_URL to call a backend elsewhere.
// The backend already emits camelCase JSON, so responses are used as-is.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

/** Called when an authenticated request gets a 401 (expired token, deactivated account). */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// FastAPI puts the reason in `detail`: a string for HTTPException, a list for 422s.
function errorMessage(body, status, path) {
  const detail = body?.detail;
  // A route that doesn't exist answers exactly "Not Found"; our own 404s say
  // what wasn't found ("Patient not found"). Make the missing-route case obvious.
  if (status === 404 && detail === 'Not Found') {
    return `This feature needs a backend endpoint that isn't available yet (${path.split('?')[0]}). See BACKEND_REQUIREMENTS.md.`;
  }
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => `${e.loc?.slice(1).join('.') || 'request'}: ${e.msg}`).join('; ');
  }
  return `The server returned an error (${status}). Make sure the backend is running and check its logs.`;
}

export async function request(path, { method = 'GET', query, body, auth = true } = {}) {
  let url = `${BASE_URL}/api${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== '') params.set(key, value);
    }
    if ([...params].length) url += `?${params}`;
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(res.status, errorMessage(data, res.status, `/api${path}`));
  }
  return data;
}
