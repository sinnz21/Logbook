"""Generate synthetic weekly clinic data with hidden outbreaks.

Real clinic data is still small, so the model is trained and tested on
realistic synthetic data first. The generator follows how a campus clinic
actually behaves:

  * bigger colleges send more patients
  * flu / fever / cough rise in the rainy season (June–November)
  * visits drop during school breaks and rise during exam weeks
  * random week-to-week noise (Poisson counts)
  * OUTBREAKS: a college suddenly gets extra cases of one complaint for 1–3 weeks

The outbreaks are written to a separate answer key (outbreaks.csv) so the
trainer can measure how many the model catches. The model itself never sees
the answer key.

usage:  python -m health_surveillance.generate_data            (from the backend folder)
"""
import argparse
import csv
import datetime as dt
import math
import random
from pathlib import Path

import numpy as np

from health_surveillance.config import COLLEGES, COMPLAINTS
from health_surveillance.model import school_calendar

OUT = Path(__file__).parent / "data"

# Relative size of each college (how many patients it normally sends).
SIZE = {"CCSICT": 1.4, "CON": 1.0, "COE": 1.3, "CED": 1.2, "CA": 1.0,
        "CBM": 0.9, "CCJE": 0.8, "CAS": 0.7, "OTHER": 0.6}

# Normal weekly cases per complaint for a college of size 1.0 during class weeks.
BASE = {"Fever": 1.2, "Viral Flu": 0.9, "Cough / Colds": 1.1, "Tension Headache": 1.5,
        "Dizziness": 0.7, "Dysmenorrhea": 1.0, "Stomach Pain": 0.9, "Allergic Reaction": 0.4,
        "Wound / Abrasion": 0.6, "Elevated Blood Pressure": 0.3, "Other": 0.4}

SEASONAL = {"Fever": 0.9, "Viral Flu": 1.2, "Cough / Colds": 0.8}   # rainy-season boost
EXAM_SENSITIVE = {"Tension Headache": 0.6, "Dizziness": 0.4, "Stomach Pain": 0.3}
OUTBREAK_TYPES = ["Fever", "Viral Flu", "Cough / Colds", "Stomach Pain", "Allergic Reaction"]


GROWTH_FROM = dt.date(2023, 8, 7)   # enrollment growth is counted from this school year (earlier years are smaller)


def year_index_of(week_start: dt.date) -> int:
    return (week_start - GROWTH_FROM).days // 365


def expected(college: str, complaint: str, week_start: dt.date, year_index: int) -> float:
    is_break, is_exam = school_calendar(week_start)
    rate = BASE[complaint] * SIZE[college]
    if complaint in SEASONAL:
        # smooth seasonal curve peaking around September
        doy = week_start.timetuple().tm_yday
        rate *= 1 + SEASONAL[complaint] * max(0.0, math.cos(2 * math.pi * (doy - 250) / 365))
    if is_exam and complaint in EXAM_SENSITIVE:
        rate *= 1 + EXAM_SENSITIVE[complaint]
    if is_break:
        rate *= 0.2
    rate *= 1 + 0.04 * year_index          # enrollment grows a little each year
    return rate


def mondays(start: dt.date, end: dt.date):
    d = start - dt.timedelta(days=start.weekday())
    while d <= end:
        yield d
        d += dt.timedelta(days=7)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="2023-08-07")
    ap.add_argument("--end", default="2026-07-27")
    ap.add_argument("--outbreaks", type=int, default=120, help="hidden outbreaks to plant")
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()
    random.seed(args.seed); rng = np.random.default_rng(args.seed)

    start, end = dt.date.fromisoformat(args.start), dt.date.fromisoformat(args.end)
    weeks = list(mondays(start, end))
    class_weeks = [w for w in weeks if not school_calendar(w)[0]]

    # plant outbreaks (only during class weeks — that's when students are on campus)
    outbreaks = []
    for i in range(args.outbreaks):
        w0 = random.choice(class_weeks[:-3])
        outbreaks.append({
            "outbreak_id": i + 1,
            "college": random.choice(COLLEGES[:-1]),
            "complaint": random.choice(OUTBREAK_TYPES),
            "start_week": w0.isoformat(),
            "weeks": random.choice([1, 2, 2, 3]),
            "extra_per_week": random.choice([3, 4, 5, 6, 8]),
        })

    extra = {}
    for o in outbreaks:
        w0 = dt.date.fromisoformat(o["start_week"])
        for k in range(o["weeks"]):
            key = (o["college"], o["complaint"], (w0 + dt.timedelta(weeks=k)).isoformat())
            # outbreaks usually build up: smaller first week, then the full size
            extra[key] = extra.get(key, 0) + max(2, round(o["extra_per_week"] * (0.6 if k == 0 else 1.0)))

    OUT.mkdir(exist_ok=True)
    rows = 0
    with open(OUT / "weekly_counts.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["week_start", "college", "complaint", "cases"])
        for wk in weeks:
            year_index = year_index_of(wk)
            for c in COLLEGES:
                for comp in COMPLAINTS:
                    n = int(rng.poisson(expected(c, comp, wk, year_index)))
                    n += extra.get((c, comp, wk.isoformat()), 0)
                    w.writerow([wk.isoformat(), c, comp, n]); rows += 1
    with open(OUT / "outbreaks.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(outbreaks[0]))
        w.writeheader(); w.writerows(outbreaks)
    print(f"{len(weeks)} weeks x {len(COLLEGES)} colleges x {len(COMPLAINTS)} complaints = {rows} rows")
    print(f"{len(outbreaks)} hidden outbreaks written to the answer key")


if __name__ == "__main__":
    main()
