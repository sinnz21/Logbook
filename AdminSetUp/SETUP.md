# ISU Infirmary Log Book — Full Setup Guide

Backend + frontend + nurse laptop, step by step, on Windows.
Tested end to end on 21 September 2026.

Do one command at a time: paste it, press Enter, read what it says, then the next.

---

## ALREADY SET UP? Just run it

Parts A–C below are one-time only. Once done, this is all you do every time.

You need **two PowerShell windows** open at the same time — one for the backend,
one for the frontend. Both stay open the whole time the system is in use.

**1. Start the database.** XAMPP Control Panel → **MySQL** row → **Start**.
Wait for green.

**2. Backend — PowerShell window #1:**

```powershell
cd "C:\Users\com sci\Logbook-git\BackendAndDatabase\backend"
```
```powershell
.\.venv\Scripts\Activate.ps1
```
```powershell
uvicorn app.main:app --reload
```

Wait for `Application startup complete`. Leave this window open.

**3. Frontend — PowerShell window #2** (Windows key → `powershell` → Enter again):

```powershell
cd "C:\Users\com sci\Logbook-git\Frontend"
```
```powershell
npm run dev -- --host
```

It prints two addresses:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.8.34:5173/
```

**4. Open it.**

- On this laptop (admin): **http://localhost:5173**
- On the nurse laptop: the **Network** address from step 3, e.g. **http://192.168.8.34:5173**

**To stop:** click each PowerShell window and press **Ctrl + C**.

### If it doesn't start

| What you see | Fix |
|---|---|
| Login page says "Cannot reach the server" | Backend window (#1) isn't running, or XAMPP MySQL isn't green |
| `Can't connect to MySQL server` in window #1 | Start MySQL in XAMPP |
| `uvicorn is not recognized` | You skipped `Activate.ps1` |
| `npm is not recognized` | Node.js isn't installed — Part B |
| No `Network:` line in window #2 | You forgot `-- --host` at the end |
| Nurse laptop can't open the page | See Part C troubleshooting |
| `Address already in use` / `Port 5173 is in use` | It's already running in another window |

---

## Read this first

### Use PowerShell, not Command Prompt

Windows key → type `powershell` → Enter. A **blue** window. Use it for every
command here. The black "Command Prompt" doesn't understand these commands and
gives `The filename, directory name, or volume label syntax is incorrect.`

Paste with **Ctrl + V** or **right-click**.

### Your folders

| The guide says | Example |
|---|---|
| **repo folder** | `C:\Users\com sci\Logbook-git` |
| **backend folder** | `C:\Users\com sci\Logbook-git\BackendAndDatabase\backend` |
| **frontend folder** | `C:\Users\com sci\Logbook-git\Frontend` |

To get yours: open the folder in File Explorer, click the address bar, **Ctrl + C**.
Keep the quotes around paths — they contain a space.

### One line at a time

Pasting several lines at once makes PowerShell show `>>` and wait. If that
happens, press **Ctrl + C** and paste one line.

---

## How the pieces fit

```
 Nurse laptop                     Server laptop (this one)
 ────────────                     ───────────────────────────────────────────
 browser  ──── Wi-Fi ────►  :5173  Frontend (Vite)
                                     │  forwards every /api/... request
                                     ▼
                            :8000  Backend (FastAPI)  ──►  :3306  MariaDB (XAMPP)
```

- **Only the server laptop has anything installed.** The nurse laptop just opens
  a browser. No Python, no XAMPP, no Node, no project files.
- The nurse laptop only ever talks to port **5173**. The frontend forwards API
  calls to the backend on the same machine, so the backend never needs to be
  exposed to the network and there is **no CORS configuration** to do.
- **Admin and Nurse are accounts, not laptops.** The role lives in the `users`
  table. Either account can log in from either laptop; what it can see is decided
  by the account.
- `localhost` means "this machine only." The nurse laptop must use the server's
  network address (e.g. `192.168.8.34`), never `localhost`.

---

# PART A — Backend (one time)

## A1. Load the database — FIRST INSTALL ONLY

> **STOP — check before running anything here.**
> `schema_v2.sql` starts with `DROP DATABASE IF EXISTS isu_infirmary`. Running it
> on a machine that already has the database **deletes every patient, visit and
> account**, with no undo.
>
> Open SQLyog or phpMyAdmin and run:
>
> ```sql
> SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'isu_infirmary';
> ```
>
> **22** → already loaded, **skip to A2.** **0** → continue.

1. XAMPP Control Panel → **MySQL** → **Start**. Wait for green.
2. Open **SQLyog**, connect as `root@localhost` (password blank on XAMPP).
3. **File → Execute SQL Script** → pick `repo folder\BackendAndDatabase\schema_v2.sql` → run.
4. Run the check query above. It must say **22**.

The schema loads on MariaDB 10.4+ (XAMPP) and MySQL 8. You don't need to install
MySQL Server separately.

## A2. Create the backend `.env`

Holds the database login and secret key. It's gitignored, so **every teammate
makes their own** — cloning isn't enough.

```powershell
cd "C:\Users\com sci\Logbook-git\BackendAndDatabase\backend"
```

Generate a secret key, then select and copy (Ctrl + C) what it prints:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Paste this into Notepad, replace `PASTE_YOUR_KEY_HERE`, then paste the finished
line into PowerShell:

```powershell
Set-Content -Path .env -Encoding utf8 -Value @("DB_USER=root","DB_PASSWORD=","DB_HOST=localhost","DB_PORT=3306","DB_NAME=isu_infirmary","SECRET_KEY=PASTE_YOUR_KEY_HERE","ALGORITHM=HS256","ACCESS_TOKEN_EXPIRE_MINUTES=480","CLINIC_TIMEZONE=Asia/Manila","CORS_ORIGINS=http://localhost:5173")
```

Check it — exactly 10 lines:

```powershell
Get-Content .env
```

`DB_PASSWORD=` stays empty — XAMPP's root user has no password.

Don't create `.env` in File Explorer. Windows won't allow a name starting with a
dot, and editors tend to save it empty or as `.env.txt`.

## A3. Create the virtual environment

> **Use Python 3.13. Python 3.14 does not work** — one package has no ready-made
> build for 3.14 and fails with ``linker `link.exe` not found``. Don't install
> Visual Studio Build Tools to fix it; just use 3.13.

```powershell
py -0p
```

You need a `-V:3.13` line. If missing, install Python 3.13 from python.org and
tick **Add python.exe to PATH**.

Still in the backend folder:

```powershell
py -3.13 -m venv .venv
```
```powershell
.\.venv\Scripts\Activate.ps1
```

Your prompt now starts with `(.venv)`. If you get a red "scripts are disabled"
error, run this once, answer `Y`, then repeat the line above:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

```powershell
python --version
```

Must say `3.13.x`.

## A4. Install the backend packages

```powershell
pip install -r requirements.txt
```

Ends with `Successfully installed ...`. `requirements.txt` already pins
`bcrypt==4.0.1` (newer bcrypt breaks password hashing) and includes `tzdata`
(Windows needs it for the Asia/Manila date filters).

**Run this again whenever you pull new code** — it only installs what changed.

## A5. Create the first admin account

```powershell
python create_admin.py
```

Asks for username, first name, last name, email (can be blank), password twice.
**Nothing shows while typing the password** — that's deliberate. Min 8 characters.

You only do this once. **Every other account — including nurses — is created
from inside the app** (Part C4).

Passwords are hashed before storage. The database has no column for a plain
password, so accounts can never be made through SQL.

## A6. Test the backend

```powershell
uvicorn app.main:app --reload
```

Wait for `Application startup complete`, then open **http://localhost:8000/docs**.
You should see about 31 endpoints grouped as auth, lookups, patients, visits,
stock, users, settings, insights.

Press **Ctrl + C** to stop it before moving on, or leave it running and open a
second PowerShell window for Part B.

---

# PART B — Frontend (one time)

## B1. Install Node.js

Check whether you have it:

```powershell
node --version
```

You need **v22.12 or newer** (or v20.19+). The frontend uses Vite 8, which
refuses older versions.

If it's missing or too old: go to **nodejs.org**, download the **LTS** Windows
installer, run it with all defaults. Then **close PowerShell and open a new
one** — the old window won't see Node until you do.

## B2. Install the frontend packages

```powershell
cd "C:\Users\com sci\Logbook-git\Frontend"
```
```powershell
npm install
```

Takes a minute. Creates a `node_modules` folder (gitignored — never commit it).

**Run `npm install` again whenever you pull new code.**

## B3. Frontend `.env` — leave it alone

The frontend works with **no `.env` at all**. Its API address is left empty on
purpose, so every request goes through the built-in forwarding to the backend
on the same machine.

Only create `Frontend\.env` if you ever split the frontend and backend onto
different computers. Don't do that for this setup.

## B4. Test it

Backend running in one window (A6), then in this window:

```powershell
npm run dev
```

Open **http://localhost:5173** → log in with your admin account.

---

# PART C — Nurse laptop over the network (one time)

## C1. Find the server's address

On the server laptop:

```powershell
ipconfig
```

Under your Wi-Fi adapter, find **IPv4 Address**, e.g. `192.168.8.34`. Write it
down. If it starts with `169.254`, you're not connected to the network properly.

## C2. Open port 5173 in the firewall

Needs an **Administrator** window: Windows key → `powershell` → **right-click**
"Windows PowerShell" → **Run as administrator** → Yes.

```powershell
New-NetFirewallRule -DisplayName "ISU Infirmary Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

Ends with `Enabled : True`. Close that admin window. Once per laptop, never again.

Port **5173 only**. The backend (8000) and database (3306) stay closed to the
network — the nurse laptop never needs them.

## C3. Start the frontend on the network

In the frontend window, add `-- --host`:

```powershell
npm run dev -- --host
```

It now prints a `Network:` line. That's the address the nurse laptop uses.

## C4. Create the nurse account

On the server laptop, log in as **admin** at http://localhost:5173 →
**User Management** → **Add User** → fill in the details → Role: **Nurse** →
Save.

The password must be at least 8 characters and include a symbol.

## C5. Log in from the nurse laptop

1. Connect the nurse laptop to the **same Wi-Fi** as the server.
2. Open any browser.
3. Go to the `Network:` address from C3, e.g. **http://192.168.8.34:5173**
4. Log in with the nurse account.

Admins are deliberately blocked from nurse screens and vice versa — the server
enforces that, not just the menus.

## C6. If the nurse laptop can't connect

| Check | How |
|---|---|
| Same network? | Compare the Wi-Fi name on both laptops |
| Did you use `-- --host`? | Window #2 must show a `Network:` line |
| Can it reach the server at all? | On the nurse laptop: `ping 192.168.8.34` |
| Ping works, page doesn't load | Firewall — redo C2 as administrator |
| Ping fails | Network blocks device-to-device traffic (common on school and public Wi-Fi). Test with a phone hotspot — if it works there, it's the network, not your setup |
| Page loads, but login says "Cannot reach the server" | Backend window #1 isn't running on the server |

### Before your defense

1. **Your IP can change.** Routers hand out addresses automatically, so
   `192.168.8.34` may be different tomorrow and the nurse laptop's link breaks.
   Either re-check `ipconfig` each time, or set a static IP / DHCP reservation
   on the router.
2. **Bring your own network.** Don't rely on campus Wi-Fi — a phone hotspot or
   pocket router both laptops join is predictable.
3. **XAMPP doesn't auto-start.** Start MySQL first, every time.
4. **The two buildings are ~2 km apart.** Wi-Fi won't span that. Real deployment
   needs the campus network routing between the buildings, or cloud hosting.

### Faster, more stable option for demos (optional)

`npm run dev` is a development server. For the defense you can serve a built,
optimized copy instead — same address, same port, same forwarding to the backend:

```powershell
npm run build
```
```powershell
npm run preview -- --host --port 5173
```

Rebuild (`npm run build`) after any frontend code change, or you'll be showing
the old version.

---

## Troubleshooting — every error we've actually hit

| What you see | Meaning | Fix |
|---|---|---|
| `The filename, directory name, or volume label syntax is incorrect` | You're in Command Prompt | Use PowerShell |
| `The '<' operator is reserved for future use` | PowerShell can't do `<` | `cmd /c "mysql -u root < file.sql"` |
| `'mysql' is not recognized` | mysql isn't on PATH | `$env:Path += ";C:\xampp\mysql\bin"` |
| ``linker `link.exe` not found`` | Python 3.14 | Redo A3 with 3.13 |
| `module 'bcrypt' has no attribute '__about__'` | Old requirements, bcrypt too new | `pip install -r requirements.txt` |
| `python-dotenv could not parse statement` | Junk line in `.env` | Redo A2 |
| `Can't connect to MySQL server` | XAMPP MySQL is off | Start it |
| `Get-Service *mysql*` shows nothing | Normal for XAMPP | Not an error |
| `>>` prompt, nothing runs | Pasted several lines at once | Ctrl + C, one line at a time |
| No `(.venv)` in prompt | venv not active | `.\.venv\Scripts\Activate.ps1` |
| `Vite requires Node.js version 20.19+ or 22.12+` | Node too old | Install Node LTS, reopen PowerShell |
| Frontend shows "needs a backend endpoint that isn't available yet" | Backend is outdated | `git pull`, then `pip install -r requirements.txt`, restart backend |
| `ERROR 1901 ... GENERATED ALWAYS AS` when loading schema | Old copy of `schema_v2.sql` | `git pull` — fixed in the current version |

---

## What's built

**Working:** login and lockout, patients and special-case flags, visits with
automatic stock deduction, stock and restock requests (request → approve →
receive), user management, system settings, clinical insights. 31 endpoints,
verified with 60 end-to-end checks against MariaDB.

**Not built yet:** printable Medical Certificate and Parental Notification with
the Director co-signature workflow; Backup Now / Restore / Export SQL.

### Rules when changing the backend

- Stock quantities only change through `services/stock_service.py` — it locks
  the row and writes the audit ledger in the same transaction.
- `stock_status` is computed by the database. Read it, never write it.
- Saving a visit is one transaction: if any medicine is short, nothing is saved.
- Times are stored in UTC and shown in Asia/Manila by the frontend.
- Never commit `.env`, `.venv`, `node_modules`, or any file containing passwords.
