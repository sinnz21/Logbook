"""The surveillance model, in plain Python (no numpy needed at run time).

Model: Poisson regression (a log-linear model for counts).

    expected cases = exp( intercept
                          + college effect
                          + complaint effect
                          + complaint-specific seasonal curve (sin/cos of the week of the year)
                          + school-break effect + exam-week effect per complaint
                          + yearly trend )

Training (train.py) learns those numbers from past weekly counts and saves them
to model.json. The backend loads model.json and calls `expected()` and
`is_alert()` — so the server needs no machine-learning libraries.
"""
import datetime as dt
import json
import math
from pathlib import Path

from health_surveillance.config import ALPHA, COLLEGES, COMPLAINTS, MIN_CASES

MODEL_FILE = Path(__file__).parent / "model.json"
EPOCH = dt.date(2023, 8, 7)   # trend is measured in years since this date


def school_calendar(day: dt.date) -> tuple[bool, bool]:
    """(is_break, is_exam_week) for the week starting on `day`."""
    m, d = day.month, day.day
    is_break = (m in (6, 7)) or (m == 12 and d >= 18) or (m == 1 and d <= 4) or (m == 5 and d >= 25)
    is_exam = (m == 10 and 6 <= d <= 17) or (m == 12 and 8 <= d <= 17) or \
              (m == 3 and 6 <= d <= 17) or (m == 5 and 8 <= d <= 21)
    return is_break, is_exam


def features(week_start: dt.date, college: str, complaint: str) -> dict[str, float]:
    """The inputs the model sees for one (week, college, complaint) cell."""
    doy = week_start.timetuple().tm_yday
    s, c = math.sin(2 * math.pi * doy / 365.25), math.cos(2 * math.pi * doy / 365.25)
    is_break, is_exam = school_calendar(week_start)
    f = {f"college={college}": 1.0, f"complaint={complaint}": 1.0,
         f"sin|{complaint}": s, f"cos|{complaint}": c,
         f"sin2|{complaint}": math.sin(4 * math.pi * doy / 365.25),
         f"cos2|{complaint}": math.cos(4 * math.pi * doy / 365.25),
         "break": float(is_break), f"exam|{complaint}": float(is_exam),
         "trend_years": (week_start - EPOCH).days / 365.25}
    return f


def feature_names() -> list[str]:
    names = [f"college={c}" for c in COLLEGES] + [f"complaint={c}" for c in COMPLAINTS]
    for c in COMPLAINTS:
        names += [f"sin|{c}", f"cos|{c}", f"sin2|{c}", f"cos2|{c}", f"exam|{c}"]
    return names + ["break", "trend_years"]


class Model:
    def __init__(self, data: dict):
        self.intercept = data["intercept"]
        self.coef = data["coef"]
        self.meta = data.get("meta", {})

    @classmethod
    def load(cls, path: Path = MODEL_FILE) -> "Model":
        return cls(json.loads(Path(path).read_text()))

    def expected(self, week_start: dt.date, college: str, complaint: str) -> float:
        z = self.intercept + sum(self.coef.get(k, 0.0) * v
                                 for k, v in features(week_start, college, complaint).items())
        return math.exp(z)


def poisson_tail(observed: int, mean: float) -> float:
    """P(X >= observed) for X ~ Poisson(mean): how surprising this count is."""
    if observed <= 0:
        return 1.0
    term, cdf = math.exp(-mean), 0.0
    for k in range(observed):
        cdf += term
        term *= mean / (k + 1)
    return max(0.0, 1.0 - cdf)


def is_alert(observed: int, mean: float, alpha: float = ALPHA, min_cases: int = MIN_CASES) -> tuple[bool, float]:
    p = poisson_tail(observed, mean)
    return (observed >= min_cases and p < alpha), p


def check_unit(obs_this: int, exp_this: float, obs_prev: int | None = None, exp_prev: float | None = None,
               alpha: float = ALPHA, min_cases: int = MIN_CASES) -> tuple[bool, float, str]:
    """Two tests, each at alpha/2 so the overall false-alarm rate stays at alpha:
      * this week alone   — catches sudden spikes
      * last two weeks    — catches outbreaks that build up slowly
    Returns (alert?, p-value of the test that fired or the smaller one, which test)."""
    a1, p1 = is_alert(obs_this, exp_this, alpha / 2, min_cases)
    if obs_prev is None or exp_prev is None:
        return a1, p1, "week"
    a2, p2 = is_alert(obs_this + obs_prev, exp_this + exp_prev, alpha / 2, min_cases)
    a2 = a2 and obs_this >= obs_prev * 0.5 and obs_this >= 2   # still elevated this week
    if a1:
        return True, p1, "week"
    if a2:
        return True, p2, "two_weeks"
    return False, min(p1, p2), "none"
