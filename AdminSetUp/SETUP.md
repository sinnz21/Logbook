# ISU Infirmary Log Book — Backend Setup Guide

How to get the FastAPI backend running on a fresh Windows machine.
Written from an actual working setup on 18 September 2026.

Verified environment: Windows 11, Python 3.13.14, MariaDB 10.4.32 (XAMPP),
FastAPI 0.115.6, SQLAlchemy 2.0.36.

---

## 0. What you need first

| Requirement | Notes |
|---|---|
| Python **3.13** (not 3.14) | See the warning in Step 3 — 3.14 fails to install the packages |
| XAMPP (MySQL/MariaDB) | Or standalone MySQL Server 8.0. Do not run both — they fight over port 3306 |
| The repo cloned locally | Backend lives in `BackendAndDatabase/backend/` |

The nurse/client laptop needs **none** of this. Only the server machine.

---

## 1. Load the database

Start **MySQL** from the XAMPP Control Panel first. It must show green.

`schema_v2.sql` is a fresh-install file — it runs `DROP DATABASE IF EXISTS
isu_infirmary` at the top. Running it again wipes everything. Only run it once.

Easiest path is SQLyog or phpMyAdmin: open `schema_v2.sql` and execute it.

From the command line instead, note that PowerShell does not support the `<`
redirect operator, so hand it to cmd:

```powershell
cd "<repo>\BackendAndDatabase"
$env:Path += ";C:\xampp\mysql\bin"
cmd /c "mysql -u root < schema_v2.sql"
```

Verify — this must return **22**:

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'isu_infirmary';
```

Anything less means the script stopped partway on an error.

### Note on MariaDB vs MySQL

The schema header says it targets MySQL 8.0.16+, because MySQL only began
enforcing `CHECK` constraints in that version. XAMPP ships MariaDB, which has
enforced `CHECK` since 10.2.1 and supports `GENERATED ALWAYS AS (...) STORED`
as a synonym for its own `PERSISTENT`. Both features load correctly on
MariaDB 10.4.32. No changes to the schema are needed.

---

## 2. Create the `.env` file

In `BackendAndDatabase\backend\` — the same folder as `requirements.txt`.
It is gitignored, so **every teammate has to create their own**. Cloning the
repo is not enough to run the backend.

Generate a secret key:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Then create the file. Windows Explorer refuses extensionless filenames, and
editors sometimes save an empty file or silently append `.txt`, so writing it
from PowerShell is the reliable way:

```powershell
Set-Content -Path .env -Encoding utf8 -Value @(
  "DB_USER=root",
  "DB_PASSWORD=",
  "DB_HOST=localhost",
  "DB_PORT=3306",
  "DB_NAME=isu_infirmary",
  "SECRET_KEY=<paste the generated key>",
  "ALGORITHM=HS256",
  "ACCESS_TOKEN_EXPIRE_MINUTES=480",
  "CLINIC_TIMEZONE=Asia/Manila",
  "CORS_ORIGINS=http://localhost:5173,http://localhost:3000"
)
```

`DB_PASSWORD=` is left empty on purpose — XAMPP's root user has no password by
default. `config.py` detects the empty value and builds the connection URL
without a password section.

Check it:

```powershell
Get-Content .env
```

Exactly 10 lines. If you see `@'` or `Set-Content` inside the file, the
here-string got written as literal text instead of being executed — delete the
file and use the `-Value @(...)` form above.

---

## 3. Create the virtual environment

**Use Python 3.13. Python 3.14 does not work.**

`pydantic-core 2.27.2` publishes no prebuilt wheel for 3.14, so pip falls back
to compiling it from Rust source, which needs the MSVC linker from Visual
Studio Build Tools. The build fails with ``linker `link.exe` not found``.
Installing 6 GB of Build Tools to work around this is the wrong fix — use 3.13,
which has a ready-made wheel.

Check which versions you have:

```powershell
py -0p
```

Then, in `BackendAndDatabase\backend\`:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version
```

Your prompt should now start with `(.venv)` and the version must read 3.13.x.

If activation is blocked by execution policy, run once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## 4. Install the packages

```powershell
pip install -r requirements.txt
pip install "bcrypt==4.0.1"
```

The second command is not optional. `requirements.txt` pins
`passlib[bcrypt]==1.7.4` without constraining bcrypt, so pip installs bcrypt
5.x, and passlib 1.7.4 reads a `bcrypt.__about__` attribute that was removed in
bcrypt 4.1. Without the downgrade, `create_admin.py` dies with:

```
AttributeError: module 'bcrypt' has no attribute '__about__'
```

Long-term fix: change the line in `requirements.txt` to `bcrypt==4.0.1`.

---

## 5. Test the database connection

Do this before anything else — it separates config problems from app problems.
Create `dbtest.py` in the backend folder:

```python
from sqlalchemy import text
from app.db.session import engine

with engine.connect() as c:
    print("version:", c.execute(text("SELECT VERSION()")).scalar())
    print("db:", c.execute(text("SELECT DATABASE()")).scalar())
    n = c.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_schema = 'isu_infirmary'"
    )).scalar()
    print("tables:", n)
```

```powershell
python dbtest.py
```

Expected:

```
version: 10.4.32-MariaDB
db: isu_infirmary
tables: 22
```

Delete `dbtest.py` afterwards. If you get `Can't connect to MySQL server`,
XAMPP's MySQL is not running.

---

## 6. Create the first accounts

Passwords are hashed with bcrypt in Python. There is no plaintext password
column in the schema, so accounts can never be created through SQL — always
use these scripts.

Admin:

```powershell
python create_admin.py
```

Nurse — `create_admin.py` hardcodes `role="admin"`, so it cannot make one.
There is no `users.py` route yet either. Use a copy of the script with the role
changed to `"nurse"` (`create_nurse.py`).

You need both accounts to test properly: `require_nurse` in `core/deps.py`
deliberately returns 403 for admin tokens, because Admin has no clinical
screens in this system.

Passwords must be at least 8 characters. Nothing appears as you type — that is
`getpass`, not a frozen terminal.

---

## 7. Run the server

```powershell
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs

Test the full stack: expand `POST /api/auth/login` → Try it out → enter your
username and password → Execute. A 200 response with an `access_token` proves
the database, password hashing, and JWT signing all work together.

### Starting it on any later day

1. XAMPP Control Panel → Start MySQL
2. `cd "<repo>\BackendAndDatabase\backend"; .\.venv\Scripts\Activate.ps1`
3. `uvicorn app.main:app --reload`

XAMPP is not a Windows service — it does not start on boot. If MySQL is not
green, every request returns 500.

---

## 8. Two-laptop LAN setup

The architecture is server/client, not "admin laptop / nurse laptop". One
machine runs MySQL and uvicorn; every other machine is just a browser pointed
at it. Admin vs Nurse is a database role on the `users` table, enforced by
`require_admin` / `require_nurse` — it has nothing to do with which laptop you
sit at.

`localhost` means *this machine only*, so the nurse laptop can never reach the
server's localhost. It must use the server's LAN IP.

On the server machine:

```powershell
ipconfig
```

Note the IPv4 Address, e.g. `192.168.1.15`. An address starting `169.254` means
there is no real network connection.

Open the port — **Administrator PowerShell required**:

```powershell
New-NetFirewallRule -DisplayName "ISU Infirmary API" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

Bind to all interfaces instead of loopback:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Add the client origin to `CORS_ORIGINS` in `.env`, then restart uvicorn:

```
CORS_ORIGINS=http://localhost:5173,http://192.168.1.15:5173,http://192.168.1.15:8000
```

On the client machine: same network, open `http://192.168.1.15:8000/docs`.

### Known pitfalls

1. **DHCP reassigns IPs.** The server's address can change after a reboot and
   break the client's bookmark. Set a static IP or a router DHCP reservation
   before any demo.
2. **Campus and public Wi-Fi often enable client isolation**, which blocks
   devices from seeing each other regardless of firewall settings. Test with a
   phone hotspot to tell a network problem apart from a config problem.
3. **The two-building deployment does not work over LAN.** The infirmary and
   admin buildings are roughly 2 km apart. That needs either a campus network
   that routes between both buildings, or cloud hosting.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `'mysql' is not recognized` | MySQL client not on PATH | `$env:Path += ";C:\xampp\mysql\bin"` |
| `The '<' operator is reserved for future use` | PowerShell has no input redirect | `cmd /c "mysql -u root < file.sql"` |
| ``linker `link.exe` not found`` | Python 3.14, no wheel for pydantic-core | Rebuild the venv with Python 3.13 |
| `module 'bcrypt' has no attribute '__about__'` | bcrypt 5.x with passlib 1.7.4 | `pip install "bcrypt==4.0.1"` |
| `python-dotenv could not parse statement` | Junk line in `.env` | Rewrite `.env` with the `-Value @(...)` form |
| `Can't connect to MySQL server` | XAMPP MySQL stopped | Start it in the XAMPP Control Panel |
| `Get-Service *mysql*` returns nothing | XAMPP runs mysqld as a process, not a service | Normal — not an error |
| Client laptop cannot reach the API | Bound to 127.0.0.1, or firewall | `--host 0.0.0.0` plus the firewall rule |

---

## 10. Current state of the backend

Implemented: `auth`, `visits`.

Not built yet — see the TODO in `app/api/router.py`:

- `patients.py` — list / create / update / profile with visit history
- `stock.py` — inventory, restock requisitions, approve / deny / receive
- `users.py` — admin-only account management (would replace the scripts in Step 6)
- `insights.py` — complaint frequency, treatment pairings, depletion forecast
- `lookups.py` — patient types, complaints, dispositions, case types, categories

This is why the frontend's Add Patient, Restock, stock and admin screens are
still working from mock data.

### Rules to follow when adding routes

- Stock changes go through `services/stock_service.py`. Never assign
  `stock.quantity` from a route — the service takes a row lock and writes the
  ledger row in the same transaction.
- `stock_status` is a generated column. Read it, never write it.
- Saving a visit is one transaction. See `services/visit_service.py`.
- Store UTC in the database. Render Asia/Manila in React.
