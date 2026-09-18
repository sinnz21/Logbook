# ISU INFIRMARY LOG BOOK SYSTEM — DATABASE PLAN v2

**Supersedes:** `ISU_Infirmary_Complete_Database_Plan.txt` (v1, 17 tables)
**Target:** MySQL 8.0.16+ / MariaDB 10.5+ · InnoDB · utf8mb4_unicode_ci
**Backend:** Python — FastAPI + SQLAlchemy + Alembic + PyMySQL
**Frontend:** React

---

## 1. What changed from v1, and why

| # | Change | Reason |
|---|---|---|
| 1 | **Added `visit_supplies`** | v1 could stock and restock supplies but never record one being *used*. A `released` gauze row in the ledger had no source record. Workflow step 4 requires it. |
| 2 | **Added `complaints` + `visit_complaints`** | `chief_complaint` was free TEXT. "headache", "Headache" and "head ache" are three different strings — you cannot GROUP BY them. Every figure on the Insights screen depends on this. |
| 3 | **Added `login_attempts`** | v1 seeded `failed_login_limit = 5` with no table to count against. |
| 4 | **Added `deleted_at` to 6 tables** | v1 seeded `soft_delete_days = 90` but nothing was soft-deletable. |
| 5 | **`users.role` → `ENUM('admin','nurse')`** | Only Admin and Nurse/Staff exist. `doctor` and `staff` were dead values. |
| 6 | **`patients.age` → `date_of_birth`** | A stored age is wrong within a year. Age is derived. |
| 7 | **Added `patients.civil_status`** | The Medical Certificate prints it. |
| 8 | **Added `visits.management`** | Clinical record is four parts: Vitals → Complaints → **Management** → Treatment. v1 had only `treatment_notes`. |
| 9 | **`visit_date`/`time_in`/`time_out` → `started_at`/`ended_at` DATETIME** | A visit from 11:40 PM to 12:10 AM computed as a negative duration. |
| 10 | **Merged `medicine_categories` → `item_categories`** | v1 used an FK table for medicines but a plain VARCHAR for supplies, and seeded "Wound Care" as a *medicine* category. One taxonomy, one table. |
| 11 | **Dropped stored `stock_status`** | Nothing recomputed it. It was indexed, so queries would silently return stale rows. Now a generated column. |
| 12 | **Added `inventory_transactions.reference_type`** | `reference_id` was a bare INT — no way to tell a visit ID from a request ID except by convention in a comment. |
| 13 | **Added `received_by` / `received_at` to `stock_requests`** | Status jumped to `completed` with nobody recorded. Workflow step 9 is delivery confirmation. |
| 14 | **Added `system_settings.value_type`** | `'1'`, `'90'` and `'daily_3am'` were all TEXT. |
| 15 | **Seed corrections** | Added `Visitor` patient type; added `Allergy` and `Hypertension` special-case types. |

**Deliberately NOT added:** medical certificate / parental notification tables. Those are printed from existing visit and patient data. If the University Health Service later requires an issuance log, that is a v3 table.

**Deliberately NOT added:** batch/lot tracking. See §6.

---

## 2. Table list — 22 tables

**Accounts & security**
1. `users`
2. `login_attempts`

**People**
3. `patient_types`
4. `patients`

**Clinical**
5. `complaints`
6. `dispositions`
7. `visits`
8. `visit_complaints`
9. `special_case_types`
10. `patient_special_cases`

**Catalog**
11. `item_categories`
12. `medicines`
13. `supplies`

**Stock**
14. `medicine_stock`
15. `supply_stock`

**Consumption**
16. `visit_medicines`
17. `visit_supplies`

**Requisition**
18. `stock_requests`
19. `stock_request_items`

**Audit**
20. `inventory_transactions`
21. `activity_log`
22. `system_settings`

---

## 3. Tables

### 1. users
System accounts. Admin and Nurse/Staff only — patients never log in.

| Field | Type | Notes |
|---|---|---|
| user_id | INT PK AI | |
| first_name | VARCHAR(100) NOT NULL | |
| middle_name | VARCHAR(100) NULL | |
| last_name | VARCHAR(100) NOT NULL | |
| username | VARCHAR(50) NOT NULL | UNIQUE |
| password_hash | VARCHAR(255) NOT NULL | bcrypt or argon2 — never plaintext |
| role | ENUM('admin','nurse') NOT NULL | **changed in v2** |
| email | VARCHAR(150) NULL | UNIQUE |
| status | ENUM('active','inactive') DEFAULT 'active' | |
| last_login_at | DATETIME NULL | **new** — Admin dashboard shows it |
| deleted_at | DATETIME NULL | **new** — soft delete |
| created_at / updated_at | DATETIME | |

Indexes: `(role)`, `(status)`, `(deleted_at)`

### 2. login_attempts — NEW
Counts failed sign-ins so the account lockout in System Settings is enforceable.

| Field | Type | Notes |
|---|---|---|
| attempt_id | BIGINT PK AI | |
| username | VARCHAR(50) NOT NULL | stored even if no such user, to catch probing |
| user_id | INT NULL FK → users | NULL when the username doesn't exist |
| ip_address | VARCHAR(45) NULL | IPv6-safe length |
| successful | BOOLEAN NOT NULL | |
| attempted_at | DATETIME NOT NULL | |

Index: `(username, attempted_at)`
Rule: lock when `COUNT(*) WHERE successful = 0` in the last 15 minutes ≥ `failed_login_limit`.

### 3. patient_types
Seed: **Student, Faculty, Non-Teaching Staff (NASA), Visitor**

### 4. patients
Permanent details. One patient, many visits.

| Field | Type | Notes |
|---|---|---|
| patient_id | INT PK AI | |
| patient_number | VARCHAR(50) NULL | UNIQUE. Student/employee number. Visitors get `VIS-2026-0001` |
| first_name / middle_name / last_name | VARCHAR(100) | |
| sex | VARCHAR(30) NULL | |
| date_of_birth | DATE NULL | **changed in v2** — age is computed |
| civil_status | VARCHAR(30) NULL | **new** — Medical Certificate |
| contact_number | VARCHAR(30) NULL | |
| patient_type_id | INT FK → patient_types | |
| department / program / year_level | VARCHAR | Students and Faculty/NASA only |
| deleted_at | DATETIME NULL | **new** |
| created_at / updated_at | DATETIME | |

Indexes: `(last_name, first_name)`, `(patient_number)`, `(patient_type_id)`, `(deleted_at)`

### 5. complaints — NEW
The controlled vocabulary the Insights screen counts.

| Field | Type |
|---|---|
| complaint_id | INT PK AI |
| complaint_name | VARCHAR(100) NOT NULL UNIQUE |
| description | VARCHAR(255) NULL |
| active | BOOLEAN DEFAULT TRUE |

Seed: Tension Headache · Dysmenorrhea · Viral Flu · Fever · Cough / Colds · Wound / Abrasion · Stomach Pain · Dizziness · Allergic Reaction · Elevated Blood Pressure · Other

### 6. dispositions
Seed: Sent Home · Back to Class/Work · Hospital Admission · Referred to Doctor · Observation

### 7. visits
One clinic encounter.

| Field | Type | Notes |
|---|---|---|
| visit_id | INT PK AI | |
| patient_id | INT NOT NULL FK → patients | |
| attending_user_id | INT NULL FK → users | |
| chief_complaint | TEXT NOT NULL | the nurse's own wording — kept |
| management | TEXT NULL | **new** — what was done or advised |
| treatment_notes | TEXT NULL | |
| blood_pressure | VARCHAR(20) NULL | |
| temperature | DECIMAL(4,1) NULL | |
| pulse_rate | INT UNSIGNED NULL | |
| disposition_id | INT NULL FK → dispositions | |
| started_at | DATETIME NOT NULL | **changed in v2** — replaces visit_date + time_in |
| ended_at | DATETIME NULL | **changed in v2** |
| status | ENUM('waiting','in_care','completed','cancelled') | `referred` removed — that is a *disposition*, not a status |
| created_by | INT NULL FK → users | |
| updated_by | INT NULL FK → users | **new** |
| deleted_at | DATETIME NULL | **new** |
| created_at / updated_at | DATETIME | |

Indexes: `(patient_id, started_at)`, `(started_at)`, `(status)`, `(attending_user_id)`, `(deleted_at)`

**Note on status vs disposition:** status is *where the visit is in the workflow*; disposition is *how it ended*. v1 had `referred` in both, which meant two sources of truth.

### 8. visit_complaints — NEW
Junction. One visit may record several complaints.

| Field | Type |
|---|---|
| visit_complaint_id | INT PK AI |
| visit_id | INT NOT NULL FK → visits ON DELETE CASCADE |
| complaint_id | INT NOT NULL FK → complaints |
| is_primary | BOOLEAN DEFAULT FALSE |

UNIQUE `(visit_id, complaint_id)` · Index `(complaint_id)`

**This is the table the data-mining component runs on.** Co-occurrence ("fever and headache appear together") requires two rows for one visit — impossible with a single TEXT column.

### 9. special_case_types
Seed: PWD · Senior Citizen · **Allergy** · Anxiety · Asthma · **Hypertension** · Other

### 10. patient_special_cases
*Renamed from `visit_special_cases` — the old name implied it belonged to a visit.*

| Field | Type | Notes |
|---|---|---|
| patient_special_case_id | INT PK AI | |
| patient_id | INT NOT NULL FK → patients | the flag belongs to the **patient** |
| special_case_type_id | INT NOT NULL FK | |
| origin_visit_id | INT NULL FK → visits | which visit first raised it |
| notes | TEXT NULL | |
| flagged_by | INT NULL FK → users | |
| flagged_at | DATETIME NOT NULL | |
| active | BOOLEAN DEFAULT TRUE | retire without deleting |

Indexes: `(patient_id, active)`, `(special_case_type_id)`
UNIQUE `(patient_id, special_case_type_id, active)` — **new**, stops two live Allergy flags on one patient.

**Never create `is_pwd`, `is_senior`, `is_asthma` columns.** Adding a case type must be an INSERT, not a migration.

### 11. item_categories — replaces `medicine_categories`
| Field | Type |
|---|---|
| category_id | INT PK AI |
| category_name | VARCHAR(100) NOT NULL UNIQUE |
| applies_to | ENUM('medicine','supply','both') NOT NULL |
| description | VARCHAR(255) NULL |
| active | BOOLEAN DEFAULT TRUE |

Seed: Analgesic/Antipyretic (medicine) · Antibiotic (medicine) · Antihistamine (medicine) · Gastrointestinal (medicine) · Antiseptic (both) · Hydration (medicine) · Wound Care (supply) · PPE (supply)

### 12. medicines
`medicine_id` · `medicine_name` UNIQUE · `category_id` FK → item_categories · `unit` · `description` · `active` · `deleted_at` · timestamps

### 13. supplies
Same shape. **`category_id` is now an FK**, not a VARCHAR.

### 14. medicine_stock / 15. supply_stock
| Field | Type | Notes |
|---|---|---|
| stock_id | INT PK AI | |
| medicine_id / supply_id | INT NOT NULL FK | UNIQUE — one live row per item |
| quantity | DECIMAL(10,2) DEFAULT 0 | |
| reorder_level | DECIMAL(10,2) DEFAULT 0 | |
| expiry_date | DATE NULL | |
| stock_status | **generated column** | `out_of_stock` when qty ≤ 0; `low` when qty ≤ reorder_level; else `high` |
| updated_by | INT NULL FK → users | |
| updated_at | DATETIME | |

```sql
stock_status ENUM('high','low','out_of_stock')
  AS (CASE WHEN quantity <= 0 THEN 'out_of_stock'
           WHEN quantity <= reorder_level THEN 'low'
           ELSE 'high' END) STORED
```
Generated means it can never disagree with `quantity`, and it stays indexable.

### 16. visit_medicines
`visit_id` · `medicine_id` · `quantity_given` · `dosage` · `instructions` · `given_by` · `given_at`

### 17. visit_supplies — NEW
`visit_id` · `supply_id` · `quantity_used` · `remarks` · `given_by` · `given_at`

Closes the loop: supplies can now be consumed, not only stocked.

### 18. stock_requests
| Field | Type | Notes |
|---|---|---|
| request_id | INT PK AI | |
| requested_by | INT NOT NULL FK → users | |
| request_date | DATETIME NOT NULL | |
| status | ENUM('draft','pending','approved','denied','completed') | `draft` **new** — M3 modal has "Save draft" |
| approved_by / approved_at | INT / DATETIME NULL | |
| received_by / received_at | INT / DATETIME NULL | **new** — delivery confirmation |
| admin_response | TEXT NULL | |
| remarks | TEXT NULL | |

### 19. stock_request_items
Unchanged from v1, including the CHECK constraint. Keep `requested_quantity` and `approved_quantity` separate — Admin can approve less than asked.

### 20. inventory_transactions
Append-only ledger. Rows are never updated or deleted.

| Field | Type | Notes |
|---|---|---|
| transaction_id | BIGINT PK AI | |
| item_type | ENUM('medicine','supply') NOT NULL | |
| medicine_id / supply_id | INT NULL FK | CHECK enforces exactly one |
| transaction_type | ENUM('released','restocked','adjustment','expired','damaged') | |
| quantity | DECIMAL(10,2) NOT NULL | signed: negative out, positive in |
| reference_type | ENUM('visit','stock_request','manual') NULL | **new** |
| reference_id | INT NULL | |
| performed_by | INT NULL FK → users | |
| transaction_date | DATETIME NOT NULL | |
| remarks | TEXT NULL | |

Indexes: `(medicine_id)`, `(supply_id)`, `(transaction_type)`, `(transaction_date)`, `(reference_type, reference_id)`

### 21. activity_log — NEW
Backs the Activity Log on System Settings.
`log_id` · `user_id` FK · `action` VARCHAR(150) · `entity_type` VARCHAR(50) · `entity_id` INT · `detail` TEXT · `log_type` ENUM('account','record','inventory','security','backup') · `created_at`

### 22. system_settings
Adds `value_type ENUM('int','bool','string','json')` so the backend can cast without guessing.

---

## 4. Transaction rules — the part that matters

**Saving a visit is ONE transaction.** Insert the visit, insert `visit_complaints`, insert `visit_medicines` and `visit_supplies`, decrement both stock tables, write the ledger rows. All of it commits or none of it does.

```python
with session.begin():
    stock = session.execute(
        select(MedicineStock)
        .where(MedicineStock.medicine_id == med_id)
        .with_for_update()          # row lock — two nurses cannot both take the last tablet
    ).scalar_one()
    if stock.quantity < qty:
        raise InsufficientStock(...)
    stock.quantity -= qty
    session.add(InventoryTransaction(
        item_type='medicine', medicine_id=med_id,
        transaction_type='released', quantity=-qty,
        reference_type='visit', reference_id=visit.visit_id,
        performed_by=current_user.user_id))
```

**Never** read stock, then write it, outside a transaction. Two concurrent visits will both see the old number.

**Confirming a delivery** is also one transaction: set `status='completed'`, set `received_by`/`received_at`, increment stock, write `restocked` ledger rows.

**Ledger is append-only.** To correct a mistake, write an `adjustment` row. Never UPDATE or DELETE history.

---

## 5. Design principles

1. Patients are separate from Users — patients never authenticate.
2. Catalog is separate from Stock — `medicines` is what exists, `medicine_stock` is how much is on hand.
3. Junction tables for every many-to-many.
4. Lookup tables over ENUMs for anything the Admin may extend. ENUMs only for fixed technical states (`role`, `status`).
5. Soft delete on anything a user can remove from a screen. Hard delete only via the 90-day purge job.
6. The ledger is the source of truth for stock movement; `quantity` is a cached running total.
7. Store UTC, render Asia/Manila.
8. Every derived value is computed or generated, never stored by hand.

---

## 6. Decisions left open

1. **Batch / lot tracking.** `UNIQUE(medicine_id)` with one `expiry_date` means one batch per medicine. The Add/Restock modal has a Batch/Lot field and `transaction_type='expired'` implies batches. Either drop the field from the UI or add a `stock_batches` table in v3. *Recommendation: drop it for the capstone — batch tracking triples inventory complexity.*
2. **CHECK constraint support.** Enforced on MySQL 8.0.16+. On MariaDB they parse but may not enforce. If MariaDB is the deployment target, move both polymorphic guards into the application layer.
3. **Roster pre-load.** Faculty and NASA are described as "already on the roster". Is that a bulk import into `patients`, or a separate `roster` table synced from HR? Currently assumed: bulk import.

---

## 7. For the React team

- FastAPI publishes OpenAPI at `/docs` and `/openapi.json` — generate the TypeScript client from it rather than hand-writing types.
- DB is `snake_case`, JSON responses are `camelCase`. Conversion happens in Pydantic via alias generators, not in React.
- All timestamps are ISO 8601 UTC with a `Z` suffix.
- `quantity` fields are decimal strings, not floats — do not do currency-style math on them in JS.
- Paginated endpoints return `{ items, total, page, perPage }`. Every list screen in the Figma has pagination.

---

*Plan v2 — supersedes the 17-table v1. Migration: `migration_002.sql`.*
