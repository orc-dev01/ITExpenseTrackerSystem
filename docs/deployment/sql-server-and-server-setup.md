# IT Expense Deployment Setup

This guide prepares the project for a real SQL Server database and a deployable Node/Angular server setup. It works for an internal-only server that users access on the company LAN or over remote desktop/VPN; the app does not need to be exposed to the public internet.

## 1. Install Required Software

Install these on the server:

- SQL Server 2022 or newer, or SQL Server Express for small/internal deployments.
- SQL Server Management Studio or Azure Data Studio.
- Node.js matching `package.json` engines, preferably Node 24 LTS or a compatible Node 22+ runtime.
- Git, if you will pull the project from source control.
- IIS with URL Rewrite and Application Request Routing, or another reverse proxy such as Nginx.

## 2. Create The SQL Server Database

Open SQL Server Management Studio as an administrator.

Run these production/internal setup scripts in order:

```text
backend/db/01-create-database.sql
backend/db/02-schema.sql
backend/db/03-seed-reference-data.sql
```

`03-seed-reference-data.sql` creates required reference/setup data only. It does not create demo users.

For UAT/demo testing only, optionally run:

```text
backend/db/06-seed-demo-users.sql
```

Before real users start entering real requests, remove those demo users with:

```text
backend/db/07-remove-demo-data.sql
```

Create real internal users with bcrypt password hashes:

```powershell
npm run hash:password -- "A-Strong-Temporary-Password"
```

Paste the generated hash into this template and run it once per user:

```text
backend/db/08-create-internal-user-template.sql
```

If you already created the database before backend SQL integration was added,
also run this once:

```text
backend/db/04-migrate-existing-database.sql
```

What they create:

- Database: `ITExpense`
- Schema: `app`
- App login/user: `it_expense_app`
- Core tables for users, roles, departments, cost centers, categories, projects, requests, line items, attachments, workflow logs, notifications, reports, and finance processing.
- Future-ready tables for budgets, budget transactions, purchase orders, deliveries, reimbursements, and export jobs.

Database map:

```text
Security
  Roles, Users, UserRoles

Reference setup
  Departments, CostCenters, CoaAccounts, ExpenseCategories, Projects, ApprovalMatrixRules

Current request workflow
  RequestTypes, RequestStatuses, ExpenseRequests, RequestLineItems,
  RequestLineItemLinks, Attachments, WorkflowLogs, Notifications

Current finance processing
  DisbursementStatuses, DisbursementRecords

Future Phase 2/3 modules
  Budgets, BudgetTransactions, PurchaseOrders, PurchaseOrderItems,
  Deliveries, ReimbursementDetails, ExportJobs
```

Before production, change the placeholder password in `01-create-database.sql`:

```sql
CREATE LOGIN it_expense_app
  WITH PASSWORD = N'CHANGE_THIS_STRONG_PASSWORD';
```

Use a strong generated password and store it only in the server environment file.

## 3. Confirm SQL Server Connectivity

From the app server, test login access:

```powershell
sqlcmd -S localhost -d ITExpense -U it_expense_app -P "YOUR_PASSWORD" -Q "SELECT COUNT(*) AS RoleCount FROM app.Roles;"
```

Expected result: a count greater than `0`.

If this fails:

- Ensure SQL Server allows TCP/IP connections.
- Ensure port `1433` is open between the app server and database server.
- If using SQL Authentication, ensure mixed authentication is enabled.
- If using Windows Authentication, skip the SQL login and grant database access to the Windows service account instead.

## 4. Configure Backend Environment

Copy `.env.example` to `.env` on the server and update the values:

```text
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=http://your-internal-server-name
DATA_STORE=sqlserver
DB_SERVER=your-sql-server
DB_PORT=1433
DB_NAME=ITExpense
DB_USER=it_expense_app
DB_PASSWORD=your-real-password
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=your-long-random-secret
ALLOW_DEV_PASSWORDS=false
UPLOAD_DIR=C:\ITExpense\uploads
```

For your local SQL Express instance, use this shape:

```text
DATA_STORE=sqlserver
DB_SERVER=MARKMAYO\SQLEXPRESS
DB_NAME=ITExpense
DB_USER=it_expense_app
DB_PASSWORD=the-password-you-used-in-01-create-database.sql
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=replace-with-a-long-random-secret
ALLOW_DEV_PASSWORDS=false
```

Create the upload folder:

```powershell
New-Item -ItemType Directory -Force C:\ITExpense\uploads
```

Give the Node service account read/write access to that folder.

## 5. Prepare The Node Server

Install dependencies:

```powershell
npm ci
```

Build the Angular frontend:

```powershell
npm.cmd run build
```

Check backend syntax:

```powershell
npm.cmd run check:backend
```

Check SQL Server connectivity:

```powershell
npm.cmd run check:sql
```

The backend now switches to SQL Server when `DATA_STORE=sqlserver` is set, or when database credentials are present. Without those values, it keeps using the dummy store for local demos.

SQL/auth packages used by the backend:

```powershell
npm install mssql dotenv bcryptjs jsonwebtoken
```

## 6. Production Server Layout

Recommended folder layout:

```text
C:\ITExpense
  app
    backend
    dist
    package.json
    package-lock.json
    .env
  uploads
  logs
```

The Angular build output is:

```text
dist/it-expense
```

Serve that folder as the static frontend.

Run the API on:

```text
http://localhost:5000/api
```

Expose the public site through HTTPS, then reverse proxy `/api` to the local Node API.

## 7. IIS Reverse Proxy Setup

In IIS:

1. Create a site for the Angular static files, pointing to `dist/it-expense`.
2. Install IIS URL Rewrite and Application Request Routing.
3. Enable reverse proxy in Application Request Routing.
4. Add a URL Rewrite rule:
   - Match URL: `^api/(.*)`
   - Action type: `Rewrite`
   - Rewrite URL: `http://localhost:5000/api/{R:1}`
5. Bind the site to HTTPS with an internal certificate if available. For a small LAN-only pilot, HTTP can work temporarily, but HTTPS is still preferred for passwords and session tokens.

The frontend production environment uses the same host as the site:

```ts
apiBaseUrl: "/api"
```

## 8. Run The API As A Service

For Windows Server, use either NSSM, PM2, or a Windows service wrapper.

PM2 example:

```powershell
npm install -g pm2
pm2 start backend/server.js --name it-expense-api
pm2 save
pm2 startup
```

Important production settings:

- Run as a dedicated low-privilege Windows account.
- Give that account access only to the app folder, upload folder, and logs.
- Keep `.env` outside public web folders.
- Do not commit `.env`.

## 9. Deployment Checklist

Before go-live:

- SQL scripts ran successfully.
- `.env` contains real database and JWT secrets.
- Angular build succeeds.
- Backend syntax check succeeds.
- SQL connection check succeeds with `npm.cmd run check:sql`.
- API health endpoint returns `ok`.
- Demo users are removed or disabled with `backend/db/07-remove-demo-data.sql`.
- Real users have bcrypt password hashes and role assignments.
- `ALLOW_DEV_PASSWORDS=false` in `.env`.
- File uploads write to `UPLOAD_DIR`.
- HTTPS is enabled when the app is accessed over the LAN, VPN, or an internal DNS name.
- Database backup job is scheduled.
- Server logs are retained and rotated.

## 10. Current Production Scope

The request workflow, authentication, reporting endpoints, and SQL Server data layer are wired to the backend. Some admin/setup and future-module screens are still placeholder views until their write workflows are implemented. Keep those routes limited to Admin users and treat them as read-only/future areas for the first internal production release.
