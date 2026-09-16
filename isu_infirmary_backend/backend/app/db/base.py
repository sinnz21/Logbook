from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.current_timestamp(),
        server_onupdate=func.current_timestamp(),
        nullable=False,
    )


class SoftDeleteMixin:
    """deleted_at is set instead of issuing a DELETE. A purge job removes rows
    older than system_settings.soft_delete_days."""

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
