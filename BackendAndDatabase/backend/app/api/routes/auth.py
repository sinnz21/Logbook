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
from app.models.user import ActivityLog, LoginAttempt, SystemSetting, User
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
# Step 1  POST /forgot-password   {email}               -> {expiresInSeconds}
# Step 2  POST /verify-reset-code {email, code}         -> {resetToken}
# Step 3  POST /reset-password    {resetToken, newPassword} -> {ok: true}
#
# Codes live in memory only (single backend process). A restart just means the
# user asks for a new code. Only hashes of the code and the reset token are kept.

log = logging.getLogger(__name__)
_codes: dict[int, dict] = {}          # user_id -> {hash, expires, tries, sent_at}
_reset_tokens: dict[str, dict] = {}   # hash(reset token) -> {user_id, expires}
_codes_lock = threading.Lock()
RESEND_SECONDS = 30                   # matches the "Resend code in 30s" timer on the login screen
MAX_TRIES = 5
WRONG_CODE = "Wrong or expired code. Ask for a new one."


def _code_hash(code: str) -> str:
    return hmac.new(settings.SECRET_KEY.encode(), code.encode(), hashlib.sha256).hexdigest()


def _expires_in() -> int:
    return settings.RESET_CODE_MINUTES * 60


def _find_by_email(db: Session, email: str) -> User | None:
    user = db.execute(
        select(User).where(func.lower(User.email) == email.strip().lower())
    ).scalar_one_or_none()
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

    user = _find_by_email(db, body.email)
    if not user:
        # Same answer either way, so the form can't be used to find registered emails.
        return {"expiresInSeconds": _expires_in()}

    now = time.time()
    with _codes_lock:
        prev = _codes.get(user.user_id)
        if prev and now - prev["sent_at"] < RESEND_SECONDS:
            wait = int(RESEND_SECONDS - (now - prev["sent_at"])) + 1
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, f"Please wait {wait} seconds before asking for another code.")
        code = f"{secrets.randbelow(1_000_000):06d}"
        _codes[user.user_id] = {"hash": _code_hash(code), "expires": now + _expires_in(), "tries": 0, "sent_at": now}

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
    return {"expiresInSeconds": _expires_in()}


@router.post("/verify-reset-code")
def verify_reset_code(body: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Step 2: checks the emailed code and hands back a one-time reset token."""
    user = _find_by_email(db, body.email)
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, WRONG_CODE)
    with _codes_lock:
        entry = _codes.get(user.user_id)
        if not entry or time.time() > entry["expires"] or entry["tries"] >= MAX_TRIES:
            _codes.pop(user.user_id, None)
            raise HTTPException(status.HTTP_400_BAD_REQUEST, WRONG_CODE)
        if not hmac.compare_digest(entry["hash"], _code_hash(body.code.strip())):
            entry["tries"] += 1
            left = MAX_TRIES - entry["tries"]
            if left <= 0:
                _codes.pop(user.user_id, None)
                raise HTTPException(status.HTTP_400_BAD_REQUEST, WRONG_CODE)
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Wrong code. {left} tries left.")
        _codes.pop(user.user_id, None)        # the code can't be used again
        token = secrets.token_urlsafe(32)
        _reset_tokens[_code_hash(token)] = {"user_id": user.user_id, "expires": time.time() + _expires_in()}
    return {"resetToken": token}


@router.post("/reset-password")
def reset_password(body: ResetRequest, db: Session = Depends(get_db)):
    """Step 3: sets the new password using the token from verify-reset-code."""
    expired = HTTPException(status.HTTP_400_BAD_REQUEST, "This reset has expired. Start again.")
    key = _code_hash(body.reset_token)
    with _codes_lock:
        entry = _reset_tokens.get(key)
        if not entry or time.time() > entry["expires"]:
            _reset_tokens.pop(key, None)
            raise expired
    user = db.get(User, entry["user_id"])
    if not user or user.deleted_at is not None or user.status != "active":
        raise expired
    _check_password(db, body.new_password)   # same rules as User Management
    with _codes_lock:
        if _reset_tokens.pop(key, None) is None:   # one use only
            raise expired

    user.password_hash = hash_password(body.new_password)
    db.add(ActivityLog(user_id=user.user_id, action="Password reset by email", entity_type="user",
                       entity_id=user.user_id, log_type="security"))
    db.commit()
    return {"ok": True, "detail": "Password changed. You can sign in now."}
