"""Train and evaluate the outbreak early-warning model.

Steps
  1. Load weekly counts (college x complaint x week).
  2. Split by time: first two school years = TRAINING, last year = TESTING.
     The model never sees the testing year while it learns.
  3. Train a Poisson regression on the training years.
  4. Run the alert rule week by week on the testing year.
  5. Score it against the answer key of hidden outbreaks, and compare with a
     simple baseline ("average of the last 4 weeks").
  6. Save the model (model.json), the scores (metrics.json, report.md) and a chart.

usage:  python -m surveillance.train            (from the backend folder)
"""
import argparse
import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import PoissonRegressor

from surveillance.config import ALPHA, COLLEGES, COMPLAINTS, MIN_CASES, WATCHED
from surveillance.model import MODEL_FILE, Model, check_unit, feature_names, features

HERE = Path(__file__).parent
DATA = HERE / "data"


def design_matrix(df: pd.DataFrame, names: list[str]) -> np.ndarray:
    idx = {n: i for i, n in enumerate(names)}
    X = np.zeros((len(df), len(names)))
    for r, (wk, col, comp) in enumerate(zip(df.week, df.college, df.complaint)):
        for k, v in features(wk, col, comp).items():
            X[r, idx[k]] = v
    return X


def baseline_expected(history: list[int]) -> float:
    """Simple rule most clinics would use: average of the previous 4 weeks."""
    last = history[-4:]
    return max(0.5, sum(last) / len(last)) if last else 0.5


def evaluate(test: pd.DataFrame, key: pd.DataFrame, expected_col: str, test_start: dt.date, test_end: dt.date):
    alerts = test[test[expected_col + "_alert"]]
    # which unit-weeks are truly part of an outbreak
    truth = {}
    for o in key.itertuples():
        w0 = dt.date.fromisoformat(o.start_week)
        for k in range(o.weeks):
            truth[(o.college, o.complaint, w0 + dt.timedelta(weeks=k))] = o.outbreak_id
    in_test = key[[test_start <= dt.date.fromisoformat(s) <= test_end for s in key.start_week]]
    detected, delays = 0, []
    for o in in_test.itertuples():
        w0 = dt.date.fromisoformat(o.start_week)
        hits = alerts[(alerts.college == o.college) & (alerts.complaint == o.complaint) &
                      (alerts.week >= w0) & (alerts.week < w0 + dt.timedelta(weeks=o.weeks))]
        if len(hits):
            detected += 1
            # the week's data is complete at the END of the week (Sunday), so a hit in
            # the outbreak's first week counts as found 7 days after it started
            delays.append(((hits.week.min() - w0).days) + 7)
    by_size = {}
    for o in in_test.itertuples():
        w0 = dt.date.fromisoformat(o.start_week)
        hit = len(alerts[(alerts.college == o.college) & (alerts.complaint == o.complaint) &
                         (alerts.week >= w0) & (alerts.week < w0 + dt.timedelta(weeks=o.weeks))]) > 0
        b = by_size.setdefault(int(o.extra_per_week), [0, 0]); b[0] += hit; b[1] += 1
    false = sum(1 for a in alerts.itertuples() if (a.college, a.complaint, a.week) not in truth)
    months = ((test_end - test_start).days + 7) / 30.44
    return {
        "outbreaks_in_test": int(len(in_test)),
        "detected": int(detected),
        "detection_rate": round(detected / len(in_test), 3) if len(in_test) else None,
        "avg_days_to_detect": round(float(np.mean(delays)), 1) if delays else None,
        "false_alarms": int(false),
        "false_alarms_per_month": round(false / months, 2),
        "total_alerts": int(len(alerts)),
        "detected_by_size": {f"+{k}/week": f"{v[0]}/{v[1]}" for k, v in sorted(by_size.items())},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(DATA / "weekly_counts.csv"))
    ap.add_argument("--key", default=str(DATA / "outbreaks.csv"))
    ap.add_argument("--test-from", default="2025-08-04", help="first week of the testing year")
    args = ap.parse_args()

    df = pd.read_csv(args.data)
    df["week"] = pd.to_datetime(df.week_start).dt.date
    test_start = dt.date.fromisoformat(args.test_from)
    train, test = df[df.week < test_start].copy(), df[df.week >= test_start].copy()
    key = pd.read_csv(args.key)
    print(f"training rows {len(train)}  ({train.week.min()} to {train.week.max()})")
    print(f"testing rows  {len(test)}  ({test.week.min()} to {test.week.max()})")

    # ---- train ----
    names = feature_names()
    model = PoissonRegressor(alpha=1e-4, max_iter=3000)
    model.fit(design_matrix(train, names), train.cases.values)
    data = {"intercept": float(model.intercept_),
            "coef": {n: float(c) for n, c in zip(names, model.coef_)},
            "meta": {"trained_on": f"{train.week.min()} to {train.week.max()}",
                     "rows": int(len(train)), "alpha": ALPHA, "min_cases": MIN_CASES,
                     "trained_at": dt.datetime.now().isoformat(timespec="seconds")}}
    MODEL_FILE.write_text(json.dumps(data, indent=1))
    m = Model(data)

    # ---- how well does it predict normal weeks? ----
    test["model_expected"] = [m.expected(w, c, k) for w, c, k in zip(test.week, test.college, test.complaint)]
    hist = defaultdict(list)
    for r in df.sort_values("week").itertuples():
        hist[(r.college, r.complaint)].append((r.week, r.cases))
    base = []
    for r in test.itertuples():
        past = [n for w, n in hist[(r.college, r.complaint)] if w < r.week]
        base.append(baseline_expected(past))
    test["baseline_expected"] = base
    mae_model = float(np.mean(np.abs(test.cases - test.model_expected)))
    mae_base = float(np.mean(np.abs(test.cases - test.baseline_expected)))

    # ---- alerts ----
    test = test.sort_values(["college", "complaint", "week"]).reset_index(drop=True)
    unit = test.college + "|" + test.complaint
    watched = test.complaint.isin(WATCHED)
    for col in ("model_expected", "baseline_expected"):
        prev_n = test.groupby(unit).cases.shift(1)
        prev_e = test.groupby(unit)[col].shift(1)
        test[col + "_alert"] = [
            bool(w and check_unit(int(n), e, None if pd.isna(pn) else int(pn), None if pd.isna(pe) else float(pe))[0])
            for w, n, e, pn, pe in zip(watched, test.cases, test[col], prev_n, prev_e)]
    test_end = test.week.max()
    res_model = evaluate(test, key, "model_expected", test_start, test_end)
    res_base = evaluate(test, key, "baseline_expected", test_start, test_end)

    metrics = {"model": res_model, "baseline_last_4_weeks": res_base,
               "mean_abs_error_cases_per_week": {"model": round(mae_model, 3), "baseline": round(mae_base, 3)},
               "alert_rule": {"alpha": ALPHA, "min_cases": MIN_CASES, "watched": WATCHED}}
    (HERE / "metrics.json").write_text(json.dumps(metrics, indent=1))
    write_report(metrics, train, test)
    try:
        draw_chart(test, key, test_start)
    except Exception as exc:     # chart is optional (matplotlib may be missing)
        print("chart skipped:", exc)

    print("\n                      model    baseline")
    for k in ("detection_rate", "avg_days_to_detect", "false_alarms_per_month", "detected", "false_alarms"):
        print(f"{k:24s}{str(res_model[k]):>8s}{str(res_base[k]):>11s}")
    print(f"{'mean abs error':24s}{mae_model:8.2f}{mae_base:11.2f}")
    print(f"\nsaved {MODEL_FILE.name}, metrics.json, report.md")


def write_report(mx, train, test):
    a, b = mx["model"], mx["baseline_last_4_weeks"]
    pct = lambda x: f"{x*100:.0f}%" if x is not None else "–"
    lines = [
        "# Health Surveillance Model — Evaluation",
        "",
        f"Trained on {train.week.min()} to {train.week.max()} ({len(train):,} weekly counts); "
        f"tested on {test.week.min()} to {test.week.max()} ({len(test):,} weekly counts) the model never saw.",
        "",
        "| Metric | Poisson model | Baseline (avg of last 4 weeks) |",
        "|---|---|---|",
        f"| Outbreaks in test year | {a['outbreaks_in_test']} | {b['outbreaks_in_test']} |",
        f"| Detected | {a['detected']} ({pct(a['detection_rate'])}) | {b['detected']} ({pct(b['detection_rate'])}) |",
        f"| Average days to detect | {a['avg_days_to_detect']} | {b['avg_days_to_detect']} |",
        f"| False alarms per month | {a['false_alarms_per_month']} | {b['false_alarms_per_month']} |",
        f"| Mean absolute error (cases/week) | {mx['mean_abs_error_cases_per_week']['model']} | {mx['mean_abs_error_cases_per_week']['baseline']} |",
        "",
        f"Alert rule: P(cases ≥ observed) < {mx['alert_rule']['alpha']} and at least {mx['alert_rule']['min_cases']} cases, "
        f"for {', '.join(mx['alert_rule']['watched'])}.",
    ]
    (HERE / "report.md").write_text("\n".join(lines) + "\n")


def draw_chart(test, key, test_start):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    k = key[[dt.date.fromisoformat(s) >= test_start for s in key.start_week]]
    if not len(k):
        return
    o = k.sort_values("extra_per_week").iloc[len(k) // 2]
    u = test[(test.college == o.college) & (test.complaint == o.complaint)].sort_values("week")
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(u.week, u.cases, color="#0f6e5f", lw=1.6, label="Actual cases")
    ax.plot(u.week, u.model_expected, color="#9aa8a4", lw=1.4, ls="--", label="Expected (model)")
    al = u[u.model_expected_alert]
    ax.scatter(al.week, al.cases, color="#c0392b", zorder=3, s=40, label="Alert")
    w0 = dt.date.fromisoformat(o.start_week)
    ax.axvspan(w0, w0 + dt.timedelta(weeks=int(o.weeks)), color="#f5b7b1", alpha=0.35, label="Hidden outbreak")
    ax.set_title(f"{o.college} — {o.complaint}: weekly cases vs. expected")
    ax.set_ylabel("Cases per week"); ax.legend(frameon=False, fontsize=9)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    fig.tight_layout(); fig.savefig(HERE / "example_alert.png", dpi=150)


if __name__ == "__main__":
    main()
