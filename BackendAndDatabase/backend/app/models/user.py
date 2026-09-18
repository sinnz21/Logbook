from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin


class User(Base, TimestampMixin, SoftDeleteMixin):
    """Admin and Nurse/Staff only. Patients never authenticate."""
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(Enum("admin", "nurse"), nullable=False)
    email: Mapped[str | None] = mapped_column(String(150), unique=True)
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive"), default="active", nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)

    @property
    def full_name(self) -> str:
        mid = f" {self.middle_name[0]}." if self.middle_name else ""
        return f"{self.last_name}, {self.first_name}{mid}"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class LoginAttempt(Base):
    """Backs the lockout rule. Rows are written for unknown usernames too,
    so probing shows up in the data."""
    __tablename__ = "login_attempts"

    attempt_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    successful: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )


class ActivityLog(Base):
    __tablename__ = "activity_log"

    log_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    action: Mapped[str] = mapped_column(String(150), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(50))
    entity_id: Mapped[int | None] = mapped_column(Integer)
    detail: Mapped[str | None] = mapped_column(String(2000))
    log_type: Mapped[str] = mapped_column(
        Enum("account", "record", "inventory", "security", "backup"),
        default="record", nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    setting_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    setting_value: Mapped[str | None] = mapped_column(String(2000))
    value_type: Mapped[str] = mapped_column(
        Enum("int", "bool", "string", "json"), default="string", nullable=False
    )
    description: Mapped[str | None] = mapped_column(String(255))
    updated_by: Mapped[int | None] = mapped_column(ForeignKey("users.user_id"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )

    def typed(self):
        """Cast setting_value using value_type so callers never guess."""
        v = self.setting_value
        if v is None:
            return None
        if self.value_type == "int":
            return int(v)
        if self.value_type == "bool":
            return v in ("1", "true", "True")
        if self.value_type == "json":
            import json
            return json.loads(v)
        return v
