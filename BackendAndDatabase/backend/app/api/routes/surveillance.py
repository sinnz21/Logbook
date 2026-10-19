"""Health surveillance — outbreak early warning.

GET /api/surveillance/alerts
  Counts this week's visits per (college, complaint), compares each count with
  what the trained model expects for that college, complaint and time of year,
  and returns the ones that are unusually high.

The model (surveillance/model.json) learns the SHAPE of normal clinic traffic:
which colleges send more patients, which complaints rise in the rainy season,
the dip during breaks. A clinic's overall volume differs from the training
data, so each request calibrates the model to this clinic's own last 12 weeks
before comparing.
"""
import datetime as dt
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import APIModel
from surveillance.config import COLLEGES, COMPLAINTS, WATCHED, college_of
from surveillance.model import MODEL_FILE, Model, check_unit

router = APIRouter(prefix="/surveillance", tags=["surveillance"])

MNL = dt.timedelta(hours=8)          # visits are stored in UTC; weeks run Mon–Sun Manila time
HISTORY_WEEKS = 12

# Free-text fallback when a visit has no complaint tag (nurse's own wording,
# English or Filipino).
KEYWORDS = [
    ("Viral Flu", ("flu", "trangkaso", "influenza")),
    ("Fever", ("fever", "lagnat", "febrile", "nilalagnat")),
    ("Cough / Colds", ("cough", "ubo", "sipon", "colds", "cold", "runny nose")),
    ("Tension Headache", ("headache", "sakit ng ulo", "masakit ang ulo", "migraine")),
    ("Dizziness", ("dizz", "hilo", "nahihilo", "vertigo")),
    ("Dysmenorrhea", ("dysmenorrhea", "menstrual", "regla", "cramps")),
    ("Stomach Pain", ("stomach", "tiyan", "lbm", "diarrhea", "loose bowel", "abdominal", "vomit", "suka", "food poisoning")),
    ("Allergic Reaction", ("allerg", "rash", "pantal", "itch", "kati", "hives")),
    ("Wound / Abrasion", ("wound", "cut", "sugat", "abrasion", "sprain", "laceration", "scrape")),
    ("Elevated Blood Pressure", ("blood pressure", "hypertension", "high bp", "bp ")),
]


def classify(tag: str | None, chief_complaint: str | None) -> str:
    if tag in COMPLAINTS:
        return tag
    text_ = f" {(chief_complaint or '').lower()} "
    for name, words in KEYWORDS:
        if any(w in text_ for w in words):
            return name
    return "Other"


def week_start(day: dt.date) -> dt.date:
    return day - dt.timedelta(days=day.weekday())


class AlertOut(APIModel):
    college: str
    complaint: str
    cases: int
    expected: float
    times_normal: float
    previous_week_cases: int
    p_value: float
    test: str            # "week" = sudden spike, "two_weeks" = building up over 2 weeks
    message: str


class CollegeOut(APIModel):
    college: str
    cases: int
    expected: float
    times_normal: float


class SurveillanceOut(APIModel):
    week_start: dt.date
    week_end: dt.date
    week_progress: float             # share of the week already over (current week < 1)
    calibration_scale: float
    history_cases: int
    model_trained_on: str | None
    alerts: list[AlertOut]
    colleges: list[CollegeOut]


_model: Model | None = None


def get_model() -> Model:
    global _model
    if _model is None:
        if not MODEL_FILE.exists():
            raise HTTPException(503, "The surveillance model hasn't been trained yet. Run: python -m surveillance.train")
        _model = Model.load()
    return _model


@router.get("/alerts", response_model=SurveillanceOut)
def alerts(
    week: dt.date | None = Query(None, description="Any day in the week to check; default = this week"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    model = get_model()
    today = (dt.datetime.utcnow() + MNL).date()
    target = week_start(week or today)
    first = target - dt.timedelta(weeks=HISTORY_WEEKS)
    end = target + dt.timedelta(days=7)

    rows = db.execute(text("""
        SELECT v.started_at, p.department, v.chief_complaint,
               (SELECT c.complaint_name FROM visit_complaints vc
                  JOIN complaints c ON c.complaint_id = vc.complaint_id
                 WHERE vc.visit_id = v.visit_id
                 ORDER BY vc.is_primary DESC, vc.visit_complaint_id LIMIT 1) AS tag
          FROM visits v JOIN patients p ON p.patient_id = v.patient_id
         WHERE v.deleted_at IS NULL AND v.started_at >= :a AND v.started_at < :b
    """), {"a": dt.datetime.combine(first, dt.time()) - MNL, "b": dt.datetime.combine(end, dt.time()) - MNL}).all()

    counts: dict[tuple[str, str, dt.date], int] = defaultdict(int)
    for started, dept, chief, tag in rows:
        wk = week_start((started + MNL).date())
        counts[(college_of(dept), classify(tag, chief), wk)] += 1

    # calibrate: this clinic's real volume vs. the model's, over the previous 12 weeks
    hist_weeks = [first + dt.timedelta(weeks=i) for i in range(HISTORY_WEEKS)]
    observed_hist = sum(n for (c, k, w), n in counts.items() if w < target)
    expected_hist = sum(model.expected(w, c, k) for w in hist_weeks for c in COLLEGES for k in COMPLAINTS)
    scale = observed_hist / expected_hist if observed_hist >= 20 and expected_hist > 0 else 1.0
    scale = min(max(scale, 0.05), 20.0)

    # the current week isn't over yet: expect only the part that has passed
    progress = 1.0 if today >= target + dt.timedelta(days=7) else max(1, (today - target).days + 1) / 7
    prev = target - dt.timedelta(weeks=1)

    out_alerts, per_college = [], defaultdict(lambda: [0, 0.0])
    for c in COLLEGES:
        for k in WATCHED:
            n = counts.get((c, k, target), 0)
            e = model.expected(target, c, k) * scale * progress
            n_prev = counts.get((c, k, prev), 0)
            e_prev = model.expected(prev, c, k) * scale
            per_college[c][0] += n; per_college[c][1] += e
            fired, p, test = check_unit(n, e, n_prev, e_prev)
            if fired:
                ratio = n / e if e > 0 else float(n)
                out_alerts.append(AlertOut(
                    college=c, complaint=k, cases=n, expected=round(e, 1), times_normal=round(ratio, 1),
                    previous_week_cases=n_prev, p_value=round(p, 5), test=test,
                    message=(f"{k} cluster in {c}: {n} cases this week, about {ratio:.1f}× the normal {e:.1f}"
                             if test == "week" else
                             f"{k} rising in {c}: {n_prev + n} cases over 2 weeks, about "
                             f"{(n_prev + n) / max(e + e_prev, 0.1):.1f}× normal")))
    out_alerts.sort(key=lambda a: a.p_value)
    colleges = sorted((CollegeOut(college=c, cases=v[0], expected=round(v[1], 1),
                                  times_normal=round(v[0] / v[1], 2) if v[1] > 0 else 0.0)
                       for c, v in per_college.items()), key=lambda x: -x.times_normal)
    return SurveillanceOut(
        week_start=target, week_end=target + dt.timedelta(days=6), week_progress=round(progress, 2),
        calibration_scale=round(scale, 3), history_cases=observed_hist,
        model_trained_on=model.meta.get("trained_on"), alerts=out_alerts, colleges=colleges)
