from fastapi import APIRouter

from app.api.routes import auth, insights, lookups, patients, settings, stock, users, visits

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(lookups.router)
api_router.include_router(patients.router)
api_router.include_router(visits.router)
api_router.include_router(stock.router)
api_router.include_router(users.router)
api_router.include_router(settings.router)
api_router.include_router(insights.router)
