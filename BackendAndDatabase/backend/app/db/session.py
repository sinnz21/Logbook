from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,   # drop dead connections instead of failing mid-request
    pool_recycle=3600,    # MySQL closes idle connections after 8h by default
    echo=False,
    # Store UTC everywhere. The app writes UTC itself (approved_at, received_at,
    # ...), but columns filled by DEFAULT CURRENT_TIMESTAMP (request_date,
    # created_at, attempted_at, ...) use the *session* time zone, which defaults
    # to the server machine's clock. On a UTC+8 laptop those came out 8 hours
    # ahead: dates displayed wrong, and a 15-minute login lockout lasted ~8 hours.
    connect_args={"init_command": "SET time_zone = '+00:00'"},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
