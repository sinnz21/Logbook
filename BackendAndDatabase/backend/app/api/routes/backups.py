"""Admin backups: list, back up now, download, export, restore."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import SessionLocal, engine, get_db
from app.models.user import ActivityLog, SystemSetting, User
from app.schemas.common import APIModel
from app.services import backup_service as bs

router = APIRouter(prefix="/backups", tags=["backups"])


class BackupOut(APIModel):
    backup_id: str        # the file name; used in /backups/{backup_id}/restore
    file_name: str
    size_bytes: int
    created_at: datetime
    kind: str             # "manual" or "automatic" (safety copies before a restore count as automatic)
    created_by_name: str | None = None


class RestoreIn(APIModel):
    confirm: str          # optional; if sent it must equal the backup name


class RestoreOut(APIModel):
    ok: bool
    restored_at: datetime
    restored: str
    safety_backup: str


def _out(db: Session, b: dict) -> BackupOut:
    by = None
    if b["kind"] == "manual":
        row = db.execute(
            select(User).join(ActivityLog, ActivityLog.user_id == User.user_id)
            .where(ActivityLog.action == "Manual backup taken", ActivityLog.detail == b["name"])
        ).scalars().first()
        by = row.full_name if row else None
    return BackupOut(backup_id=b["name"], file_name=b["name"], size_bytes=b["size_bytes"],
                     created_at=b["created_at"], kind="manual" if b["kind"] == "manual" else "automatic",
                     created_by_name=by)


def _setting(db: Session, name: str, default):
    row = db.execute(select(SystemSetting).where(SystemSetting.setting_name == name)).scalar_one_or_none()
    if row is None or row.setting_value in (None, ""):
        return default
    v = str(row.setting_value).strip().lower()
    if isinstance(default, bool):
        return v in ("1", "true", "yes", "on")
    try:
        return int(v)
    except ValueError:
        return default


def read_backup_settings():
    with SessionLocal() as db:
        return _setting(db, "auto_backup_enabled", True), _setting(db, "backup_retention", 30)


def _fail(e: bs.BackupError):
    code = 404 if "not found" in str(e).lower() or "unknown" in str(e).lower() else 500
    raise HTTPException(status_code=code, detail=str(e))


@router.get("", response_model=list[BackupOut])
def list_all(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return [_out(db, b) for b in bs.list_backups()]


@router.post("", response_model=BackupOut, status_code=201)
def back_up_now(db: Session = Depends(get_db), me: User = Depends(require_admin)):
    try:
        b = bs.create_backup(retention_days=_setting(db, "backup_retention", 30))
    except bs.BackupError as e:
        _fail(e)
    db.add(ActivityLog(user_id=me.user_id, action="Manual backup taken", entity_type="backup",
                       detail=b["name"], log_type="backup"))
    db.commit()
    return _out(db, b)


@router.get("/export")
def export_sql(_: User = Depends(require_admin)):
    """A fresh full dump, downloaded as a file (also kept in the backups list)."""
    try:
        b = bs.create_backup()
    except bs.BackupError as e:
        _fail(e)
    return FileResponse(bs.backup_dir() / b["name"], media_type="application/sql", filename=b["name"])


@router.get("/{name}/download")
def download(name: str, _: User = Depends(require_admin)):
    try:
        p = bs.safe_path(name)
    except bs.BackupError as e:
        _fail(e)
    return FileResponse(p, media_type="application/sql", filename=name)


@router.post("/{name}/restore", response_model=RestoreOut)
def restore(name: str, body: RestoreIn | None = None, db: Session = Depends(get_db),
            _: User = Depends(require_admin)):
    if body is not None and body.confirm != name:
        raise HTTPException(status_code=422, detail="Confirmation doesn't match the backup name")
    # This request's own session (used to check the admin) still holds table
    # locks; release them and drop pooled connections, or the restore's
    # DROP TABLE waits on us forever.
    db.rollback()
    db.close()
    engine.dispose()
    try:
        safety = bs.restore_backup(name)
    except bs.BackupError as e:
        _fail(e)
    return RestoreOut(ok=True, restored_at=datetime.now(timezone.utc).replace(tzinfo=None),
                      restored=name, safety_backup=safety["name"])
