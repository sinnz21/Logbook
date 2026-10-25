# Health Surveillance — Outbreak Early Warning

The CS component of the **ISU Infirmary Logbook Management and Health Surveillance System**.

The system learns how many clinic visits are **normal** for each college and complaint
at each time of the school year, and warns the nurses on duty when a week is **unusually high**,
for example *"Viral Flu cluster in CCSICT: 7 cases this week, about 8.3× the normal 0.8."*

## How it works

| Step | What happens | File |
|---|---|---|
| 1. Data | Visits are counted per **college × complaint × week** | `generate_data.py` (synthetic) / the database (real) |
| 2. Model | **Poisson regression**: expected cases = exp(college + complaint + seasonal curve + break/exam week + trend) | `model.py` |
| 3. Training | scikit-learn fits the model's coefficients on two school years of weekly counts | `train.py` → `model.json` |
| 4. Alert rule | A week is flagged when P(cases ≥ observed) < 0.005 under the model **and** there are at least 4 cases. Checked for this week alone (sudden spike) and the last two weeks together (slow build-up). | `model.py` → `check_unit()` |
| 5. Calibration | The real clinic is smaller or bigger than the training data, so the backend scales the model to the clinic's own last 12 weeks before comparing | `app/api/routes/health_surveillance.py` |

Only spreadable complaints raise alerts: Fever, Viral Flu, Cough / Colds, Stomach Pain, Allergic Reaction.

## Evaluation

Synthetic data: 3 school years, 9 colleges, 11 complaints (about 81 visits a week), with
seasons, school breaks, exam weeks, random noise, and **hidden outbreaks** (3–8 extra cases a
week for 1–3 weeks) recorded in a separate answer key the model never sees.

* Train on years 1–2, test on year 3 (data the model never saw).
* Compare with the rule most clinics use: **average of the last 4 weeks**.
* Repeat on 5 independently generated datasets (198 outbreaks) and pool the results.

**Same false-alarm budget, who catches more?** (from `evaluation.md`)

| False alarms allowed | Our model | Baseline |
|---|---|---|
| ≤ 1 per month | **69%** of outbreaks | 53% |
| ≤ 2 per month | **74%** | 63% |
| ≤ 3 per month | **80%** | 66% |

At the system's setting (alpha 0.005): about **64–71%** of outbreaks caught, **93%** of large ones
(+8 cases/week), with about **0.1–0.3 false alarms a month**, versus 1.5–1.9 for the baseline.

Charts: `tradeoff_curve.png` (detection vs. false alarms) and `example_alert.png`
(one outbreak, the expected line, and the alerts).

**Can more training make it better?** (`experiments.py` → `experiments.md`, 20 datasets, about 930
outbreaks.) We changed one thing at a time: 3 or 5 years of training data instead of 2, a bigger model
with a separate rate for every college × complaint pair, and three other alert rules. None of them
did consistently better than the current design. To see why, we scored a **perfect model** that
knows the exact normal rate used to make the data:

| At ≤ 1 false alarm a month | Caught | Prediction error |
|---|---|---|
| Our model (2 years of training) | 71% | 0.74 |
| Perfect model (the ceiling) | 74% | 0.72 |

Our model is within 3 points of the best possible. The outbreaks it misses are small enough to look
like ordinary week-to-week noise, so no amount of extra training can catch them from counts alone.

**Honest limits:** small outbreaks (+3 cases a week) are caught only about a third of the time,
because they look like normal noise. Results are on synthetic data; the model should be retrained
once the clinic has a full year of real records.

## Commands (run from the `backend` folder)

```powershell
pip install -r health_surveillance/requirements-surveillance.txt   # only needed for training
python -m health_surveillance.generate_data      # make 3 years of synthetic data with hidden outbreaks
python -m health_surveillance.train              # train, test, save model.json + report.md + example_alert.png
python -m health_surveillance.evaluate           # full 5-dataset evaluation + tradeoff_curve.png (~10 s)
python -m health_surveillance.experiments        # what-if experiments vs. a perfect model (~3 min)
```

The backend only needs `model.json` (no machine-learning libraries at run time).
API: `GET /api/surveillance/alerts?week=YYYY-MM-DD` (default: this week).
