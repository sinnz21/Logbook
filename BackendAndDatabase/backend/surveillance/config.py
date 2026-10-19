"""Shared settings for the health surveillance model.

The model works on WEEKLY case counts per (college, complaint) — one "unit"
is e.g. "CCSICT / Fever". Everything here is shared by the data generator,
the trainer, and the backend endpoint so they always agree.
"""

# Colleges / groups the clinic serves. Patients whose department doesn't match
# one of these are counted under "OTHER" (offices, visitors).
COLLEGES = ["CCSICT", "CON", "COE", "CED", "CA", "CBM", "CCJE", "CAS", "OTHER"]

# Complaint categories — the same names as the `complaints` lookup table.
COMPLAINTS = [
    "Fever", "Viral Flu", "Cough / Colds", "Tension Headache", "Dizziness",
    "Dysmenorrhea", "Stomach Pain", "Allergic Reaction", "Wound / Abrasion",
    "Elevated Blood Pressure", "Other",
]

# Complaints that can spread person to person or through food, so a sudden
# rise matters. Alerts are only raised for these.
WATCHED = ["Fever", "Viral Flu", "Cough / Colds", "Stomach Pain", "Allergic Reaction"]

# Alert rule: a week is flagged when the observed count is this unlikely under
# the model's expected count (Poisson upper tail), and there are at least
# MIN_CASES cases (so 1 -> 2 cases never raises an alarm).
ALPHA = 0.005
MIN_CASES = 4

# Rainy / flu season in Isabela (June to November).
RAINY_MONTHS = {6, 7, 8, 9, 10, 11}

# Department aliases seen in real records -> model college code.
ALIASES = {
    "CCSICT": "CCSICT", "COLLEGE OF COMPUTING STUDIES": "CCSICT",
    "CON": "CON", "COLLEGE OF NURSING": "CON", "NURSING": "CON",
    "COE": "COE", "COLLEGE OF ENGINEERING": "COE", "ENGINEERING": "COE",
    "CED": "CED", "COLLEGE OF EDUCATION": "CED", "EDUCATION": "CED",
    "CA": "CA", "COLLEGE OF AGRICULTURE": "CA", "AGRICULTURE": "CA",
    "CBM": "CBM", "COLLEGE OF BUSINESS": "CBM", "BUSINESS": "CBM",
    "CCJE": "CCJE", "COLLEGE OF CRIMINOLOGY": "CCJE", "CRIMINOLOGY": "CCJE",
    "CAS": "CAS", "COLLEGE OF ARTS AND SCIENCES": "CAS",
}


def college_of(department: str | None) -> str:
    d = (department or "").strip().upper()
    if d in ALIASES:
        return ALIASES[d]
    for key, code in ALIASES.items():
        if key in d:
            return code
    return "OTHER"
