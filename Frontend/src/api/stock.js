import { request } from './client';

// Targets endpoints that don't exist yet — see "Stock & Supplies" in
// BACKEND_REQUIREMENTS.md. app/services/stock_service.py already has the
// transaction-safe release/restock/adjust logic; only schemas + routes are missing.
//
// Medicines and supplies live in separate tables but share one screen, so the
// API exposes them as one list of StockItemOut, addressed by (itemType, itemId)
// where itemType is 'medicine' | 'supply'.

/** GET /api/stock → Page[StockItemOut] */
export function listStock({ itemType, status, categoryId, search, page = 1, perPage = 200 } = {}) {
  return request('/stock', {
    query: { item_type: itemType, status, category_id: categoryId, search, page, per_page: perPage },
  });
}

/** POST /api/stock — new catalog item plus its opening stock. */
export function createStockItem(payload) {
  return request('/stock', { method: 'POST', body: payload });
}

/** PATCH /api/stock/{itemType}/{itemId} — rename, recategorise, change reorder level / expiry. */
export function updateStockItem(itemType, itemId, payload) {
  return request(`/stock/${itemType}/${itemId}`, { method: 'PATCH', body: payload });
}

/** POST /api/stock/{itemType}/{itemId}/restock — manual restock (stock_service.restock_*). */
export function restockItem(itemType, itemId, payload) {
  return request(`/stock/${itemType}/${itemId}/restock`, { method: 'POST', body: payload });
}

/** POST /api/stock/{itemType}/{itemId}/adjust — correction / expiry write-off / damage. */
export function adjustStockItem(itemType, itemId, payload) {
  return request(`/stock/${itemType}/${itemId}/adjust`, { method: 'POST', body: payload });
}

/** POST /api/stock/requests — nurse asks Admin to restock. */
export function createStockRequest(payload) {
  return request('/stock/requests', { method: 'POST', body: payload });
}

/** GET /api/stock/requests → Page[StockRequestOut] */
export function listStockRequests({ status, page = 1, perPage = 100 } = {}) {
  return request('/stock/requests', { query: { status, page, per_page: perPage } });
}

/** POST /api/stock/requests/{id}/approve — admin only. */
export function approveStockRequest(requestId, payload = {}) {
  return request(`/stock/requests/${requestId}/approve`, { method: 'POST', body: payload });
}

/** POST /api/stock/requests/{id}/deny — admin only. */
export function denyStockRequest(requestId, payload = {}) {
  return request(`/stock/requests/${requestId}/deny`, { method: 'POST', body: payload });
}

/** POST /api/stock/requests/{id}/receive — delivery arrived; increments stock, closes ticket. */
export function receiveStockRequest(requestId) {
  return request(`/stock/requests/${requestId}/receive`, { method: 'POST' });
}
