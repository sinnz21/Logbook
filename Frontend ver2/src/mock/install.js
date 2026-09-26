// Demo mode: answers /api/* from the in-memory dataset instead of the network,
// so the whole UI can be clicked through without the FastAPI backend running.
//
// Enabled only when VITE_DEMO=true (npm run demo). main.jsx imports this
// dynamically, so none of it reaches a normal production build.
import { handle, HttpError } from './handlers.js';

const LATENCY_MS = 120; // enough to show the "Loading…" states

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function installMockApi() {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = (init.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();

    // Anything that isn't an API call goes to the network untouched.
    if (typeof url !== 'string') return realFetch(input, init);
    let parsed;
    try {
      parsed = new URL(url, window.location.origin);
    } catch {
      return realFetch(input, init);
    }
    if (!parsed.pathname.startsWith('/api/')) return realFetch(input, init);

    const path = parsed.pathname.slice('/api'.length);
    const query = Object.fromEntries(parsed.searchParams.entries());
    let body;
    if (init.body) {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = undefined;
      }
    }

    await sleep(LATENCY_MS);

    try {
      const data = handle(method, path, query, body);
      return jsonResponse(200, data ?? null);
    } catch (e) {
      if (e instanceof HttpError) return jsonResponse(e.status, { detail: e.detail });
      // A bug in the mock itself — surface it rather than swallowing it.
      console.error('[demo] handler failed:', method, path, e);
      return jsonResponse(500, { detail: `Demo data error: ${e.message}` });
    }
  };

  showBadge();
  console.info('%c[demo mode] /api is served from in-memory sample data. Changes reset on reload.', 'color:#137a6d;font-weight:bold');
}

/** A small corner badge, so demo data is never mistaken for the real thing. */
function showBadge() {
  const badge = document.createElement('div');
  badge.textContent = 'DEMO DATA';
  badge.title = 'Served from src/mock — no backend connected. Changes reset on reload.';
  Object.assign(badge.style, {
    position: 'fixed',
    bottom: '12px',
    right: '12px',
    zIndex: '9999',
    background: '#b8790f',
    color: '#fff',
    font: '700 10px/1 -apple-system, Segoe UI, sans-serif',
    letterSpacing: '0.6px',
    padding: '6px 10px',
    borderRadius: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
    pointerEvents: 'none',
  });
  document.body.appendChild(badge);
}
