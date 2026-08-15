# Mini Expense Manager

A small full-stack application to track daily expenses with automatic vendor-based
categorization, CSV import, anomaly detection, and a monthly dashboard.

## Features

- Add an expense manually (date, amount, vendor, description); category is assigned
  automatically from vendor rules (e.g. `Swiggy` → `Food`).
- Upload a CSV of expenses; valid rows are saved, invalid rows are reported with row numbers.
- Rule-based categorization driven by a `vendor_category_rules` table with seeded defaults.
- Anomaly detection: an expense is flagged when its amount is greater than **3× the average**
  of existing expenses in the same category (expenses only, first-in-category never flagged).
- Monthly dashboard: total spend, totals per category, top 5 vendors, anomaly count + list.

## Technologies

| Layer     | Stack |
|-----------|-------|
| Frontend  | React 19 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Base UI), TanStack Query |
| Backend   | Java 21, Spring Boot 4, Spring Data JPA, Flyway, Bean Validation |
| Database  | PostgreSQL (tested against Neon), H2 in tests |

## Project layout

```
backend/   Spring Boot REST API
frontend/  React + Vite single-page app
sample-expenses.csv            valid CSV demonstrating categorization + an anomaly
sample-invalid-expenses.csv    CSV with bad rows for testing import error reporting
```

## Setup

### 1. Backend

Requirements: Java 21 and Maven (the Maven wrapper is included).

Create `backend/.env` (never commit it), modeled on `backend/.env.example`:

```env
DATABASE_URL="jdbc:postgresql://host/database?user=user&password=password&sslmode=require"
PORT=8080
```

Apply database migrations explicitly (Flyway is disabled at startup so the app can
start even if the schema already exists):

```bash
cd backend
bash scripts/migrate.sh
```

Run tests (H2; no Neon connection needed):

```bash
./mvnw test
```

Start the API:

```bash
./mvnw spring-boot:run
```

The server listens on `http://localhost:8080` (override with `PORT`).

### 2. Frontend

Requirements: Node.js and pnpm.

```bash
cd frontend
pnpm install
pnpm dev
```

By default the app calls `http://localhost:8080`. To override, set `VITE_API_BASE_URL`
in `frontend/.env.local`. The app is served at `http://localhost:5173`.

Build and lint:

```bash
pnpm build
pnpm lint
```

## CSV import format

UTF-8 CSV with a header row and these columns, in order:

```
date,amount,currency,transactionType,accountName,vendorName,description
```

- `date`: `YYYY-MM-DD` or ISO date-time (e.g. `2026-08-01T12:30:00`)
- `amount`: positive decimal number
- `currency`: 3-letter code (defaults to `INR` when blank)
- `transactionType`: `EXPENSE` or `INCOME`
- `vendorName`: required; used for rule-based categorization
- Quoted fields (e.g. `"Team lunch, big order"`) are supported

Example: see `sample-expenses.csv`.

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/expenses?month=YYYY-MM` | List expenses (newest first, optional month) |
| POST | `/api/expenses` | Create an expense manually |
| POST | `/api/expenses/import` | Import a CSV (`multipart/form-data`, field `file`) |
| GET/POST | `/api/vendor-rules` | List / create vendor rules |
| PUT/DELETE | `/api/vendor-rules/{id}` | Update / delete a rule |
| GET | `/api/dashboard/summary?month=YYYY-MM` | Monthly totals, top vendors, anomalies |

## Design note (mandatory)

- **Rule-based categorization:** vendor names are trimmed and lower-cased before lookup
  against the `vendor_category_rules` table; a matched rule sets the category, otherwise the
  expense falls back to `Uncategorized`. The same `categorize()` path is used for manual entry
  and CSV import, so behavior is identical.
- **Anomaly logic:** for each new expense the current average of existing expenses in the same
  category is computed (`expenses.categoryAverage`); an expense is flagged when
  `amount > 3 × average`. Only `EXPENSE` rows are considered, the first expense in a category
  has no baseline and is never flagged, and exactly `3×` is not an anomaly (strict greater-than).
- **Data model:** a single `expenses` table (date, amount `NUMERIC(12,2)`, currency, type,
  vendor, description, category, anomaly flag) plus a `vendor_category_rules` table with a
  unique normalized vendor name; Flyway manages schema, with indexes on date/category/vendor/anomaly.
- **Trade-offs:** updating a rule affects only future expenses (historical records are not
  recategorized); dashboard aggregation runs in Java over the month's rows rather than SQL
  (fine at this scale, easy to move to SQL later); the CSV parser is a small quote-aware
  implementation rather than a full RFC-4180 library; single currency assumption (INR).

## Assumptions

- One currency (`INR`) with no conversion.
- Single user, no authentication.
- Anomaly baseline is the category average across **all** history (not just the selected month).
- For CSV batches, each row's anomaly check includes rows imported earlier in the same batch.
