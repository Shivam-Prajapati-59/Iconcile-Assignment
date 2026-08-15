# Mini Expense Manager — Implementation Plan

## Scope and decisions

- [x] Keep the requested stack: React + TypeScript (Vite) frontend, Java Spring Boot backend, PostgreSQL database.
- [x] Confirm a supported local Java version (21 LTS is a safe choice) and align `backend/pom.xml` if Java 25 / Spring Boot 4.1 is unavailable locally.
- [x] Use one base currency and store amounts as `BigDecimal` (`NUMERIC(12,2)` in PostgreSQL); currency conversion is out of scope.
- [x] Treat a vendor match as case-insensitive and trimmed. A vendor is required for normal imports; apply a matching vendor rule first, otherwise use `Uncategorized`.
- [x] Define anomaly calculation clearly: compare a new expense with the average of *existing* expenses in the same category. Flag when `amount > 3 × average`; do not flag the first expense in a category.

## 1. Backend foundation

- [x] Configure `application.properties` to read database URL, username, password, and server port from environment variables; document these in `.env.example`.
- [x] Add a development CORS configuration for the Vite origin (`http://localhost:5173`).
- [x] Add Flyway and create the initial migration under `src/main/resources/db/migration/`.
- [x] Create tables:
  - [x] `expenses`: id, expense_date, amount, vendor_name, description, category, is_anomaly, created_at.
  - [x] `vendor_category_rules`: id, normalized_vendor_name (unique), category, created_at.
- [x] Seed a small useful default rule set (for example Swiggy/Zomato → Food, Uber/Ola → Transport, Amazon → Shopping).
- [x] Create JPA entities, repositories, DTOs, validation constraints, and a global error response handler.

## 2. Expense and categorization APIs

- [x] Implement `POST /api/expenses` to validate and save a manually entered expense.
- [x] Centralize categorization in a `CategorizationService` so both manual entry and CSV import use identical vendor-rule logic. *(Implemented as `ExpenseService.categorize()`.)*
- [x] Implement `GET /api/expenses` with optional month/category filters and newest-first ordering for the transaction list.
- [x] Implement vendor-rule endpoints:
  - [x] `GET /api/vendor-rules`
  - [x] `POST /api/vendor-rules`
  - [x] `PUT /api/vendor-rules/{id}`
  - [x] `DELETE /api/vendor-rules/{id}`
- [x] Decide and document whether updating a rule affects only future expenses (recommended shortcut) or also recategorizes historical records. *(Future expenses only, documented.)*

## 3. CSV import and anomaly detection

- [x] Normalize the source CSV before import. Exclude the duplicate `Note`, duplicate `Account`, and ambiguous `INR` columns; retain a single canonical amount field.
- [x] Specify and document the clean CSV format: `date,amount,currency,transactionType,accountName,vendorName,description`, with a header row and ISO dates (`YYYY-MM-DD`). `vendorName` is required; legacy exports without it need enrichment before import.
- [x] Add `POST /api/expenses/import` accepting `multipart/form-data` with a `file` field.
- [x] Parse rows defensively: trim fields, validate date/amount/vendor, skip blank rows, and collect row-specific errors.
- [x] Return an import summary: total rows, imported rows, failed rows, errors, and anomaly count.
- [x] Implement an `AnomalyDetectionService` that queries the category average before persisting each entry and sets `isAnomaly` accordingly. *(Implemented inside `ExpenseService.create()`.)*
- [x] For CSV files, process rows in a transaction and calculate each row against expenses already stored/imported earlier in the batch; document this predictable behavior.

## 4. Dashboard APIs

- [x] Implement `GET /api/dashboard/summary?month=YYYY-MM` returning:
  - [x] monthly total spend;
  - [x] totals grouped by category;
  - [x] top five vendors by total spend;
  - [x] anomaly count and anomaly expense records.
- [ ] Use database aggregation queries rather than loading all expenses into Java for summary calculations. *(Shortcut: aggregation runs in Java over the month's rows — fine at this scale and documented as a trade-off in the README.)*
- [x] Return zero-value/empty states consistently so the frontend can render a month with no expenses.

## 5. Backend tests and verification

- [x] Unit-test categorization: known vendor, whitespace/case variation, and unknown vendor.
- [x] Unit-test anomaly boundaries: no history, exactly `3×` (not anomalous), and greater than `3×` (anomalous).
- [x] Integration-test manual creation, CSV import validation/reporting, and dashboard totals using a test database strategy. *(18 tests on H2.)*
- [x] Manually exercise the API with the included sample CSV before starting UI integration. *(Verified against Neon: 12 rows imported, 1 anomaly flagged.)*

## 6. Frontend structure and API layer

- [x] Replace the Vite placeholder in `src/App.tsx` with the application shell and dashboard layout.
- [x] Add TypeScript types matching backend request/response DTOs.
- [x] Create a small API client using a configurable `VITE_API_BASE_URL` and React Query for fetching, mutations, cache invalidation, loading, and error states.
- [x] Keep the first version as a responsive single-page dashboard; routing is optional and unnecessary for this assignment.

## 7. Frontend features

- [x] Add an expense form with date (default today), amount, vendor, description, client-side validation, and a clear success/error message.
- [x] Add a CSV upload panel with the expected-column hint, upload progress, and a readable imported/skipped-row result.
- [x] Add a month selector that refreshes the dashboard and expense list.
- [x] Display category totals as summary cards or a compact chart/list; avoid adding a chart library unless it materially improves clarity.
- [x] Display the top five vendors with total spend.
- [x] Render an expense table with date, vendor, description, category, and amount.
- [x] Make anomalies visually distinct with a badge/row treatment and show a dedicated anomaly count/list.
- [x] Add empty, loading, and API-error states for every data-dependent panel.

## 8. Polish and submission material

- [x] Add `sample-expenses.csv` at the repository root, including one deliberately anomalous expense.
- [x] Replace the template frontend README with a root `README.md` covering prerequisites, PostgreSQL setup, environment variables, migration/start commands, frontend commands, CSV format, and API overview.
- [x] Add the mandatory 5–10 line design note to the README (or `DESIGN_NOTE.md`) covering categorization, anomaly logic, data model, and shortcuts/trade-offs.
- [x] Run backend tests, frontend lint, and frontend production build; fix all failures.
- [x] Do one end-to-end manual pass: create a rule, add an expense, import the sample CSV, confirm anomaly status, and validate dashboard totals for the selected month.
- [ ] Commit in logical units and include a short demo screenshot/GIF only if time permits. *(Commits pending final review.)*
