# Backend Changes Needed for the React Frontend

**For:** the backend team (`sinnz21/Logbook` → `isu_infirmary_backend/backend`)
**Goal:** every button in the React frontend works once these are in.
**Status:** all of this is already written and tested. You only need to apply it.

---

## 1. How to apply (pick one)

**Option A: git patch (fastest).** Run from the root of the `Logbook` repo:

```bash
git apply --ignore-whitespace path/to/isu-infirmary/docs/backend-changes/backend-changes.patch
pip install -r isu_infirmary_backend/backend/requirements.txt
```

**Option B: copy the files.** `docs/backend-changes/backend/` mirrors the backend folder. Copy each file over the file with the same path in `isu_infirmary_backend/backend/`. There are 18 files: 9 new, 9 edited.

Then restart: `uvicorn app.main:app --reload`, and open http://localhost:8000/docs to see every endpoint.

> **How this was tested:** the patched backend was run against a database seeded with the Plan v2 lookup data. The frontend's own API code then drove it through 75 API checks and 31 click-through UI checks, all passing. That run used SQLite rather than MySQL; section 3 lists the MySQL-side things to double-check.

---

## 2. Bugs in the current backend (fix these even if you apply nothing else)

| # | Bug | Effect | Fix (included) |
|---|---|---|---|
| 1 | `visit_service.create_visit` / `sign_out` use `with db.begin():` | **POST /api/visits and sign-out always return 500**: `InvalidRequestError: A transaction is already begun on this Session`. `get_current_user` already read the User on the same session (FastAPI caches `Depends(get_db)` per request), so SQLAlchemy auto-began a transaction. | Use `try: … db.commit() / except: db.rollback(); raise`. It is still one transaction. |
| 2 | `passlib[bcrypt]==1.7.4` with no pinned bcrypt | `pip install` pulls bcrypt 5.x, and then **`hash_password` crashes** (`password cannot be longer than 72 bytes`). This breaks `create_admin.py` and login. | Add `bcrypt==4.0.1` to requirements.txt |
| 3 | `auth.py` compares `recent_failures >= limit` | If `system_settings` rows were seeded without `value_type`, `limit` is the string `"5"`, and **every login throws a TypeError** | `int(_setting(...))` |
| 4 | `zoneinfo` on Windows | `ZoneInfo("Asia/Manila")` fails with no tz database | Add `tzdata` to requirements.txt |

---

## 3. Database / seed checklist

`schema_v2.sql` is referenced by the backend README but is **not in the repo**. The repo only has the v1 `isu_infirmary_schema.sql`, which doesn't match the models. Commit `schema_v2.sql` and make sure it has:

- **Lookup seeds** (the frontend loads these from `GET /api/lookups`):
  - `patient_types`: Student · Faculty · Non-Teaching Staff (NASA)
  - `dispositions`: Sent Home · Back to Class/Work · Hospital Admission · Referred to Doctor · Observation
  - `complaints`: Tension Headache · Dysmenorrhea · Viral Flu · Fever · Cough / Colds · Wound / Abrasion · Stomach Pain · Dizziness · Allergic Reaction · Elevated Blood Pressure · Other
  - `special_case_types`: PWD · Senior Citizen · Allergy · Anxiety · Asthma · Hypertension · Other
  - `item_categories` (with `applies_to`): Analgesic/Antipyretic (medicine) · Antibiotic (medicine) · Antihistamine (medicine) · Gastrointestinal (medicine) · Antiseptic (both) · Hydration (medicine) · Wound Care (supply) · PPE (supply)
- **`system_settings`** rows **with `value_type`**: `soft_delete_days` (int, 90), `failed_login_limit` (int, 5), `lockout_minutes` (int, 15), `password_symbol_required` (bool, 1), `auto_backup_enabled` (bool, 1). `PATCH /api/settings` creates missing rows. Only `auth.py` depends on them being there.
- `stock_status` as the **generated column** from Plan v2 §14. The API also computes it the same way, so responses are never stale.
- `updated_at … ON UPDATE CURRENT_TIMESTAMP` on `visits`. The Visit Records "Modified" column reads it.
- `.env`: `CORS_ORIGINS=http://localhost:5173` (already the default)

---

## 4. Conventions the frontend relies on

- JSON is **camelCase** (the existing `APIModel` alias generator). Query params are **snake_case** (`per_page`, `date_from`).
- Lists return `{ items, total, page, perPage }`.
- Datetimes are **naive UTC** (`"2026-09-18T01:42:00"`), and the frontend treats them as UTC. **Date filters** (`date_from`, `date_to`) are **clinic calendar days** in Asia/Manila, inclusive (see `app/core/timeutil.py`).
- Decimals (`quantity`, `temperature`) come back as **strings**, e.g. `"98.00"`.
- Errors use FastAPI's `{ "detail": "..." }`. The frontend shows `detail` to the user, so keep the messages human-readable.
- A missing route returns FastAPI's bare `"Not Found"`. The frontend recognizes this and tells the user that the endpoint isn't built yet.

---

## 5. Endpoint reference

**Who** column: *any* = any logged-in user · *nurse* = `require_nurse` · *admin* = `require_admin`.
**NEW** = not in the current backend · **CHANGED** = exists but was extended.

### Lookups: NEW (`routes/lookups.py`)
| Method | Path | Who | Returns |
|---|---|---|---|
| GET | `/api/lookups` | any | `{ patientTypes[], dispositions[], complaints[], specialCaseTypes[], itemCategories[] }` (active rows only). Used by every dropdown. |

### Patients: NEW (`routes/patients.py`, schemas already existed)
| Method | Path | Who | Body / Query | Returns |
|---|---|---|---|---|
| GET | `/api/patients` | any | `?search=` (first/last name, "Last, First", ID number) `&patient_type_id=&page=&per_page=` | `Page[PatientOut]` |
| POST | `/api/patients` | nurse | `PatientCreate` | `PatientOut` · 409 if the ID number is taken |
| GET | `/api/patients/{id}` | any | | `PatientOut` (includes `age`, `visitCount`, `lastVisitAt`, `specialCases[]`) |
| PATCH | `/api/patients/{id}` | nurse | `PatientUpdate` (**now includes `patientTypeId`, `patientNumber`**) | `PatientOut` |
| DELETE | `/api/patients/{id}` | nurse | | 204, soft delete |
| GET | `/api/patients/special-cases` | any | `?active=true` | `SpecialCaseListOut[]`, the Priority & Special Cases hub |
| POST | `/api/patients/{id}/special-cases` | nurse | `{ specialCaseTypeId, notes?, originVisitId? }` | `SpecialCaseOut` · 409 if the same flag is already active |
| PATCH | `/api/patients/{id}/special-cases/{caseId}` | nurse | `{ active?, notes? }`. `active:false` retires the flag. | `SpecialCaseOut` |

### Visits: CHANGED (`routes/visits.py`, `services/visit_service.py`)
| Method | Path | Who | Change |
|---|---|---|---|
| GET | `/api/visits` | any | New filters: `patient_id, search, sex, year_level, program, department, date_from, date_to`; new sort `sort_by=patient_name` |
| POST | `/api/visits` | nurse | Transaction bug fixed. `medicines[]` / `supplies[]` deduct stock (409 if there isn't enough, and the whole visit rolls back). |
| PATCH | `/api/visits/{id}` | nurse | **NEW.** Edit vitals, complaint, notes, and tags. Dispensed items are not editable (the ledger is append-only). |
| DELETE | `/api/visits/{id}` | nurse | **NEW.** Soft delete. |
| POST | `/api/visits/{id}/sign-out` | nurse | Transaction bug fixed. |

`VisitOut` gained `patientNumber, patientTypeName, sex, yearLevel, program, department, specialCases[] (active), dispositionId, createdAt, updatedAt`. `attendingName`, `medicines[]` and `supplies[]` are now actually filled in; before, they were always empty. The Visit Records table needs these fields. The only model change is an `attending` relationship on `Visit`.

### Stock & Supplies: NEW (`routes/stock.py`, `schemas/stock.py`)
Medicines and supplies live in separate tables but share one screen. They're addressed as `(itemType, itemId)`, where `itemType` is `medicine` or `supply`. **Every quantity change goes through the existing `stock_service` (row lock + ledger row).**

| Method | Path | Who | Body / Query | Notes |
|---|---|---|---|---|
| GET | `/api/stock` | any | `?item_type=&status=high\|low\|out_of_stock&category_id=&search=` | `Page[StockItemOut]` |
| POST | `/api/stock` | any | `{ itemType, name, categoryId?, unit, quantity, reorderLevel, expiryDate? }` | Opening quantity is written to the ledger. 409 on a duplicate name. 400 if the category doesn't apply to that item type. |
| PATCH | `/api/stock/{itemType}/{itemId}` | any | name, category, unit, description, reorderLevel, expiryDate | |
| POST | `/api/stock/{itemType}/{itemId}/restock` | any | `{ quantity, expiryDate? }` | `restock_*` → 'restocked' ledger row |
| POST | `/api/stock/{itemType}/{itemId}/adjust` | any | `{ delta, transactionType: adjustment\|expired\|damaged, reason }` | 409 if it would go below 0 |
| POST | `/api/stock/requests` | nurse | `{ items:[{ itemType, medicineId\|supplyId, requestedQuantity, reason }], remarks }` | status `pending` |
| GET | `/api/stock/requests` | any | `?status=` | `Page[StockRequestOut]` |
| POST | `/api/stock/requests/{id}/approve` | admin | `{ items?:[{ requestItemId, approvedQuantity }], adminResponse? }` | Defaults to the requested quantity |
| POST | `/api/stock/requests/{id}/deny` | admin | `{ adminResponse? }` | |
| POST | `/api/stock/requests/{id}/receive` | any | | Delivery arrived: stock is incremented, 'restocked' ledger rows are written, and the request becomes `completed`, all in one transaction |

### Users: NEW (`routes/users.py`, `schemas/user.py`), admin only
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/users` | | `Page[UserOut]`; never returns `password_hash` |
| POST | `/api/users` | `{ firstName, lastName, username, email?, role, status, password }` | Hashed server-side. Min 8 characters plus a symbol (if `password_symbol_required`). 409 on a duplicate username or email. |
| PATCH | `/api/users/{id}` | any subset; `password` resets it | An admin can't change their own role or status |

### Settings: NEW (`routes/settings.py`), admin only
| GET/PATCH | `/api/settings` | `{ softDeleteDays, failedLoginLimit, lockoutMinutes, passwordSymbolRequired, autoBackupEnabled }` |

### Insights: NEW (`routes/insights.py`)
| GET | `/api/insights/patterns?date_from=&date_to=` | any | `[{ trigger, associatedWith, matchRate (0–1), support }]`. "When a patient has X, Y also happens N% of the time", over tagged complaints and dispensed medicines. Only patterns with ≥ 3 co-occurrences and ≥ 50% are returned. |

---

## 6. Still not built anywhere (not blocking)

These buttons exist in the Figma and show a "not connected yet" message:

- **Printable forms:** Medical Certificate (ISUE-UHS-MCR-007), Parental Notification (ISUE-UHS-PaN-006), checkout/excuse slip, Monthly Supply Report, Medicine Release Cycle Report. These are mostly frontend print templates. The Director co-signature workflow would also need a backend table.
- **Backup Now / Recover / Export SQL:** needs server-side tooling (`mysqldump`) and is outside the API.

Visit export to **CSV** and **Print / Save as PDF** already work in the frontend and need nothing from the backend.
