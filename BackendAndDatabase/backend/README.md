# ISU Infirmary Log Book — Backend

FastAPI + SQLAlchemy 2.0 + MySQL. Serves the React frontend.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit DB_PASSWORD and SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"   # SECRET_KEY
```

The database must already exist — run `schema_v2.sql` first.

```bash
python create_admin.py             # first account
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs

## Layout

```
app/
  core/       config, password hashing, JWT, request dependencies
  db/         engine, session, declarative base
  models/     SQLAlchemy models — all 22 tables
  schemas/    Pydantic in/out, camelCase for the frontend
  services/   business logic that must not live in a route
  api/routes/ HTTP endpoints
alembic/      migrations
```

## Rules

**Stock changes go through `services/stock_service.py`.** Never write
`stock.quantity` from a route. The service takes a row lock and writes the
ledger row in the same transaction.

**`stock_status` is a generated column.** Read it, never assign it.

**Saving a visit is one transaction.** See `services/visit_service.py`.

**Store UTC.** Render Asia/Manila in React.

## For the React team

- OpenAPI schema: http://localhost:8000/openapi.json
- Generate the client rather than hand-writing types:
  `npx openapi-typescript http://localhost:8000/openapi.json -o src/api/types.ts`
- Responses are camelCase; the database is snake_case. Pydantic converts.
- Decimal fields arrive as strings — don't do float math on quantities.
- List endpoints return `{ items, total, page, perPage }`.

## Alembic

The schema was created by `schema_v2.sql`, so stamp it as the baseline before
generating anything:

```bash
alembic revision --autogenerate -m "baseline"   # inspect it, then:
alembic stamp head
```

From then on: `alembic revision --autogenerate -m "..."` then `alembic upgrade head`.

## Not built yet

`api/routes/` has auth and visits. Patients, stock, users, insights and lookups
follow the same pattern — see the TODO in `api/router.py`.
