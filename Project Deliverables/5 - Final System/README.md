# Final System

**ISU Infirmary Logbook Management and Health Surveillance System** — a LAN web application for the
University Health Service, Isabela State University – Echague.

The source code is in the main folders of this repository (kept there so the setup guide's paths work):

| Folder | What it is |
|---|---|
| [`BackendAndDatabase/backend/`](../../BackendAndDatabase/backend/) | FastAPI backend (Python 3.13): 46 REST endpoints under `/api`, JWT sign-in, services, automatic backups |
| [`BackendAndDatabase/backend/health_surveillance/`](../../BackendAndDatabase/backend/health_surveillance/) | Outbreak early-warning model: data generator, training, evaluation, `model.json` |
| [`BackendAndDatabase/schema_v2.sql`](../../BackendAndDatabase/schema_v2.sql) | MariaDB/MySQL schema — 22 tables with starting lookups |
| [`BackendAndDatabase/test_data/`](../../BackendAndDatabase/test_data/) | Test data (40 patients) and **1-year demo data** (3,000 patients, 8,901 visits) |
| [`Frontend ver2/`](../../Frontend%20ver2/) | React 19 + Vite 8 frontend (Nurse and Admin screens) |
| [`AdminSetUp/SETUP.md`](../../AdminSetUp/SETUP.md) | **Step-by-step setup and test-run guide** |

## Main features

- Sign-in with roles (Nurse, Administrator), lockout after 5 failed tries, password reset by emailed 6-digit code
- Patient records, visits with vital signs, medicines and supplies (stock deducted automatically), sign-out with disposition
- Priority & special cases, search & history, printable medical certificate and parental notification
- Stock & supplies with low-stock and expiry alerts; restock requisitions (Nurse → Admin approval → delivery)
- Reports: 12 analytics charts, 11 tables with CSV export, monthly supply report
- **Health surveillance:** weekly outbreak check per college and illness; alert banner for the nurses on duty; Outbreak watch
- Administration: users, audit log, settings, maintenance mode, trash/restore, backup now, automatic 11:59 PM backup,
  Export .SQL, restore

## Run it

Follow [`AdminSetUp/SETUP.md`](../../AdminSetUp/SETUP.md). In short: XAMPP MySQL on → load
`BackendAndDatabase/test_data/isu_infirmary_demo_data_1year.sql` → start the backend
(`uvicorn app.main:app --reload` in `BackendAndDatabase/backend`) → start the frontend (`npm run dev` in `Frontend ver2`)
→ open http://localhost:5173.

| Username | Role | Password |
|---|---|---|
| `acruz` | Administrator | `Passw0rd!` |
| `nsantos`, `jreyes`, `lmercado` | Nurse | `Passw0rd!` |
| `rdomingo` | Nurse, inactive (sign-in must fail) | `Passw0rd!` |

`Passw0rd!` has a zero. These are demo accounts in the demo data only.

## Tech stack

MariaDB 10.4 (XAMPP) · Python 3.13, FastAPI, SQLAlchemy 2.0, Pydantic, python-jose, passlib/bcrypt · Node.js, React 19, Vite 8 ·
Gmail SMTP for reset codes.
