import hashlib
import hmac
import logging
import secrets
import threading
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import LoginAttempt, SystemSetting, User
from app.schemas.auth import ForgotRequest, LoginRequest, ResetRequest, TokenResponse, VerifyCodeRequest
from app.api.routes.users import _check_password
from app.services import mail_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _setting(db: Session, name: str, default):
    row = db.execute(
        select(SystemSetting).where(SystemSetting.setting_name == name)
    ).scalar_one_or_none()
    return row.typed() if row else default


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # int(): rows seeded without value_type come back as strings, and
    # `count >= "5"` raises TypeError on every login attempt.
    limit = int(_setting(db, "failed_login_limit", 5))
    window = int(_setting(db, "lockout_minutes", 15))
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=window)

    recent_failures = db.execute(
        select(func.count())
        .select_from(LoginAttempt)
        .where(
            LoginAttempt.username == body.username,
            LoginAttempt.successful.is_(False),
            LoginAttempt.attempted_at >= since,
        )
    ).scalar_one()

    if recent_failures >= limit:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Account locked. Try again in {window} minutes.",
        )

    user = db.execute(
        select(User).where(User.username == body.username)
    ).scalar_one_or_none()

    ok = bool(
        user
        and user.deleted_at is None
        and user.status == "active"
        and verify_password(body.password, user.password_hash)
    )

    db.add(LoginAttempt(
        username=body.username,
        user_id=user.user_id if user else None,
        ip_address=request.client.host if request.client else None,
        successful=ok,
    ))
    db.commit()

    if not ok:
        # deliberately vague — do not reveal whether the username exists
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")

    if user.role != "admin" and str(_setting(db, "maintenance_mode", False)).lower() in ("1", "true", "yes", "on"):
        # Admins can still sign in to finish the work and switch it back off.
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            str(_setting(db, "maintenance_message", "") or "System under maintenance, please try again later."),
        )

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user.user_id, user.role),
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
    )


# ---- Forgot password: 6-digit code sent to the account's email ----------------
#
# Codes live in memory only (single backend process). A restart just means the
# user asks for a new code. Only a hash of the code is kept.

log = logging.getLogger(__name__)
_codes: dict[int, dict] = {}
_codes_lock = threading.Lock()
RESEND_SECONDS = 60
MAX_TRIES = 5
GENERIC_SENT = "If that account has an email on file, a 6-digit code was sent to it."


def _code_hash(code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()


def _find_active_user(db: Session, username: str) -> User | None:
    user = db.execute(select(User).where(User.username == username.strip())).scalar_one_or_none()
    if user and user.deleted_at is None and user.status == "active":
        return user
    return None


@router.post("/forgot-password")
def forgot_password(body: ForgotRequest, db: Session = Depends(get_db)):
    if not mail_service.is_configured():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Email reset isn't set up on this server. Ask the system admin to reset your password.",
        )

    user = _find_active_user(db, body.username)
    if not user or not user.email:
        return {"detail": GENERIC_SENT}   # same answer: don't reveal which usernames exist

    now = time.time()
    with _codes_lock:
        prev = _codes.get(user.user_id)
        if prev and now - prev["sent_at"] < RESEND_SECONDS:
            wait = int(RESEND_SECONDS - (now - prev["sent_at"])) + 1
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Please wait {wait} seconds before asking for another code.")
        code = f"{secrets.randbelow(1_000_000):06d}"
        _codes[user.user_id] = {
            "hash": _code_hash(code),
            "expires": now + settings.RESET_CODE_MINUTES * 60,
            "tries": 0,
            "sent_at": now,
        }

    try:
        mail_service.send_mail(
            user.email,
            "ISU Infirmary password reset code",
            f"Hello {user.first_name},\n\n"
            f"Your password reset code is: {code}\n\n"
            f"It expires in {settings.RESET_CODE_MINUTES} minutes. If you didn't ask for this, "
            "ignore this email; your password stays the same.\n\n"
            "ISU Infirmary Log Book System",
        )
    except Exception:
        log.exception("Sending reset code failed")
        with _codes_lock:
            _codes.pop(user.user_id, None)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Couldn't send the email. Check the server's internet connection, or ask the system admin.",
        )
    return {"detail": GENERIC_SENT}


def _check_code(user_id: int, code: str) -> dict:
    """Validates a code under _codes_lock; counts wrong tries. Returns the entry."""
    bad = HTTPException(status.HTTP_400_BAD_REQUEST, "Wrong or expired code. Ask for a new one.")
    entry = _codes.get(user_id)
    if entry and not entry.get("hash"):
        raise bad                          # already verified; its reset token stays valid
    if not entry or time.time() > entry["expires"] or entry["tries"] >= MAX_TRIES:
        _codes.pop(user_id, None)
        raise bad
    if not hmac.compare_digest(entry["hash"], _code_hash(code.strip())):
        entry["tries"] += 1
        left = MAX_TRIES - entry["tries"]
        if left <= 0:
            _codes.pop(user_id, None)
            raise bad
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Wrong code. {left} tries left.")
    return entry


@router.post("/verify-reset-code")
def verify_reset_code(body: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Step 2: checks the emailed code and hands back a one-time reset token."""
    user = _find_active_user(db, body.username)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Wrong or expired code. Ask for a new one.")
    with _codes_lock:
        entry = _check_code(user.user_id, body.code)
        token = secrets.token_urlsafe(32)
        entry["hash"] = None               # the code itself can't be used again
        entry["reset_token"] = _code_hash(token)
        entry["expires"] = time.time() + settings.RESET_CODE_MINUTES * 60
    return {"resetToken": token}


@router.post("/reset-password")
def reset_password(body: ResetRequest, db: Session = Depends(get_db)):
    """Step 3: sets the new password using the token from verify-reset-code."""
    bad = HTTPException(status.HTTP_400_BAD_REQUEST, "This reset has expired. Start again.")
    user = _find_active_user(db, body.username)
    if not user:
        raise bad
    _check_password(db, body.new_password)   # same symbol rule as User Management
    with _codes_lock:
        entry = _codes.get(user.user_id)
        if (not entry or not entry.get("reset_token") or time.time() > entry["expires"]
                or not hmac.compare_digest(entry["reset_token"], _code_hash(body.reset_token))):
            raise bad
        _codes.pop(user.user_id, None)   # one use only

    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"detail": "Password changed. You can sign in now."}
