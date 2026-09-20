"""Clinic-day ↔ UTC conversion.

The database stores naive UTC. Date filters from the frontend are clinic
calendar days (Asia/Manila), so "2026-09-18" means 2026-09-17 16:00 UTC up to
(not including) 2026-09-18 16:00 UTC.

On Windows, zoneinfo needs the `tzdata` package (added to requirements.txt).
"""
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings

CLINIC_TZ = ZoneInfo(settings.CLINIC_TIMEZONE)


def clinic_day_start_utc(day: date) -> datetime:
    """Naive-UTC instant a clinic calendar day begins."""
    local = datetime.combine(day, time.min, tzinfo=CLINIC_TZ)
    return local.astimezone(timezone.utc).replace(tzinfo=None)


def clinic_day_range_utc(date_from: date | None, date_to: date | None):
    """[start, end) naive-UTC bounds for an inclusive clinic-day range; either side may be None."""
    start = clinic_day_start_utc(date_from) if date_from else None
    end = clinic_day_start_utc(date_to + timedelta(days=1)) if date_to else None
    return start, end
