from fastapi import APIRouter

from app.api.routes import activity, audit_logs, auth, backups, insights, lookups, patients, settings, stock, health_surveillance, trash, users, visits

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(lookups.router)
api_router.include_router(patients.router)
api_router.include_router(visits.router)
api_router.include_router(stock.router)
api_router.include_router(users.router)
api_router.include_router(settings.router)
api_router.include_router(insights.router)
api_router.include_router(backups.router)
api_router.include_router(trash.router)
api_router.include_router(activity.router)
api_router.include_router(health_surveillance.router)
api_router.include_router(audit_logs.router)
