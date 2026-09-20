"""GET/PATCH /api/settings — the System Settings screen, backed by system_settings."""
from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.user import SystemSetting, User
from app.schemas.common import APIModel

router = APIRouter(prefix="/settings", tags=["settings"])

# API field → (setting_name, value_type, default). Parsed defensively, because
# rows seeded without value_type come back as strings.
FIELDS = {
    "soft_delete_days": ("soft_delete_days", "int", 90),
    "failed_login_limit": ("failed_login_limit", "int", 5),
    "lockout_minutes": ("lockout_minutes", "int", 15),
    "password_symbol_required": ("password_symbol_required", "bool", True),
    "auto_backup_enabled": ("auto_backup_enabled", "bool", True),
}


class SettingsOut(APIModel):
    soft_delete_days: int
    failed_login_limit: int
    lockout_minutes: int
    password_symbol_required: bool
    auto_backup_enabled: bool


class SettingsUpdate(APIModel):
    soft_delete_days: int | None = Field(default=None, ge=1, le=3650)
    failed_login_limit: int | None = Field(default=None, ge=1, le=20)
    lockout_minutes: int | None = Field(default=None, ge=1, le=1440)
    password_symbol_required: bool | None = None
    auto_backup_enabled: bool | None = None


def _parse(raw: str | None, kind: str, default):
    if raw is None:
        return default
    if kind == "bool":
        return str(raw).lower() in ("1", "true", "yes", "on")
    try:
        return int(raw)
    except ValueError:
        return default


def _read(db: Session) -> SettingsOut:
    rows = {s.setting_name: s for s in db.execute(select(SystemSetting)).scalars()}
    values = {}
    for field, (name, kind, default) in FIELDS.items():
        row = rows.get(name)
        values[field] = _parse(row.setting_value if row else None, kind, default)
    return SettingsOut(**values)


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _read(db)


@router.patch("", response_model=SettingsOut)
def update_settings(body: SettingsUpdate, db: Session = Depends(get_db), me: User = Depends(require_admin)):
    rows = {s.setting_name: s for s in db.execute(select(SystemSetting)).scalars()}
    for field, value in body.model_dump(exclude_unset=True, exclude_none=True).items():
        name, kind, _default = FIELDS[field]
        text = ("1" if value else "0") if kind == "bool" else str(value)
        row = rows.get(name)
        if row is None:
            db.add(SystemSetting(setting_name=name, setting_value=text, value_type=kind, updated_by=me.user_id))
        else:
            row.setting_value = text
            row.value_type = kind
            row.updated_by = me.user_id
    db.commit()
    return _read(db)
