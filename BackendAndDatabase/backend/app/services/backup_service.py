"""Database backups with mysqldump / mysql (both ship with XAMPP).

Files are plain .sql dumps in BACKUP_DIR (default: backend/backups, gitignored),
named isu_infirmary_YYYYMMDD_HHMMSS.sql in UTC. Backups older than the
`backup_retention` setting (days, default 30) are deleted after each new backup.
"""
import os
import re
import shutil
import subprocess
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import settings

NAME_RE = re.compile(r"^isu_infirmary_\d{8}_\d{6}(_[a-z-]+)?\.sql$")
_lock = threading.Lock()
AUDIT_TABLES = ("activity_log", "login_attempts")


class BackupError(RuntimeError):
    pass


def backup_dir() -> Path:
    d = Path(settings.BACKUP_DIR)
    if not d.is_absolute():
        d = Path(__file__).resolve().parents[2] / d
    d.mkdir(parents=True, exist_ok=True)
    return d


def _tool(configured: str, names: tuple[str, ...]) -> str:
    if configured:
        if Path(configured).exists():
            return configured
        raise BackupError(f"{configured} doesn't exist. Fix the path in the backend .env.")
    for n in names:
        found = shutil.which(n)
        if found:
            return found
    for n in names:
        for base in (r"C:\xampp\mysql\bin", r"D:\xampp\mysql\bin"):
            cand = Path(base) / f"{n}.exe"
            if cand.exists():
                return str(cand)
    raise BackupError(
        f"Couldn't find {names[0]}. Install XAMPP in C:\\xampp or set its full path in the backend .env."
    )


def _conn_args() -> list[str]:
    args = [f"--host={settings.DB_HOST}", f"--port={settings.DB_PORT}", f"--user={settings.DB_USER}"]
    return args


def _env() -> dict:
    env = dict(os.environ)
    if settings.DB_PASSWORD:
        env["MYSQL_PWD"] = settings.DB_PASSWORD  # keeps the password off the command line
    return env


def safe_path(name: str) -> Path:
    if not NAME_RE.match(name):
        raise BackupError("Unknown backup file")
    p = backup_dir() / name
    if not p.exists():
        raise BackupError("Backup not found")
    return p


def list_backups() -> list[dict]:
    out = []
    for p in backup_dir().glob("isu_infirmary_*.sql"):
        if NAME_RE.match(p.name):
            st = p.stat()
            out.append({
                "name": p.name,
                "size_bytes": st.st_size,
                "created_at": datetime.fromtimestamp(st.st_mtime, timezone.utc).replace(tzinfo=None),
                "kind": "automatic" if "_auto" in p.name else "safety" if "_pre-restore" in p.name else "manual",
            })
    return sorted(out, key=lambda b: b["created_at"], reverse=True)


def create_backup(suffix: str = "", retention_days: int | None = None) -> dict:
    dump = _tool(settings.MYSQLDUMP_PATH, ("mysqldump", "mariadb-dump"))
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    name = f"isu_infirmary_{stamp}{('_' + suffix) if suffix else ''}.sql"
    target = backup_dir() / name
    tmp = target.with_suffix(".part")
    with _lock:
        try:
            with open(tmp, "wb") as fh:
                r = subprocess.run(
                    [dump, *_conn_args(), "--single-transaction", "--routines", "--triggers",
                     "--default-character-set=utf8mb4",
                     # The audit trail is kept out of backups, so a restore never erases it.
                     *[f"--ignore-table={settings.DB_NAME}.{t}" for t in AUDIT_TABLES],
                     "--databases", settings.DB_NAME],
                    stdout=fh, stderr=subprocess.PIPE, env=_env(), timeout=600,
                )
        except subprocess.TimeoutExpired:
            tmp.unlink(missing_ok=True)
            raise BackupError("mysqldump timed out")
        if r.returncode != 0:
            tmp.unlink(missing_ok=True)
            raise BackupError("mysqldump failed: " + r.stderr.decode(errors="replace").strip()[:300])
        tmp.replace(target)
    if retention_days:
        prune(retention_days)
    return next(b for b in list_backups() if b["name"] == name)


def prune(retention_days: int) -> None:
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=retention_days)
    for b in list_backups():
        if b["created_at"] < cutoff:
            (backup_dir() / b["name"]).unlink(missing_ok=True)


def restore_backup(name: str) -> dict:
    """Load a backup over the live database. A safety backup is taken first."""
    src = safe_path(name)
    client = _tool(settings.MYSQL_PATH, ("mysql", "mariadb"))
    safety = create_backup("pre-restore")
    try:
        with _lock, open(src, "rb") as fh:
            r = subprocess.run(
                [client, *_conn_args(), "--default-character-set=utf8mb4",
                 "--init-command=SET SESSION lock_wait_timeout=60"],
                stdin=fh, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=_env(), timeout=900,
            )
    except subprocess.TimeoutExpired:
        raise BackupError(f"Restore timed out (your data before the restore is saved as {safety['name']})")
    if r.returncode != 0:
        raise BackupError(
            "Restore failed: " + r.stderr.decode(errors="replace").strip()[:300]
            + f" (your data before the restore is saved as {safety['name']})"
        )
    return safety


# ── automatic daily backup ───────────────────────────────────────────────────

def _auto_loop(read_settings):
    while True:
        try:
            enabled, retention = read_settings()
            today = datetime.now(timezone.utc).strftime("%Y%m%d")
            has_today = any(b["name"].startswith(f"isu_infirmary_{today}") and b["kind"] == "automatic"
                            for b in list_backups())
            if enabled and not has_today:
                b = create_backup("auto", retention_days=retention)
                from app.db.session import SessionLocal
                from app.models.user import ActivityLog
                with SessionLocal() as db:
                    db.add(ActivityLog(action="Automated backup completed", detail=b["name"], log_type="backup"))
                    db.commit()
        except Exception as exc:  # never kill the server over a backup
            print(f"[backup] automatic backup skipped: {exc}")
        time.sleep(3600)


def start_auto_backups(read_settings) -> None:
    threading.Thread(target=_auto_loop, args=(read_settings,), daemon=True, name="auto-backup").start()
