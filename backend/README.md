# Expense Manager Backend

Spring Boot 4 / Java 21 REST API backed by PostgreSQL (Neon compatible). It uses Spring Data JPA for persistence, Flyway SQL migrations, and `dotenv-java` for local configuration.

## Setup

Create `backend/.env` (never commit it):

```env
DATABASE_URL="jdbc:postgresql://host/database?user=user&password=password&sslmode=require"
PORT=8080
```

Run database migrations explicitly, without starting the HTTP server:

```bash
cd backend
bash scripts/migrate.sh
```

Start the API:

```bash
./mvnw spring-boot:run
```

Run tests (H2 only; no Neon connection is used):

```bash
./mvnw test
```

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST / GET | `/api/expenses` | Create or list expenses; optional `month=YYYY-MM` |
| POST | `/api/expenses/import` | Upload a seven-column CSV file |
| GET / POST | `/api/vendor-rules` | List or create vendor rules |
| PUT / DELETE | `/api/vendor-rules/{id}` | Update or delete a rule |
| GET | `/api/dashboard/summary?month=YYYY-MM` | Monthly totals, top vendors, anomalies |

Manual expense request:

```json
{"occurredAt":"2026-08-01T12:30:00","amount":250.00,"currency":"INR","transactionType":"EXPENSE","accountName":"Demo account","vendorName":"Swiggy","description":"Lunch"}
```

CSV header: `date,amount,currency,transactionType,accountName,vendorName,description`. Dates accept `YYYY-MM-DD` or ISO local date-time (for example `2026-08-01T12:30:00`). Import returns `{ importedRows, failedRows, anomalyCount, errors: [{ row, message }] }`.

## Design notes

Vendor names are trimmed and lowercased before rule lookup. A matched rule sets the category; otherwise the expense is `Uncategorized`. For an expense, the service computes the existing category average before saving and flags an amount strictly greater than three times that average. Each schema change is a new Flyway migration (`V2__...sql`, never modify applied `V1`). The CSV parser is a small quote-aware implementation (embedded commas and escaped quotes); production imports should use a dedicated RFC-4180 parser and asynchronous batch processing.
