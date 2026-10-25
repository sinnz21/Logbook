# Health Surveillance Training Guide

*How the outbreak early-warning model was trained, tested and used: for beginners and the defense.*

This guide explains, from zero, how the outbreak early-warning model of the
**ISU Infirmary Logbook Management and Health Surveillance System** was trained,
tested and plugged into the system, and how you can rerun every step yourself.

---

## 1. The 30-second answer (memorize this)

> "We trained a **Poisson regression** model on weekly clinic counts per **college ×
> complaint**. It learns what a **normal** week looks like for each college and complaint
> at each time of the school year (rainy season, exam weeks, breaks). Every week the
> system compares the real count with the model's expected count. If the count is so high
> that it would happen by chance **less than 0.5% of the time**, it raises an alert,
> e.g. *'Viral Flu cluster in CCSICT: 7 cases, about 4× normal.'*
> On a test year the model never saw, it caught **71%** of hidden outbreaks with only
> **1 false alarm in the whole year**, while the usual 'average of the last 4 weeks' rule
> caught 60% with 18 false alarms."

---

## 2. "Did you use the same data, with no changes?"

**Yes.** The model in the system (`model.json`) was trained on exactly one dataset:

| Setting | Value |
|---|---|
| Program that made it | `generate_data.py` |
| Seed (the "random number" starting point) | **7** |
| Dates | 2023-08-07 to 2026-07-27 (156 weeks = 3 school years) |
| Files | `data/weekly_counts.csv` and `data/outbreaks.csv` |

The same seed always produces the same numbers, so anyone can recreate it.
We checked this: regenerating the data gives a **byte-for-byte identical** file, and
retraining on it gives **exactly the same model weights** (difference 0.0).

The bigger tests (5 datasets in `evaluate.py`, 20 datasets in `experiments.py`) use the
same program with other seeds (1–20). Those are only for testing how reliable the results
are. They were **not** used to train the model in the system.

> **Important:** the data is **synthetic** (computer-generated), not real patients.
> Say this openly in the defense. See section 10 for why.

---

## 3. The files

All inside `BackendAndDatabase\backend\health_surveillance\`:

| File | What it is |
|---|---|
| `data\weekly_counts.csv` | **The training data.** One row = one college + one complaint + one week. |
| `data\outbreaks.csv` | **The answer key.** The hidden outbreaks. The model never sees this; it is only used to grade it. |
| `config.py` | Lists of colleges, complaints, watched complaints, and the alert settings (0.005 and 4 cases). |
| `generate_data.py` | Makes the synthetic data. |
| `model.py` | The model formula and the alert rule (plain Python). |
| `train.py` | Trains the model, tests it, saves `model.json`, `metrics.json`, `report.md`, `example_alert.png`. |
| `model.json` | **The trained model** = the learned numbers (weights). This is what the system uses. |
| `evaluate.py` | Repeats the test on 5 datasets, draws `tradeoff_curve.png`. |
| `experiments.py` | "Can it be better?" tests, compared with a perfect model. |
| `..\app\api\routes\health_surveillance.py` | The API endpoint that uses the model inside the system. |

---

## 4. The data, explained

### `weekly_counts.csv` (15,444 rows)

```
week_start,college,complaint,cases
2023-08-07,CCSICT,Fever,4
2023-08-07,CCSICT,Viral Flu,1
```

* **week_start**: the Monday of the week
* **college**: CCSICT, CON, COE, CED, CA, CBM, CCJE, CAS, OTHER (9)
* **complaint**: Fever, Viral Flu, Cough / Colds, Tension Headache, Dizziness, Dysmenorrhea,
  Stomach Pain, Allergic Reaction, Wound / Abrasion, Elevated Blood Pressure, Other (11)
* **cases**: how many visits that week

156 weeks × 9 colleges × 11 complaints = **15,444 rows**, about **13,304 visits**
(about 85 a week).

### How the fake data was made (so it behaves like a real campus clinic)

| Real-life pattern | How it is built in |
|---|---|
| Big colleges send more patients | Each college has a size (CCSICT 1.4 … OTHER 0.6) |
| Some complaints are more common | Each complaint has a base rate (Headache 1.5/week … High BP 0.3/week) |
| Flu, fever and cough rise in the rainy season | A seasonal curve peaking around September |
| Headache, dizziness and stomach pain rise in exam weeks | Exam weeks raise these |
| Few students during breaks | Breaks (June–July, Christmas, late May) cut visits to 20% |
| Enrollment grows | +4% a year |
| Weeks are never exactly the same | Random **Poisson** noise |
| **Outbreaks** | 120 hidden clusters: one college gets **3–8 extra cases a week** of one spreadable complaint for **1–3 weeks** |

### `outbreaks.csv` (the answer key, 120 rows)

```
outbreak_id,college,complaint,start_week,weeks,extra_per_week
3,CCSICT,Fever,2024-03-04,3,6
```

= "Starting 2024-03-04, CCSICT had 6 extra Fever cases a week for 3 weeks."
85 outbreaks fall in the training years and **35 in the test year**.

---

## 5. Run everything yourself (step by step)

Open **PowerShell** on the laptop.

**Step 1: go to the backend folder and turn on the virtual environment**

```powershell
cd "C:\Users\com sci\Logbook-git\BackendAndDatabase\backend"
.\.venv\Scripts\Activate.ps1
```

Your prompt now starts with `(.venv)`.

**Step 2: install the training libraries (only once)**

```powershell
pip install -r health_surveillance\requirements-surveillance.txt
```

This installs numpy, pandas, scikit-learn and matplotlib.

**Step 3: make the data (optional, because it's already in `data\`)**

```powershell
python -m health_surveillance.generate_data
```

Expected output:

```
156 weeks x 9 colleges x 11 complaints = 15444 rows
120 hidden outbreaks written to the answer key
```

**Step 4: train and test**

```powershell
python -m health_surveillance.train
```

It takes about 4 seconds. Expected output:

```
training rows 10296  (2023-08-07 to 2025-07-28)
testing rows  5148  (2025-08-04 to 2026-07-27)

                      model    baseline
detection_rate             0.714        0.6
avg_days_to_detect          12.9       11.0
false_alarms_per_month      0.08       1.51
detected                      25         21
false_alarms                   1         18
mean abs error              0.72       0.90

saved model.json, metrics.json, report.md
```

If you see these numbers, you reproduced our training exactly.

**Step 5: bigger tests (optional)**

```powershell
python -m health_surveillance.evaluate       # 5 datasets, about 10 seconds
python -m health_surveillance.experiments    # 20 datasets, about 3 minutes
```

**Step 6: put the data back if you changed it.** `evaluate` and `experiments` overwrite
`data\` with other seeds while they run. To get the original data back:

```powershell
python -m health_surveillance.generate_data
```

(Seed 7 is the default, so this brings back the exact same files.)

> **Note:** `python -m health_surveillance.train` overwrites `model.json`. With the seed-7
> data, it writes the same weights again, so nothing changes. Only the `trained_at`
> date inside the file updates.

---

## 6. What "training" means here (the noob version)

### The question the model answers

> "For **this college**, **this complaint**, **this week of the year**, how many cases
> are **normal**?"

### The formula

```
expected cases = e^( intercept + college weight + complaint weight
                     + season weights + exam-week weight + break weight + trend weight )
```

* Each **weight** is a number the model learns.
* **e^( … )** (exponential) turns the sum into a positive number and makes the weights
  **multiply**. For example, "CCSICT is 1.4× bigger" and "rainy season is 2× higher"
  combine to 2.8× instead of adding up.
* This is called **Poisson regression**, the standard regression for **counts** (0, 1, 2,
  3 … patients). Normal linear regression can predict negative or fractional counts, so
  it's the wrong tool for this.

### What training does

1. Start with all weights at 0.
2. For each of the 10,296 training rows, compute the expected cases and compare them with
   the real cases.
3. Nudge the weights so the expected numbers get closer to the real ones (the
   **maximum-likelihood** fit). scikit-learn does this for us with `PoissonRegressor`.
4. Repeat until the weights stop changing.
5. Save the final **77 weights + 1 intercept** to `model.json`.

The training code is basically these lines in `train.py`:

```python
model = PoissonRegressor(alpha=1e-4, max_iter=3000)
model.fit(X_train, y_train)          # X = features of each row, y = cases
```

* **X** (features): which college, which complaint, where in the year (sin/cos of the
  week; that's how a model "sees" seasons that repeat every year), whether it's an exam
  week or a break, and years since 2023.
* **y** (target): the number of cases.
* `alpha=1e-4` here is a tiny penalty that keeps weights from becoming extreme
  (**regularization**). It is **not** the same as the 0.005 alert threshold.

### Worked example (real numbers from our `model.json`)

**CCSICT, Viral Flu, week of 9 February 2026:**

| Part | Value × weight | Adds |
|---|---|---|
| intercept | | −0.178 |
| college = CCSICT | 1 × 0.320 | +0.320 |
| complaint = Viral Flu | 1 × 0.528 | +0.528 |
| season (4 sin/cos terms for Viral Flu) | | −0.154 |
| break week? no | 0 × −1.434 | 0 |
| exam week? no | 0 × −0.064 | 0 |
| trend (2.5 years since Aug 2023) | 2.511 × −0.018 | −0.046 |
| **total** | | **0.470** |

**Expected = e^0.470 ≈ 1.6 cases** that week. That's normal for CCSICT Viral Flu in
February.

Things the model learned by itself:

* Same college and complaint in the **rainy season** (September 8, 2025): **3.1** cases
  are normal.
* In the **July break**: only **0.4**.
* The break weight is −1.434, so e^−1.434 = **0.24×** visits during breaks. The data
  generator used 0.2×, so the model found the pattern on its own.

---

## 7. How the alert decides (the statistics part)

The model says "1.6 is normal." This week CCSICT has **7** Viral Flu cases. Is that an
outbreak or just bad luck?

We ask: **if 1.6 is the normal average, how likely is 7 or more by pure chance?**
The Poisson distribution answers this:

| Cases this week | Chance of this many or more (normal = 1.6) |
|---|---|
| 3 | 21.7% (common) |
| 4 | 7.9% |
| 5 | 2.4% |
| 6 | 0.60% |
| **7** | **0.13%** → **ALERT** |

This chance is called the **p-value**. The rule:

* **Sudden-spike test:** p-value of this week **< 0.25%** and at least **4 cases**.
* **Slow-build-up test:** p-value of this week + last week together **< 0.25%**, and this
  week is still high.
* Two tests × 0.25% = the **0.5% (0.005)** overall setting in `config.py`. Splitting it
  keeps false alarms from doubling.
* Only spreadable complaints are watched: Fever, Viral Flu, Cough / Colds, Stomach Pain,
  Allergic Reaction.

**The season matters.** The same 7 cases in **September**, when normal is 3.1, has a
p-value of 3.8%, so **no alert**: 7 flu cases in the rainy season is normal. A simple
"more than 5 cases = alert" rule can't make this distinction. This is the main reason we
use a trained model.

---

## 8. How we tested it (and why it's fair)

1. **Time split:** train on years 1–2 (Aug 2023 to Jul 2025), test on year 3
   (Aug 2025 to Jul 2026). The model **never saw** the test year, so it's like
   predicting the future.
2. Go week by week through the test year and apply the alert rule.
3. Grade it against the **answer key**: an outbreak counts as **caught** if any of its
   weeks raised an alert. Any alert that's not in the answer key is a **false alarm**.
4. Compare with a **baseline**, the simple rule a clinic might use: "average of the last
   4 weeks."

### Results (seed 7, the model in the system)

| | Our model | Baseline |
|---|---|---|
| Outbreaks caught | **25 / 35 (71%)** | 21 / 35 (60%) |
| False alarms in the year | **1** (0.08 a month) | 18 (1.51 a month) |
| Average days to detect | 12.9 | 11.0 |
| Prediction error (cases/week) | **0.72** | 0.90 |

The baseline detects about 2 days faster only because it alarms all the time. Being
"early" doesn't help if the nurse stops trusting the alerts.

### Fair comparison (5 datasets, `evaluate.py`)

Both methods get the **same false-alarm budget**:

| False alarms allowed | Our model | Baseline |
|---|---|---|
| ≤ 1 a month | **69%** caught | 53% |
| ≤ 2 a month | **74%** | 63% |
| ≤ 3 a month | **80%** | 66% |

### Is it the best possible? (20 datasets, `experiments.py`)

A "perfect model" that knows the exact true normal rate catches **74%** at ≤1 false alarm
a month. Ours catches **71%**, within 3 points of the ceiling. More training data, a
bigger model and other alert rules did **not** beat it.

### By outbreak size (alpha 0.005)

| Extra cases a week | Caught |
|---|---|
| +3 | ~36% |
| +4 | ~50% |
| +5 | ~66% |
| +6 | ~70% |
| +8 | ~93% |

Small outbreaks (+3) look like normal noise, so no method can reliably catch them from
counts alone.

---

## 9. How it is applied in the system

```
Nurse logs a visit  →  database (visits + complaint tag + patient's department)
                                   │
Nurse opens the dashboard  →  GET /api/surveillance/alerts
                                   │
        1. Count this week's visits per college × complaint
           (if a visit has no complaint tag, keywords like "lagnat", "ubo",
            "trangkaso" in the chief complaint are used)
        2. Load model.json → expected count for each college × complaint
        3. Calibrate: real clinic size ÷ training-data size (last 12 weeks)
        4. Apply the alert rule (section 7)
        5. Return alerts like "Viral Flu cluster in CCSICT: 7 cases, ~4× normal"
```

* The server only needs **`model.json`** plus the small formula in `model.py`. No
  scikit-learn on the server, so it's light and fast.
* **Calibration:** the real ISU clinic may be smaller or bigger than the fake data. The
  model learned the **shape** (which college, which season). The calibration scale fixes
  the **size** using the clinic's own last 12 weeks (only when there are at least 20 cases
  in that period, so a nearly empty database doesn't break it).
* **Partial week:** on a Wednesday, only 3/7 of the week has happened, so the expected
  count is reduced to match.
* **To test in the browser:** run `uvicorn app.main:app --reload`, open `http://localhost:8000/docs`,
  sign in with **Authorize**, then try `GET /api/surveillance/alerts`. Add `?week=2026-02-09` to check a past week.

---

## 10. Using the data for your own training

The two CSV files are plain tables. You can open them in **Excel**, **Google Sheets**,
**Google Colab** or Python.

**Rules so your results are fair:**

1. **Don't use `outbreaks.csv` as an input.** It's the answer key, only for grading.
2. **Keep the time split:** train on weeks **before 2025-08-04**, test on weeks **from
   2025-08-04**. Never shuffle the rows randomly: that would leak the future into training.
3. Score the same way: % of the 35 test outbreaks caught and false alarms per month.

**Minimal Python to load and split:**

```python
import pandas as pd
df = pd.read_csv("health_surveillance/data/weekly_counts.csv")
key = pd.read_csv("health_surveillance/data/outbreaks.csv")
train = df[df.week_start < "2025-08-04"]     # 10,296 rows
test  = df[df.week_start >= "2025-08-04"]    #  5,148 rows
print(train.head())
```

If you want the system to use a model you trained another way, it must output an
**expected count** for each (week, college, complaint). The alert rule and API stay the
same.

---

## 11. Defense Q&A (likely panel questions)

**Q: Why synthetic data, not real data?**
A: The clinic's digital records are new, and real outbreaks are rare. To *test* a
detector you need an **answer key** (which weeks really had outbreaks). Real data doesn't
come with one. With synthetic data, we hide 120 outbreaks and measure exactly how many the
model finds. This is the standard way outbreak-detection methods are tested. Once the
clinic has about a year of real records, we retrain on them. The calibration step already
adjusts the model to the real clinic's size.

**Q: Where is the AI / machine learning?**
A: The model **learns** 78 numbers from 10,296 weekly records (supervised learning,
Poisson regression with scikit-learn). Nobody typed in "flu rises in September" or
"breaks cut visits to 20%": the model found these patterns from data. Then it **predicts**
the normal count for weeks it has never seen.

**Q: Why Poisson regression and not a neural network?**
A: (1) The data is **counts** of patients, which is exactly what Poisson regression is
made for. (2) It's **explainable**: we can show each weight and say why an alert happened.
That matters in health. (3) Our test shows we're within 3 points of a perfect model, so a
more complex model has almost nothing to gain. When we tried a bigger model, it did not
improve.

**Q: Why sin and cos?**
A: They turn "week of the year" into a smooth circle, so late December and early January
are close together. This lets the model learn yearly seasons.

**Q: What is a p-value here?**
A: The chance of seeing this many cases or more if nothing unusual is happening. We alert
when it's below 0.5% (split into two 0.25% tests).

**Q: Why 0.005 and at least 4 cases?**
A: We tested many thresholds (the trade-off curve). 0.005 gave about 0.1–0.3 false alarms
a month while still catching most outbreaks. The 4-case minimum stops alerts for tiny
colleges, where 2 cases can look "unusual."

**Q: How do you know it's not just memorizing?**
A: It's tested on a whole school year it **never saw**, split by time, not randomly.

**Q: Why not just use "average of the last 4 weeks"?**
A: We tested it. At the same false-alarm budget, it catches 53% vs our 69%. It also only looks
backward, so when the rainy season starts it mistakes the normal rise for an outbreak.

**Q: What does it miss?**
A: Small outbreaks (+3 extra cases a week) are caught only about 36% of the time, because
they look like normal noise. We're honest about this. A perfect model would also miss them.

**Q: How does the real system use it?**
A: Section 9: it counts this week's visits, gets the expected count from `model.json`,
calibrates it to the clinic's size, runs the p-value test and shows the alert.

**Q: Can you retrain it?**
A: Yes. One command (`python -m health_surveillance.train`) in about 4 seconds. It produces a new
`model.json` and the system uses it after a restart.

---

## 12. Glossary

| Word | Meaning |
|---|---|
| Feature | An input the model looks at (college, complaint, season, exam week…) |
| Weight / coefficient | A number the model learned for one feature |
| Training | Finding the weights that best fit past data |
| Poisson | The math of random counts (patients per week) |
| Expected count | What the model says is normal for that week |
| p-value | Chance of seeing this many cases or more if nothing unusual is happening |
| False alarm | An alert when there was no outbreak |
| Detection rate | % of real outbreaks that raised an alert |
| Baseline | A simple method we compare against |
| Seed | Starting number for randomness; same seed = same data |
| Synthetic data | Realistic computer-generated data with a known answer key |
| Calibration | Scaling the model to the real clinic's size |
| Regularization | A small penalty that keeps weights from becoming extreme |
