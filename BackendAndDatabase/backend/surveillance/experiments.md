# What makes the model better? — experiments

20 synthetic datasets pooled, test year 2025-08 to 2026-07. Detection = share of hidden outbreaks caught when each version is allowed at most 0.5 or 1 false alarm per month.

| Experiment | Caught (≤0.5 false/month) | Caught (≤1 false/month) | Prediction error |
|---|---|---|---|
| A. current (2 yrs, base model, week+2wk) | 66.9% | 70.9% | 0.743 |
| B. more data: 5 years of training | 65.5% | 71.2% | 0.746 |
| B2. 3 years of training | 67.9% | 74.0% | 0.745 |
| C. smarter model: college×complaint | 66.6% | 71.9% | 0.747 |
| D. 5 years + college×complaint | 66.1% | 71.8% | 0.749 |
| E. detector: week only | 62.7% | 70.5% | 0.743 |
| F. detector: + 3-week window | 49.4% | 64.5% | 0.743 |
| G. detector: min 3 cases | 67.0% | 71.3% | 0.743 |
| H. CEILING: a perfect model (knows the true normal level) | 69.0% | 74.1% | 0.720 |

Row H is the ceiling: it uses the exact normal rate that generated the data, which no real model can know. The current model (row A) is within about 3 points of it, so extra data, a bigger model, or a different alert rule cannot add much. Differences of 2–3 points between rows are within run-to-run noise.
