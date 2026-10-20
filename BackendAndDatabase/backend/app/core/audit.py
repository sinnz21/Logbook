"""Writes one activity_log row for every successful change made through the API.

Runs as middleware so every route is covered without touching each handler.
Reads (GET) are not logged; sign-in attempts are already in login_attempts.
"""
import json
import re

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import ActivityLog

# (method, path regex, action, log_type, entity_type)
RULES = [
    ("POST", r"^/api/patients$", "Patient registered", "record", "patient"),
    ("PATCH", r"^/api/patients/(\d+)$", "Patient record edited", "record", "patient"),
    ("DELETE", r"^/api/patients/(\d+)$", "Patient moved to trash", "record", "patient"),
    ("POST", r"^/api/patients/(\d+)/special-cases$", "Special case flagged", "record", "patient"),
    ("PATCH", r"^/api/patients/(\d+)/special-cases/\d+$", "Special case updated", "record", "patient"),
    ("POST", r"^/api/visits$", "Visit recorded", "record", "visit"),
    ("PATCH", r"^/api/visits/(\d+)$", "Visit edited", "record", "visit"),
    ("DELETE", r"^/api/visits/(\d+)$", "Visit moved to trash", "record", "visit"),
    ("POST", r"^/api/visits/(\d+)/sign-out$", "Patient signed out", "record", "visit"),
    ("POST", r"^/api/stock$", "Stock item added", "inventory", "stock"),
    ("PATCH", r"^/api/stock/\w+/(\d+)$", "Stock item edited", "inventory", "stock"),
    ("POST", r"^/api/stock/\w+/(\d+)/restock$", "Item restocked", "inventory", "stock"),
    ("POST", r"^/api/stock/\w+/(\d+)/adjust$", "Stock adjusted", "inventory", "stock"),
    ("POST", r"^/api/stock/requests$", "Restock requisition sent", "inventory", "stock_request"),
    ("POST", r"^/api/stock/requests/(\d+)/approve$", "Requisition approved", "inventory", "stock_request"),
    ("POST", r"^/api/stock/requests/(\d+)/deny$", "Requisition denied", "inventory", "stock_request"),
    ("POST", r"^/api/stock/requests/(\d+)/receive$", "Delivery received", "inventory", "stock_request"),
    ("POST", r"^/api/users$", "Account created", "account", "user"),
    ("PATCH", r"^/api/users/(\d+)$", "Account updated", "account", "user"),
    ("PATCH", r"^/api/settings$", "System settings changed", "security", "settings"),
    # POST /api/backups is logged by the route itself, so it can store the file name.
    ("GET", r"^/api/backups/export$", "Database exported", "backup", "backup"),
    ("POST", r"^/api/backups/([^/]+)/restore$", "Database restored from backup", "backup", "backup"),
    ("POST", r"^/api/trash/(\w+/\d+)/restore$", "Record restored from trash", "record", None),
]
# Each logged action as a short code for the Audit Log screen
# (GET /api/audit-logs): create, update, delete, backup or restore.
ACTION_CODES = {
    "Patient registered": "create", "Patient record edited": "update", "Patient moved to trash": "delete",
    "Special case flagged": "create", "Special case updated": "update",
    "Visit recorded": "create", "Visit edited": "update", "Visit moved to trash": "delete",
    "Patient signed out": "update",
    "Stock item added": "create", "Stock item edited": "update", "Item restocked": "update",
    "Stock adjusted": "update",
    "Restock requisition sent": "create", "Requisition approved": "update", "Requisition denied": "update",
    "Delivery received": "update",
    "Account created": "create", "Account updated": "update", "Password reset by email": "update",
    "System settings changed": "update",
    "Manual backup taken": "backup", "Automated backup completed": "backup", "Database exported": "backup",
    "Database restored from backup": "restore", "Record restored from trash": "update",
}

COMPILED = [(m, re.compile(p), a, t, e) for m, p, a, t, e in RULES]


# For "create" calls the new record's id is only in the response body
# (POST /api/patients -> {"patientId": 12, ...}), so it is read from there.
ID_KEYS = {"patient": "patientId", "visit": "visitId", "stock_request": "requestId",
           "user": "userId", "stock": "itemId"}


def _match(request: Request):
    path, method = request.url.path, request.method
    for m, rx, action, log_type, entity in COMPILED:
        hit = rx.match(path) if m == method else None
        if hit:
            return hit, action, log_type, entity
    return None


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code >= 400:
            return response
        try:
            found = _match(request)
            if found is None:
                return response
            hit, action, log_type, entity = found
            new_id = None
            if request.method == "POST" and not hit.groups() and entity in ID_KEYS:
                body = b"".join([chunk async for chunk in response.body_iterator])
                response = Response(content=body, status_code=response.status_code,
                                    headers=dict(response.headers), media_type=response.media_type)
                value = json.loads(body).get(ID_KEYS[entity]) if body else None
                new_id = value if isinstance(value, int) else None
            _record(request, hit, action, log_type, entity, new_id)
        except Exception as exc:  # auditing must never break the request
            print(f"[audit] skipped: {exc}")
        return response


def _record(request: Request, hit, action: str, log_type: str, entity: str | None, new_id: int | None) -> None:
    auth = request.headers.get("authorization", "")
    claims = decode_access_token(auth[7:]) if auth.lower().startswith("bearer ") else None
    user_id = int(claims["sub"]) if claims and str(claims.get("sub", "")).isdigit() else None
    ref = hit.group(1) if hit.groups() else None
    entity_id = int(ref) if ref and ref.isdigit() else new_id
    detail = ref if ref and not ref.isdigit() else None
    with SessionLocal() as db:
        db.add(ActivityLog(user_id=user_id, action=action, entity_type=entity,
                           entity_id=entity_id, detail=detail, log_type=log_type))
        db.commit()
