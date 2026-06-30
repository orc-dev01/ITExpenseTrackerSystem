# IT Expense Backend

This Express.js API can run in two modes:

- Dummy mode, using in-memory data from `backend/store/dummy-store.js`.
- SQL Server mode, using the `app` schema in the `ITExpense` database.

Set `DATA_STORE=sqlserver` and the `DB_*` environment variables to use SQL Server.

## Structure

```text
backend
  server.js                    Express app entry point
  data
    dummy-data.js              Temporary seed data
  middleware
    auth.middleware.js         Dummy bearer-token auth and role checks
  routes
    auth.routes.js             Login, refresh, logout, current user
    requests.routes.js         Expense request CRUD and line-item endpoints
    workflow.routes.js         Endorse, approve, return, reject, audit trail
    reference.routes.js        Admin/reference setup lists
    reports.routes.js          Dashboard, summary, CSV export
    misc.routes.js             Budgets, disbursement, notifications, health
  store
    index.js                   Selects dummy or SQL Server store
    dummy-store.js             In-memory data access layer
    sql-store.js               SQL Server data access layer
  db
    sql-server.js              SQL Server connection pool
  config
    env.js                     Environment variable loading
```

## Run

```bash
npm run start:api
```

The API runs on:

```text
http://localhost:5000/api
```

The Angular development environment already points to that base URL.

## Demo Login Accounts

Demo accounts are available only when the dummy store is used or when
`backend/db/06-seed-demo-users.sql` has been run for UAT.

All demo passwords are:

```text
password123
```

```text
requester@test.com
endorser@test.com
approver@test.com
finance@test.com
admin@test.com
super@test.com
```

## Test With PowerShell

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login -ContentType 'application/json' -Body '{"email":"super@test.com","password":"password123"}'
$headers = @{ Authorization = "Bearer $($login.accessToken)" }
Invoke-RestMethod -Uri http://localhost:5000/api/expense-requests -Headers $headers
Invoke-RestMethod -Uri http://localhost:5000/api/reports/spend-dashboard -Headers $headers
```

## SQL Server Integration Later

SQL Server integration is now wired through `backend/store/sql-store.js`.
Use this local SQL Express shape in `.env`:

```text
DATA_STORE=sqlserver
DB_SERVER=MARKMAYO\SQLEXPRESS
DB_NAME=ITExpense
DB_USER=it_expense_app
DB_PASSWORD=your-password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Then verify with:

```bash
npm run check:sql
```

The frontend continues calling the same `/api/...` endpoints.
