# IT Expense Backend

This is a temporary Express.js API with in-memory dummy data. It is separate from the Angular frontend and mirrors the endpoint names already declared in `src/app/core/api/api-endpoints.ts`.

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
    dummy-store.js             In-memory data access layer
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

## Dummy Login Accounts

All passwords are:

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

Keep the route files stable and replace `backend/store/dummy-store.js` with SQL Server repositories later. The expected next structure is:

```text
backend
  db
    sql-server.js              SQL Server connection pool
  repositories
    request.repository.js
    user.repository.js
    workflow.repository.js
```

The frontend should continue calling the same `/api/...` endpoints.
