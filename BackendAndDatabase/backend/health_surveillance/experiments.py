"""Experiments: what actually makes the early-warning model better?

Each experiment changes ONE thing and is scored the same way:
20 independent synthetic datasets, test year 2025-08 to 2026-07, pooled.
Score = % of hidden outbreaks caught when each method is allowed at most
0.5 and 1.0 false alarms per month (the fair comparison), plus prediction error.

usage:  python -m health_surveillance.experiments        (from the backend folder, ~1–2 min)
"""
import datetime as dt
import math
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import PoissonRegressor

from health_surveillance.generate_data import expected as true_rate, year_index_of
from health_surveillance.config import COLLEGES, COMPLAINTS, WATCHED
from health_surveillance.model import check_unit, features as base_features, feature_names as base_names, is_alert

HERE = Path(__file__).parent
SEEDS = list(range(1, 21))
ALPHAS = [0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05]
TEST_FROM = dt.date(2025, 8, 4)


# ---------- model variants ----------
def feats_interaction(w, c, k):
    f = base_features(w, c, k); f[f"pair={c}|{k}"] = 1.0; return f


def names_interaction():
    return base_names() + [f"pair={c}|{k}" for c in COLLEGES for k in COMPLAINTS]


VARIANTS = {
    "base": (base_features, base_names, 1e-4),
    "interaction": (feats_interaction, names_interaction, 1e-3),
}


def fit(train, feats, names, l2):
    idx = {n: i for i, n in enumerate(names())}
    def X(df):
        M = np.zeros((len(df), len(idx)))
        for r, (w, c, k) in enumerate(zip(df.week, df.college, df.complaint)):
            for name, v in feats(w, c, k).items():
                M[r, idx[name]] = v
        return M
    reg = PoissonRegressor(alpha=l2, max_iter=4000).fit(X(train), train.cases.values)
    return lambda df: reg.predict(X(df))


# ---------- detector variants ----------
def det_two_week(n, e, pn, pe, pn2, pe2, alpha):
    return check_unit(n, e, pn, pe, alpha=alpha)[0]


def det_week_only(n, e, pn, pe, pn2, pe2, alpha):
    return is_alert(n, e, alpha)[0]


def det_three_window(n, e, pn, pe, pn2, pe2, alpha):
    """this week, last 2 weeks, last 3 weeks — each at alpha/3"""
    a = alpha / 3
    if is_alert(n, e, a)[0]:
        return True
    if pn is not None and is_alert(n + pn, e + pe, a)[0] and n >= 2:
        return True
    return pn2 is not None and is_alert(n + pn + pn2, e + pe + pe2, a)[0] and n >= 2 and pn >= 1


def det_two_week_min3(n, e, pn, pe, pn2, pe2, alpha):
    return check_unit(n, e, pn, pe, alpha=alpha, min_cases=3)[0]


DETECTORS = {"week+2wk (current)": det_two_week, "week only": det_week_only,
             "week+2wk+3wk": det_three_window, "week+2wk, min 3 cases": det_two_week_min3}


def load(seed, start):
    subprocess.run([sys.executable, "-m", "health_surveillance.generate_data", "--seed", str(seed), "--start", start,
                    "--outbreaks", str(int(120 * (TEST_FROM - dt.date.fromisoformat(start)).days / 728 + 40))],
                   check=True, capture_output=True)
    df = pd.read_csv(HERE / "data" / "weekly_counts.csv"); df["week"] = pd.to_datetime(df.week_start).dt.date
    return df, pd.read_csv(HERE / "data" / "outbreaks.csv")


def score_curve(test, key, exp_col, detector):
    test = test.sort_values(["college", "complaint", "week"]).reset_index(drop=True)
    unit = test.college + "|" + test.complaint
    g = test.groupby(unit)
    pn, pe = g.cases.shift(1), g[exp_col].shift(1)
    pn2, pe2 = g.cases.shift(2), g[exp_col].shift(2)
    watched = test.complaint.isin(WATCHED).values
    truth = set()
    outs = []
    for o in key.itertuples():
        w0 = dt.date.fromisoformat(o.start_week)
        for k in range(o.weeks):
            truth.add((o.college, o.complaint, w0 + dt.timedelta(weeks=k)))
        if w0 >= TEST_FROM:
            outs.append((o.college, o.complaint, w0, o.weeks))
    months = ((test.week.max() - TEST_FROM).days + 7) / 30.44
    rows = list(zip(watched, test.cases, test[exp_col], pn, pe, pn2, pe2, test.college, test.complaint, test.week))
    curve = []
    for al in ALPHAS:
        alerts = set()
        for w, n, e, a, b, c, d, col, comp, wk in rows:
            if not w:
                continue
            A = None if pd.isna(a) else int(a); B = None if pd.isna(b) else float(b)
            C = None if pd.isna(c) else int(c); D = None if pd.isna(d) else float(d)
            if detector(int(n), float(e), A, B, C, D, al):
                alerts.add((col, comp, wk))
        found = sum(any((c, k, w0 + dt.timedelta(weeks=i)) in alerts for i in range(wk_)) for c, k, w0, wk_ in outs)
        false = sum(1 for a in alerts if a not in truth)
        curve.append((false / months, found, len(outs)))
    return curve


def at_budget(curve, budget):
    ok = [(f / t) for fa, f, t in curve if fa <= budget]
    return max(ok) if ok else float("nan")


def run(label, start, variant, detector):
    pooled = defaultdict(lambda: [0.0, 0, 0]); errs = []
    for s in SEEDS:
        df, key = load(s, start)
        train, test = df[df.week < TEST_FROM].copy(), df[df.week >= TEST_FROM].copy()
        if variant == "oracle":   # knows the real normal level used to make the data: the best any model could do
            test["exp"] = [true_rate(c, k, w, year_index_of(w)) for c, k, w in zip(test.college, test.complaint, test.week)]
        else:
            feats, names, l2 = VARIANTS[variant]
            test["exp"] = fit(train, feats, names, l2)(test)
        errs.append(float(np.mean(np.abs(test.cases - test.exp))))
        for i, (fa, f, t) in enumerate(score_curve(test, key, "exp", DETECTORS[detector])):
            p = pooled[i]; p[0] += fa / len(SEEDS); p[1] += f; p[2] += t
    curve = [tuple(pooled[i]) for i in range(len(ALPHAS))]
    r = (label, at_budget(curve, 0.5), at_budget(curve, 1.0), float(np.mean(errs)), curve[0][2])
    print(f"{label:42s} ≤0.5/mo: {r[1]*100:5.1f}%   ≤1/mo: {r[2]*100:5.1f}%   error {r[3]:.3f}   ({r[4]} outbreaks)", flush=True)
    return r


def main():
    results = [
        run("A. current (2 yrs, base model, week+2wk)", "2023-08-07", "base", "week+2wk (current)"),
        run("B. more data: 5 years of training", "2020-08-10", "base", "week+2wk (current)"),
        run("B2. 3 years of training", "2022-08-08", "base", "week+2wk (current)"),
        run("C. smarter model: college×complaint", "2023-08-07", "interaction", "week+2wk (current)"),
        run("D. 5 years + college×complaint", "2020-08-10", "interaction", "week+2wk (current)"),
        run("E. detector: week only", "2023-08-07", "base", "week only"),
        run("F. detector: + 3-week window", "2023-08-07", "base", "week+2wk+3wk"),
        run("G. detector: min 3 cases", "2023-08-07", "base", "week+2wk, min 3 cases"),
        run("H. CEILING: a perfect model (knows the true normal level)", "2023-08-07", "oracle", "week+2wk (current)"),
    ]
    lines = ["# What makes the model better? — experiments", "",
             "20 synthetic datasets pooled, test year 2025-08 to 2026-07. Detection = share of hidden outbreaks caught "
             "when each version is allowed at most 0.5 or 1 false alarm per month.", "",
             "| Experiment | Caught (≤0.5 false/month) | Caught (≤1 false/month) | Prediction error |", "|---|---|---|---|"]
    lines += [f"| {r[0]} | {r[1]*100:.1f}% | {r[2]*100:.1f}% | {r[3]:.3f} |" for r in results]
    (HERE / "experiments.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
