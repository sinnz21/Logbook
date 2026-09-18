# ISU Infirmary Log Book — Backend Setup Guide

How to get the backend running on a Windows laptop, step by step.
Written while actually doing it on 18 September 2026.

Follow the steps in order. Do one command at a time: paste it, press Enter,
read what it says, then move to the next one.

Working setup this was tested on: Windows 11, Python 3.13.14,
MariaDB 10.4.32 (from XAMPP), FastAPI 0.115.6.

---

## ALREADY SET UP? Just run the server

Steps 1–6 are one-time only. Once they're done, this is all you do from then on
— every day, every time.

**1. Start the database.** Open the **XAMPP Control Panel**, find the **MySQL**
row, click **Start**. Wait for it to turn green. (XAMPP does not start by
itself when you turn on the laptop. If MySQL isn't green, every page errors.)

**2. Open PowerShell.** Windows key → type `powershell` → Enter.

**3. Run these three, one at a time** (replace the path with your own — see
"Your two folders" below):

```powershell
cd "C:\Users\com sci\Logbook-git\BackendAndDatabase\backend"
```
```powershell
.\.venv\Scripts\Activate.ps1
```
```powershell
uvicorn app.main:app --reload
```

After the second command your prompt starts with `(.venv)`. After the third you
see `Uvicorn running on http://127.0.0.1:8000`.

**4. Open the browser:** http://localhost:8000/docs

**To stop:** click the PowerShell window, press **Ctrl + C**.
**Leave the window open** while you're working — closing it stops the server.

If you want the nurse laptop to reach it too, use this instead of the third
command, and see Step 8:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### If it doesn't start

| What you see | Fix |
|---|---|
| `Can't connect to MySQL server` | XAMPP MySQL isn't green — go back to 1 |
| `uvicorn is not recognized` | You skipped the `Activate.ps1` line |
| No `(.venv)` in the prompt | Same — run `.\.venv\Scripts\Activate.ps1` |
| `Address already in use` | The server is already running in another window |

---

## Read this first

### Use PowerShell, not Command Prompt

Press the **Windows key**, type `powershell`, press **Enter**. A blue window
opens. Use this window for every command in this guide.

Do **not** use "Command Prompt" (the black window). It does not understand
these commands and you will get:

```
The filename, directory name, or volume label syntax is incorrect.
```

To paste into PowerShell: **Ctrl + V**, or just **right-click**.

### Your two folders

Commands below say things like `cd "your backend folder"`. Replace that with
your real path. There are only two you need:

| The guide says | What it means | Example |
|---|---|---|
| **your repo folder** | where you cloned the project | `C:\Users\com sci\Logbook-git` |
| **your backend folder** | the `BackendAndDatabase\backend` folder inside it | `C:\Users\com sci\Logbook-git\BackendAndDatabase\backend` |

**How to get your own path:** open the folder in File Explorer, click once on
the address bar at the top, press **Ctrl + C**. That copies the path.

So when the guide says:

```powershell
cd "your backend folder"
```

you actually type (keep the quotes — the path has a space in it):

```powershell
cd "C:\Users\com sci\Logbook-git\BackendAndDatabase\backend"
```

### One command at a time

If you paste several lines at once, PowerShell shows `>>` and waits instead of
running them. Paste one line, press Enter, then the next.

---

## What you need installed

| Thing | Notes |
|---|---|
| **Python 3.13** | Not 3.14. See Step 3 — 3.14 fails and cannot be fixed easily |
| **XAMPP** | For the database. Or MySQL Server 8.0 — but never both, they fight over port 3306 |
| **Git** | To clone the project |

The nurse/staff laptop needs **none** of this. Only the server laptop. The
nurse laptop just opens a browser. See Step 8.

---

## Step 1 — Load the database (FIRST INSTALL ONLY)

> ### STOP — read this before running anything in this step
>
> The file `schema_v2.sql` starts with `DROP DATABASE IF EXISTS isu_infirmary`.
> If you run it on a laptop where the database already exists, **it deletes
> every table, every patient record, and every user account.** There is no
> undo.
>
> **Check first.** Open SQLyog or phpMyAdmin and run:
>
> ```sql
> SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'isu_infirmary';
> ```
>
> - Returns **22** → the database is already loaded. **Skip to Step 2.**
> - Returns **0** or an error → continue with this step.

**1a.** Open the **XAMPP Control Panel**. Find the row that says **MySQL** and
click its **Start** button. Wait until the name turns green. If it is already
green, leave it.

**1b.** Open **SQLyog** (or phpMyAdmin). Connect as `root@localhost`. The
password is blank by default in XAMPP — just click Connect.

**1c.** In SQLyog: **File → Execute SQL Script**, pick `schema_v2.sql` from your
repo folder (it's inside `BackendAndDatabase`), and run it. Wait for it to
finish.

**1d.** Check it worked. Open a Query tab and run:

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'isu_infirmary';
```

It must say **22**. Anything less means it stopped partway on an error.

### Note: we use MariaDB, not MySQL

The top of `schema_v2.sql` says it targets MySQL 8.0.16+. XAMPP gives you
MariaDB 10.4 instead. That is fine — the two features the schema needs
(`GENERATED ALWAYS AS (...) STORED` columns and `CHECK` constraints) have both
worked in MariaDB since version 10.2.1. Nothing needs changing. Do not install
MySQL Server just because the header says so.

---

## Step 2 — Create the `.env` file

This file holds the database password and the secret key. It is **not** in the
repo on purpose (it's in `.gitignore`), so **every teammate must create their
own**. Cloning the project is not enough to run it.

**2a.** Generate a secret key. In PowerShell:

```powershell
cd "your backend folder"
```

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

It prints a random string like `-CJbHRBC6C92jxH01M2dKhftZEvkThakyEPlCo7u0Co`.
Select it with your mouse and press **Ctrl + C** to copy it.

**2b.** Create the file. Do **not** try to make it in File Explorer — Windows
will not let you name a file with no name before the dot, and editors often
save it empty or as `.env.txt`. Use this command instead.

Copy the whole block below into Notepad first, replace `PASTE_YOUR_KEY_HERE`
with the key you just copied, then paste the finished line into PowerShell:

```powershell
Set-Content -Path .env -Encoding utf8 -Value @("DB_USER=root","DB_PASSWORD=","DB_HOST=localhost","DB_PORT=3306","DB_NAME=isu_infirmary","SECRET_KEY=PASTE_YOUR_KEY_HERE","ALGORITHM=HS256","ACCESS_TOKEN_EXPIRE_MINUTES=480","CLINIC_TIMEZONE=Asia/Manila","CORS_ORIGINS=http://localhost:5173,http://localhost:3000")
```

`DB_PASSWORD=` is left empty on purpose. XAMPP's root user has no password, and
the code checks for that and builds the connection without one.

**2c.** Check it:

```powershell
Get-Content .env
```

You should see exactly **10 lines**. If you see `@'` or the words `Set-Content`
inside the file, something went wrong — delete the file and redo 2b.

---

## Step 3 — Create the virtual environment

> ### Use Python 3.13. Python 3.14 does NOT work.
>
> On 3.14 the install fails with:
>
> ```
> error: linker `link.exe` not found
> ```
>
> Reason: one of the packages (`pydantic-core`) has no ready-made file for 3.14,
> so pip tries to build it from source, which needs a C++ compiler from Visual
> Studio. Do **not** install Visual Studio Build Tools to fix this — that's 6 GB
> for nothing. Use 3.13, which has a ready-made file.

**3a.** See which Python versions you have:

```powershell
py -0p
```

You want a line starting `-V:3.13`. If there isn't one, download Python 3.13
from python.org and tick **"Add python.exe to PATH"** during install.

**3b.** Go to your backend folder:

```powershell
cd "your backend folder"
```

**3c.** If a `.venv` folder already exists and is broken, delete it first:

```powershell
Remove-Item -Recurse -Force .venv
```

**3d.** Create it with 3.13:

```powershell
py -3.13 -m venv .venv
```

**3e.** Turn it on:

```powershell
.\.venv\Scripts\Activate.ps1
```

Your prompt should now start with `(.venv)`. That's how you know it's on.

If you get a red error about scripts being disabled, run this once, answer `Y`,
then repeat 3e:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**3f.** Confirm the version:

```powershell
python --version
```

It must say `3.13.x`. If it says 3.14, stop — 3d didn't work.

---

## Step 4 — Install the packages

With `(.venv)` showing in your prompt:

```powershell
pip install -r requirements.txt
```

This downloads about 36 packages. Give it a minute. It ends with
`Successfully installed ...` and a long list.

> **If you're using an older copy of `requirements.txt`** that doesn't pin
> bcrypt, also run:
>
> ```powershell
> pip install "bcrypt==4.0.1"
> ```
>
> Why: `passlib 1.7.4` reads an attribute that was removed in bcrypt 4.1, so
> newer bcrypt breaks account creation with
> `AttributeError: module 'bcrypt' has no attribute '__about__'`.
> The current `requirements.txt` in this repo already pins it.

---

## Step 5 — Test the database connection

Do this before anything else. If something's wrong with `.env`, this tells you
plainly instead of burying it in a long error later.

**5a.** Create a small test file:

```powershell
Set-Content -Path dbtest.py -Encoding utf8 -Value @("from sqlalchemy import text","from app.db.session import engine","","with engine.connect() as c:","    print('version:', c.execute(text('SELECT VERSION()')).scalar())","    print('db:', c.execute(text('SELECT DATABASE()')).scalar())","    print('tables:', c.execute(text(\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'isu_infirmary'\")).scalar())")
```

**5b.** Run it:

```powershell
python dbtest.py
```

You should see:

```
version: 10.4.32-MariaDB
db: isu_infirmary
tables: 22
```

If you get `Can't connect to MySQL server`, XAMPP's MySQL isn't running — go
back to Step 1a.

**5c.** Delete the test file:

```powershell
Remove-Item dbtest.py
```

---

## Step 6 — Create the login accounts

Passwords are scrambled (hashed) by Python before being saved. The database has
no column that could hold a plain password, so **you can never create an
account through SQL**. Always use these scripts.

**6a.** The admin account:

```powershell
python create_admin.py
```

It asks for: Username, First name, Last name, Email (can be left blank), then
Password twice.

**Nothing appears while you type the password.** That's on purpose, not a frozen
window. Type it and press Enter. Minimum 8 characters.

It finishes with `Admin 'yourname' created.`

**6b.** The nurse account.

`create_admin.py` only makes admins. There's no admin screen for adding users
yet either. So make a copy of the script with the role changed:

```powershell
Copy-Item create_admin.py create_nurse.py
```

Open `create_nurse.py` in VS Code, find the line containing `role="admin"`,
change it to `role="nurse"`, and save. Then:

```powershell
python create_nurse.py
```

**You need both accounts.** The code deliberately blocks admins from the nurse
screens — an admin login gets "403 Nurse access required" on clinical pages,
because Admin has no clinical role in this system.

---

## Step 7 — Run the server

```powershell
uvicorn app.main:app --reload
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Leave this window open.** Closing it stops the server.

Open your browser and go to:

```
http://localhost:8000/docs
```

You'll see the list of API endpoints.

**Test the login properly:**

1. Click **POST /api/auth/login** to expand it
2. Click the **Try it out** button on the right
3. Type your username and password into the boxes
4. Click the blue **Execute** button
5. Scroll down — you want **Code 200** and a long `access_token` string

That proves the database, the password hashing, and the login token all work
together.

To stop the server: click the PowerShell window and press **Ctrl + C**.

### Starting it again on any later day

1. XAMPP Control Panel → **Start** MySQL
2. PowerShell: `cd "your backend folder"`
3. `.\.venv\Scripts\Activate.ps1`
4. `uvicorn app.main:app --reload`

XAMPP does **not** start by itself when you turn the laptop on. If MySQL isn't
green, every page will error.

---

## Step 8 — Connecting the second laptop (nurse/staff)

### How this actually works

One laptop runs everything: the database and the server. Every other laptop is
just a browser pointed at it. Nothing gets installed on the nurse laptop — no
Python, no XAMPP, no project files.

**Admin and Nurse are not laptops.** They are roles stored in the `users` table
in the database. An admin can log in from the nurse laptop and vice versa; what
they're allowed to see is decided by their account, not by which machine they're
sitting at.

**`localhost` means "this laptop only."** The nurse laptop can never reach the
server's `localhost`. It has to use the server's network address instead.

### On the server laptop

**8a.** Find your address:

```powershell
ipconfig
```

Look for **IPv4 Address** under your Wi-Fi adapter. It looks like
`192.168.1.15`. Write it down. If it starts with `169.254`, you are not
properly connected to the network.

**8b.** Open the port in the firewall. This one needs an **Administrator**
window: press Windows key, type `powershell`, **right-click** "Windows
PowerShell", choose **Run as administrator**, then:

```powershell
New-NetFirewallRule -DisplayName "ISU Infirmary API" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

**8c.** Start the server so other machines can reach it (note the extra part at
the end):

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`0.0.0.0` is what makes it visible on the network. The normal command only
listens to itself.

**8d.** Add the nurse laptop's address to `CORS_ORIGINS` in your `.env`, using
your real IP, then restart the server:

```
CORS_ORIGINS=http://localhost:5173,http://192.168.1.15:5173,http://192.168.1.15:8000
```

### On the nurse laptop

Connect it to the **same Wi-Fi**. Open a browser. Go to:

```
http://192.168.1.15:8000/docs
```

(using the real IP from 8a). If the page loads, the connection works. Log in
there with the nurse account to prove the roles work.

### Three things that will catch you out

1. **The IP address can change.** Routers hand out addresses automatically and
   may give your laptop a different one tomorrow, which breaks the nurse
   laptop's link. Before your defense, set a static IP or reserve it in the
   router.
2. **School and public Wi-Fi often block devices from seeing each other.** If
   the nurse laptop can't connect, test with a phone hotspot. If it works on the
   hotspot, it's the network, not your setup.
3. **Two buildings 2 km apart will not work over Wi-Fi.** The infirmary and the
   admin building need either the campus network routing between them, or the
   system hosted online.

---

## Step 9 — When something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `'mysql' is not recognized` | Windows doesn't know where mysql is | `$env:Path += ";C:\xampp\mysql\bin"` |
| `The '<' operator is reserved for future use` | PowerShell can't do `<` | Use `cmd /c "mysql -u root < file.sql"` |
| `The filename, directory name, or volume label syntax is incorrect` | You're in Command Prompt | Open PowerShell instead |
| ``linker `link.exe` not found`` | You're on Python 3.14 | Redo Step 3 with 3.13 |
| `module 'bcrypt' has no attribute '__about__'` | bcrypt too new for passlib | `pip install "bcrypt==4.0.1"` |
| `python-dotenv could not parse statement` | Junk line inside `.env` | Redo Step 2b |
| `Can't connect to MySQL server` | XAMPP MySQL is off | Start it in XAMPP Control Panel |
| `Get-Service *mysql*` shows nothing | Normal for XAMPP | Not an error — XAMPP isn't a Windows service |
| Prompt shows `>>` and nothing runs | You pasted several lines at once | Press Ctrl + C, paste one line at a time |
| No `(.venv)` in your prompt | Virtual environment is off | `.\.venv\Scripts\Activate.ps1` |
| Nurse laptop can't open the page | Server on `127.0.0.1`, or firewall | Redo Steps 8b and 8c |

---

## Step 10 — What's built and what isn't

**Working now:** login/authentication, and visits.

**Not built yet** — listed as TODO in `app/api/router.py`:

- `patients.py` — add, edit, search patients, view their visit history
- `stock.py` — inventory, restock requests, approve/deny/receive
- `users.py` — admin screen for managing accounts (would replace Step 6's scripts)
- `insights.py` — most common complaints, treatment pairings, stock forecasts
- `lookups.py` — patient types, complaint list, dispositions, categories

This is why the frontend's Add Patient, Restock, stock and admin screens still
show fake data — there is nothing real to connect them to yet.

### Rules when adding new endpoints

- Stock changes go through `services/stock_service.py`. Never set
  `stock.quantity` directly from an endpoint — the service locks the row and
  writes the history entry in the same transaction.
- `stock_status` is calculated by the database. Read it, never write it.
- Saving a visit is one single transaction. See `services/visit_service.py`.
- Save times in UTC. Convert to Asia/Manila in the React frontend.
