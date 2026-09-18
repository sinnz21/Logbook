// Keeps the signed-in user across page refreshes.
//
// sessionStorage (not localStorage) on purpose: the infirmary PC is shared,
// so closing the tab/browser should sign the nurse out. The token itself
// expires after ACCESS_TOKEN_EXPIRE_MINUTES (8 h — one shift) on the backend.
const KEY = 'isu-infirmary.session';

function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** Returns the saved login response ({ accessToken, userId, fullName, role, ... }) or null. */
export function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved?.accessToken && !tokenExpired(saved.accessToken)) return saved;
  } catch {
    // unreadable or blocked storage — treat as signed out
  }
  clearSession();
  return null;
}

export function saveSession(loginResponse) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(loginResponse));
  } catch {
    // storage blocked — the session just won't survive a refresh
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
