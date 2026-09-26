# ISU Infirmary Log Book System: Frontend

React frontend for the **Isabela State University Infirmary Log Book System**. Nurses use it to log patient visits, dispense medicines, track stock, and flag priority cases. Admins use it to approve restock requests, manage accounts, and change system settings.

The UI follows the team's Figma design. The data comes from the FastAPI backend in [`sinnz21/Logbook`](https://github.com/sinnz21/Logbook/tree/main/isu_infirmary_backend/backend).

> **Backend team:** the frontend needs some backend additions and fixes. Everything is written and tested already. See **[BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)**, or the Word version [`docs/Backend_Requirements.docx`](docs/Backend_Requirements.docx). The ready-to-apply code is in [`docs/backend-changes/`](docs/backend-changes/).

---

## Features

**Nurse**
- **Dashboard:** today's visits, range total, referrals and low/out-of-stock alerts, the Mon–Sun visit trend, top complaints, top 5 most requested medicines, and the active patient queue. Pick Today / This Week / This Month or a custom date range.
- **Add Visit Record:** the five-step flow from the Figma — smart patient lookup, patient details, triage and special-case flagging, treatment delivery, then disposition and sign-out. Search the roster to reuse an existing patient or register one on the spot. Dispensed medicines and supplies are deducted from stock automatically.
- **Patient Records:** searchable, filterable (gender, year level, program, department, date range), sortable and paginated, with today's clinic queue alongside. Export to CSV, or print / save as PDF.
- **Priority & Special Cases:** PWD, Senior Citizen, allergies and chronic conditions. A flag stays on the patient's record for every future visit.
- **Search & History:** type a name and the patient's whole record comes up, with their visit history expanding underneath.
- **Stock & Supplies:** live inventory with High/Low/Out status and expiry warnings. Add or restock items, raise a restock requisition, and confirm deliveries.
- **Insights:** visits per month, frequent complaints, plain-language treatment pairings, client breakdown, highest-visiting departments and demographics.
- **Patient Profile:** full clinical ledger, plus printable **Medical Certificate** (ISUE-UHS-MCR-007) and **Parental Notification** (ISUE-UHS-PaN-006) on ISU letterhead.

**Admin**
- **Dashboard:** account and stock status, pending requisitions, campus complaint summary, report cadence.
- **Stock Requests:** the restock review pipeline — approve with adjusted quantities, or deny with a justification.
- **User Management:** create accounts, change role or status, reset passwords.
- **Settings:** soft-delete retention, login lockout, password rules, backup toggle.

**Everyone:** login with account lockout, a session that survives a page refresh (it ends when the browser closes), and a notification bell.

## Tech stack

- [React 19](https://react.dev) + [Vite 8](https://vite.dev)
- Plain CSS, with design tokens from the Figma in `src/index.css`
- No UI or state libraries: React context plus small hooks
- ESLint (`npm run lint`)

## Getting started

### Prerequisites
- **Node.js 20+** (tested on Node 24) and npm
- The **backend** running on `http://localhost:8000` (see [Connecting to the backend](#connecting-to-the-backend)) — or skip it entirely and use [Demo mode](#demo-mode)

### Install and run

```bash
git clone <this-repo-url>
cd isu-infirmary
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
npm run dev
```

Open **http://localhost:5173** and sign in with an account from the backend. The first admin account is created with `python create_admin.py` in the backend. Nurse accounts can then be created from **User Management**.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on port 5173 |
| `npm run demo` | Same, but with sample data instead of the backend — see [Demo mode](#demo-mode) |
| `npm run build` | Production build into `dist/` |
| `npm run build:demo` | Build a self-contained demo (sample data baked in) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Demo mode

To look at or present the UI without setting up MySQL and the backend:

```bash
npm install
npm run demo
```

Open **http://localhost:5173** and sign in as **`nsantos`** (nurse) or **`acruz`** (admin). Any password works — demo mode doesn't check it. A **DEMO DATA** badge sits in the corner so sample data is never mistaken for real records.

Everything is clickable: filters, sorting, pagination, adding a visit record, signing a patient out, approving a restock requisition, and printing the Medical Certificate and Parental Notification.

**How it works.** `npm run demo` loads `.env.demo`, which sets `VITE_DEMO=true`. `src/main.jsx` then dynamically imports `src/mock/`, which patches `window.fetch` and answers `/api/*` from an in-memory dataset instead of the network:

| File | Role |
|---|---|
| `src/mock/data.js` | Sample records, seeded from the Figma. Dates are generated relative to *today*, so today's queue is never empty. |
| `src/mock/handlers.js` | The same routes `src/api/*` calls on the real backend |
| `src/mock/install.js` | The `fetch` patch and the corner badge |

Notes:
- **Changes reset on reload** — the data lives in memory only. That's deliberate, so a demo can't be left in a broken state.
- **Nothing ships to production.** The flag is inlined at build time and the import is dynamic, so `npm run build` contains none of it (verify with `grep -c Kremil dist/assets/*.js` → `0`).
- `src/mock/` is only sample data. It is **not** a substitute for the backend work in [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md).

Accounts available in demo mode:

| Username | Role | Status |
|---|---|---|
| `nsantos` | Nurse / Staff | active |
| `rlim` | Nurse / Staff | active |
| `acruz` | Admin | active |
| `cgaffud` | Admin | active |
| `pramos` | Nurse / Staff | inactive (sign-in is refused, on purpose) |

## Connecting to the backend

In development you don't need to configure anything. `vite.config.js` proxies every `/api/...` request to `http://localhost:8000`. The browser only talks to the Vite server, so there's no CORS setup.

1. Set up the backend (in the `Logbook` repo, folder `isu_infirmary_backend/backend`):
   ```bash
   python -m venv .venv
   .venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   # create the MySQL database with schema_v2.sql, fill in .env (DB_PASSWORD, SECRET_KEY)
   python create_admin.py
   uvicorn app.main:app --reload
   ```
2. Apply the backend changes from [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) if the backend team hasn't yet. The current backend only has login and a partial visits API, and two of its bugs break creating visits and logging in.
3. Run `npm run dev` here.

**Backend on another machine** (e.g. a LAN server): set `VITE_API_URL=http://<server-ip>:8000` in `.env`, restart `npm run dev`, and add this frontend's address to the backend's `CORS_ORIGINS`.

**If a backend endpoint is missing:** the screen still loads and shows a message like *"This feature needs a backend endpoint that isn't available yet (/api/stock)."* Dropdowns (dispositions, patient types, complaint tags, and so on) fall back to the seed values from the database plan until `GET /api/lookups` exists.

## Project structure

```
src/
├── api/            One file per backend area: every HTTP call lives here
│   ├── client.js   fetch wrapper: base URL, auth token, error messages, 401 → logout
│   ├── auth.js  visits.js  patients.js  stock.js  users.js  settings.js  insights.js
│   └── lookups.js  GET /api/lookups (cached) + seed-data fallback
├── components/
│   ├── forms/      Shared form sections (patient, visit, special-case flags, dispensing, roster search)
│   ├── modals/     Add/Edit Patient, Checkout, Restock, Stock Item, Flag Patient, User, Move to Trash
│   ├── Modal.jsx  ModalRoot.jsx  Sidebar.jsx  NotificationBell.jsx
├── config/navs.js  Sidebar items per role
├── context/        Signed-in user, current view, open modal
├── hooks/          useAsync, useVisits, useLookups
├── lib/            Time zones (UTC ↔ Asia/Manila), formatting, CSV export, session storage
├── pages/          Nurse screens + pages/admin/ for Admin screens
└── index.css       All styles (Figma tokens)
docs/
├── Backend_Requirements.docx   The backend spec as a Word file, to share
└── backend-changes/            Ready-to-copy backend files + backend-changes.patch
```

A few conventions if you're changing things:
- **Pages never call `fetch` directly.** Add a function to the matching `src/api/*.js` file.
- The backend sends **camelCase JSON**, **UTC timestamps**, and **decimals as strings**. Use `parseApiDate` and `formatQty` from `src/lib/`.
- Every date shown to the user is in **Asia/Manila** (`src/lib/time.js`).

## Differences from the Figma

- **Age → Date of Birth.** The database stores a birth date and calculates age from it (a stored age goes stale within a year). The form shows the calculated age next to the field.
- **Export (PDF / CSV)** is split in two: *Export (CSV)* downloads a file, and *Customize Print / PDF* opens the print dialog, where "Save as PDF" gives you the PDF.
- **Additions the workflow needed:** complaint tags (they drive Insights), a "Medicines & Supplies Given" picker (it drives stock deduction), and a password field on Add User.

## Not built yet

These buttons are in the Figma and show a "not connected yet" message:
- Printable **Medical Certificate** (ISUE-UHS-MCR-007), **Parental Notification** (ISUE-UHS-PaN-006) and **checkout slip**
- **Monthly Supply** and **Medicine Release Cycle** report templates
- **Backup Now / Recover / Export SQL.** These need server-side tooling (`mysqldump`).

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the server. Is the backend running?" | Start the backend: `uvicorn app.main:app --reload` on port 8000 |
| "This feature needs a backend endpoint that isn't available yet" | The backend doesn't have [the additions](BACKEND_REQUIREMENTS.md) yet |
| Adding a visit or signing out gives a server error (500) | The backend is missing the transaction fix. See bug #1 in [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md#2-bugs-in-the-current-backend-fix-these-even-if-you-apply-nothing-else) |
| `create_admin.py` crashes with "password cannot be longer than 72 bytes" | `pip install bcrypt==4.0.1` (bug #2) |
| Signed out after a while | Sessions last 8 hours (one shift), then you sign in again |
