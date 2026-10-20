# Health Surveillance Model — Evaluation

Trained on 2023-08-07 to 2025-07-28 (10,296 weekly counts); tested on 2025-08-04 to 2026-07-27 (5,148 weekly counts) the model never saw.

| Metric | Poisson model | Baseline (avg of last 4 weeks) |
|---|---|---|
| Outbreaks in test year | 35 | 35 |
| Detected | 25 (71%) | 21 (60%) |
| Average days to detect | 12.9 | 11.0 |
| False alarms per month | 0.08 | 1.51 |
| Mean absolute error (cases/week) | 0.722 | 0.9 |

Alert rule: P(cases ≥ observed) < 0.005 and at least 4 cases, for Fever, Viral Flu, Cough / Colds, Stomach Pain, Allergic Reaction.
