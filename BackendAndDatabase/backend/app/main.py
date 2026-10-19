from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.audit import AuditMiddleware
from app.core.config import settings

app = FastAPI(
    title="ISU Infirmary Log Book System",
    description="Backend API — Isabela State University, University Health Service",
    version="2.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuditMiddleware)
app.include_router(api_router)


@app.on_event("startup")
def _start_auto_backups():
    from app.api.routes.backups import read_backup_settings
    from app.services.backup_service import start_auto_backups
    start_auto_backups(read_backup_settings)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "timezone": settings.CLINIC_TIMEZONE}
