# Mini Expense Manager

A full-stack expense tracker with automatic vendor-based categorization, CSV import,
anomaly detection, and a monthly dashboard.

## Demo

🎬 Demo video: _coming soon — https://drive.google.com/file/d/1G3-BnUuU7DSaNx2S7xrYPjLIcxJp3EzS/view?usp=sharing

## Features

- Manual expense entry — category auto-assigned from vendor rules (e.g. `Swiggy` → `Food`)
- CSV import with per-row error reporting
- Anomaly detection: `amount > 3 × category average` (EXPENSE only, strict greater-than)
- Monthly dashboard: total spend, per-category totals, top 5 vendors, anomalies
- Paginated, filterable expense list (month, vendors, categories, types)

## Stack

| Layer | Stack |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | Java 21, Spring Boot, Spring Data JPA, Flyway |
| Database | PostgreSQL (Neon); H2 in tests |

## Quick start

Backend (Java 21):

```bash
cd backend
cp .env.example .env          # set DATABASE_URL
bash scripts/migrate.sh       # apply schema
./mvnw spring-boot:run        # http://localhost:8080
```

Frontend (Node + pnpm):

```bash
cd frontend
pnpm install
pnpm dev                      # http://localhost:5173
```

Tests: `./mvnw test` (backend) · `pnpm build && pnpm lint` (frontend).

## Deploy backend on Render

The `backend/Dockerfile` builds and runs the API. On Render, create a **Docker** web
service pointing at the `backend` directory and set these env vars:

- `DATABASE_URL` — PostgreSQL URL (e.g. Neon)
- `CORS_ORIGINS` — comma-separated frontend origins, e.g. `https://iconcile-assignment.vercel.app`
- `FLYWAY_ENABLED=true` — applies migrations on boot (idempotent; defaults to `true`)

`PORT` is set by Render automatically. Deploy the frontend on Vercel with
`VITE_API_BASE_URL` set to the backend URL.

## CSV import

Header required, columns in order:

```
date,amount,currency,transactionType,accountName,vendorName,description
```

- `date`: `YYYY-MM-DD` or ISO date-time · `amount`: positive decimal
- `currency`: `INR` only · `transactionType`: `EXPENSE` | `INCOME` · `vendorName`: required
- Quoted fields supported (e.g. `"Team lunch, big order"`)

Sample files: `sample-expenses.csv`, `sample-invalid-expenses.csv`, `sample-expenses-50.csv`.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/expenses` | List (paginated, newest first; filters: `month`, `vendors`, `categories`, `types`) |
| POST | `/api/expenses` | Create an expense |
| POST | `/api/expenses/import` | Import CSV (`multipart/form-data`, field `file`) |
| GET/POST | `/api/vendor-rules` | List / create vendor rules |
| PUT/DELETE | `/api/vendor-rules/{id}` | Update / delete a rule |
| GET | `/api/dashboard/summary?month=YYYY-MM` | Monthly totals, top vendors, anomalies |
| GET | `/api/health` | Health check |

`GET /api/expenses` returns `{ items, page, size, totalItems, totalPages, hasNext }`.
Filters accept comma-separated or repeated values; vendor matching is case-insensitive.

## Design notes

- **Categorization:** vendor names are trimmed and lower-cased before lookup in
  `vendor_category_rules`; the same path serves manual entry and CSV import.
- **Anomalies:** computed against the average of existing same-category expenses;
  the first expense in a category is never flagged, `3×` exactly is not anomalous.
- **Trade-offs:** rule updates affect only future expenses; dashboard aggregation runs in
  Java (fine at this scale); single currency (`INR`); single user, no auth.
