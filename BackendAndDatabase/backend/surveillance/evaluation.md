# Surveillance model — full evaluation

5 independent synthetic datasets, 198 hidden outbreaks in the test years, 60 test-months in total. Each outbreak adds 3–8 extra cases a week for 1–3 weeks.

## Same false-alarm budget, who catches more?

| False alarms allowed | Model catches | Baseline catches |
|---|---|---|
| ≤ 0.5 per month | 64% (avg 11.6 days) | – |
| ≤ 1.0 per month | 69% (avg 11.1 days) | 53% (avg 10.9 days) |
| ≤ 2.0 per month | 74% (avg 11.0 days) | 63% (avg 9.6 days) |
| ≤ 3.0 per month | 80% (avg 10.5 days) | 66% (avg 9.4 days) |

## Full curve

| alpha | Model: detected / false per month | Baseline: detected / false per month |
|---|---|---|
| 0.0005 | 47% / 0.05 | 44% / 0.54 |
| 0.001 | 50% / 0.1 | 46% / 0.62 |
| 0.002 | 56% / 0.17 | 53% / 0.9 |
| 0.005 | 64% / 0.3 | 63% / 1.89 |
| 0.01 | 69% / 0.59 | 66% / 2.44 |
| 0.02 | 74% / 1.14 | 69% / 3.46 |
| 0.05 | 80% / 2.09 | 79% / 5.45 |
| 0.1 | 86% / 4.01 | 83% / 7.48 |

## Detection by outbreak size (system setting: alpha = 0.005, pooled over 5 datasets)

| Extra cases per week | Model | Baseline (same alpha) |
|---|---|---|
| +3 | 36% | 36% |
| +4 | 50% | 50% |
| +5 | 66% | 57% |
| +6 | 70% | 82% |
| +8 | 93% | 86% |

## False alarms on pure noise

Simulated 520 weeks with no outbreaks at all: 0.23 false alarms per month for a clinic about a third the size of the training data, 0.32 per month at full size.
