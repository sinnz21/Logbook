"""Full evaluation: detection vs. false alarms, model vs. baseline.

One alert threshold can make any method look good (alert on everything and you
"catch" every outbreak). The fair comparison is a trade-off curve: for several
thresholds, how many outbreaks does each method catch, and how many false
alarms does it raise? A better method catches more at the same false-alarm rate.

The experiment is repeated on 5 independently generated datasets (different
random seeds) and the results are pooled, so one lucky dataset can't decide it.

usage:  python -m surveillance.evaluate          (from the backend folder; ~1 minute)
Writes: evaluation.json, evaluation.md, tradeoff_curve.png
"""
import datetime as dt
import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import PoissonRegressor

from surveillance.config import MIN_CASES, WATCHED
from surveillance.model import Model, check_unit, feature_names
from surveillance.train import baseline_expected, design_matrix

HERE = Path(__file__).parent
SEEDS = [1, 2, 3, 4, 5]
ALPHAS = [0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1]
TEST_FROM = dt.date(2025, 8, 4)


def run_seed(seed: int):
    subprocess.run([sys.executable, "-m", "surveillance.generate_data", "--seed", str(seed),
                    "--outbreaks", "120"], check=True, capture_output=True)
    df = pd.read_csv(HERE / "data" / "weekly_counts.csv"); df["week"] = pd.to_datetime(df.week_start).dt.date
    key = pd.read_csv(HERE / "data" / "outbreaks.csv")
    train, test = df[df.week < TEST_FROM].copy(), df[df.week >= TEST_FROM].copy()
    names = feature_names()
    reg = PoissonRegressor(alpha=1e-4, max_iter=3000).fit(design_matrix(train, names), train.cases.values)
    m = Model({"intercept": float(reg.intercept_), "coef": dict(zip(names, map(float, reg.coef_)))})
    test = test.sort_values(["college", "complaint", "week"]).reset_index(drop=True)
    test["model"] = [m.expected(w, c, k) for w, c, k in zip(test.week, test.college, test.complaint)]
    hist = defaultdict(list)
    for r in df.sort_values("week").itertuples():
        hist[(r.college, r.complaint)].append((r.week, r.cases))
    test["baseline"] = [baseline_expected([n for w, n in hist[(r.college, r.complaint)] if w < r.week])
                        for r in test.itertuples()]
    unit = test.college + "|" + test.complaint
    test["prev"] = test.groupby(unit).cases.shift(1)
    for col in ("model", "baseline"):
        test[col + "_prev"] = test.groupby(unit)[col].shift(1)
    return test, key


def score(test, key, col, alpha):
    watched = test.complaint.isin(WATCHED)
    alert = [bool(w and check_unit(int(n), e, None if pd.isna(pn) else int(pn),
                                   None if pd.isna(pe) else float(pe), alpha=alpha)[0])
             for w, n, e, pn, pe in zip(watched, test.cases, test[col], test.prev, test[col + "_prev"])]
    a = test[alert]
    truth, found, total, delays = set(), 0, 0, []
    for o in key.itertuples():
        w0 = dt.date.fromisoformat(o.start_week)
        for k in range(o.weeks):
            truth.add((o.college, o.complaint, w0 + dt.timedelta(weeks=k)))
        if w0 < TEST_FROM:
            continue
        total += 1
        hits = a[(a.college == o.college) & (a.complaint == o.complaint) &
                 (a.week >= w0) & (a.week < w0 + dt.timedelta(weeks=o.weeks))]
        if len(hits):
            found += 1; delays.append((hits.week.min() - w0).days + 7)
    false = sum(1 for r in a.itertuples() if (r.college, r.complaint, r.week) not in truth)
    return found, total, false, delays


def main():
    pooled = {c: {al: [0, 0, 0, []] for al in ALPHAS} for c in ("model", "baseline")}
    months = 0.0
    for s in SEEDS:
        test, key = run_seed(s)
        months += ((test.week.max() - TEST_FROM).days + 7) / 30.44
        for c in pooled:
            for al in ALPHAS:
                f, t, fa, d = score(test, key, c, al)
                p = pooled[c][al]; p[0] += f; p[1] += t; p[2] += fa; p[3] += d
        print(f"seed {s} done", flush=True)

    out = {}
    for c in pooled:
        out[c] = [{"alpha": al, "detection_rate": round(p[0] / p[1], 3),
                   "false_alarms_per_month": round(p[2] / months, 2),
                   "avg_days_to_detect": round(float(np.mean(p[3])), 1) if p[3] else None,
                   "outbreaks": p[1]} for al, p in pooled[c].items()]
    (HERE / "evaluation.json").write_text(json.dumps(out, indent=1))

    # detection rate when both methods are held to the same false-alarm budget
    def at_budget(rows, budget):
        ok = [r for r in rows if r["false_alarms_per_month"] <= budget]
        return max(ok, key=lambda r: r["detection_rate"]) if ok else None

    lines = ["# Surveillance model — full evaluation", "",
             f"{len(SEEDS)} independent synthetic datasets, {out['model'][0]['outbreaks']} hidden outbreaks in the "
             f"test years, {months:.0f} test-months in total. Each outbreak adds 3–8 extra cases a week for 1–3 weeks.", "",
             "## Same false-alarm budget, who catches more?", "",
             "| False alarms allowed | Model catches | Baseline catches |", "|---|---|---|"]
    for budget in (0.5, 1.0, 2.0, 3.0):
        a, b = at_budget(out["model"], budget), at_budget(out["baseline"], budget)
        fmt = lambda r: f"{r['detection_rate']*100:.0f}% (avg {r['avg_days_to_detect']} days)" if r else "–"
        lines.append(f"| ≤ {budget} per month | {fmt(a)} | {fmt(b)} |")
    lines += ["", "## Full curve", "", "| alpha | Model: detected / false per month | Baseline: detected / false per month |",
              "|---|---|---|"]
    for a, b in zip(out["model"], out["baseline"]):
        lines.append(f"| {a['alpha']} | {a['detection_rate']*100:.0f}% / {a['false_alarms_per_month']} | "
                     f"{b['detection_rate']*100:.0f}% / {b['false_alarms_per_month']} |")
    (HERE / "evaluation.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))

    try:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(6.5, 4.2))
        for c, color, label in (("model", "#0f6e5f", "Poisson model (ours)"), ("baseline", "#b0b8b5", "Baseline: last-4-weeks average")):
            xs = [r["false_alarms_per_month"] for r in out[c]]; ys = [r["detection_rate"] * 100 for r in out[c]]
            ax.plot(xs, ys, marker="o", color=color, lw=2, label=label)
        ax.set_xlabel("False alarms per month"); ax.set_ylabel("Outbreaks detected (%)")
        ax.set_title("Detection vs. false alarms (higher and further left is better)", fontsize=10)
        ax.set_ylim(0, 100); ax.grid(alpha=0.25); ax.legend(frameon=False, fontsize=9)
        for s in ("top", "right"):
            ax.spines[s].set_visible(False)
        fig.tight_layout(); fig.savefig(HERE / "tradeoff_curve.png", dpi=150)
    except Exception as exc:
        print("chart skipped:", exc)


if __name__ == "__main__":
    main()
