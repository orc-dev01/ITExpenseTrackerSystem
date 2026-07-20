# IT Expense

Fresh Angular frontend scaffold for the IT Expense & Procurement Management System (IT-EPMS), based on the PRD v2.0 and organized in the same broad style as the XiPay Angular project: feature areas, shared layout, guarded routes, service layer, typed models, and centralized API endpoints.

This project is intentionally simple and scalable. It does not include third-party UI kits, charting libraries, auth SDKs, or file upload helpers yet. Add those later only when the backend/API contract is finalized.

## Stack

- Angular 22 standalone application
- TypeScript 6.x
- Angular Router
- Angular HttpClient
- CSS only
- No extra runtime dependencies beyond Angular/RxJS

## Commands

```bash
npm install
npm start
npm run build
```

No dependencies were installed during scaffold creation.

## Installation And VM Handover

For server setup, SQL Server setup, production checks, and VM copy/clone handover steps, see:

```text
docs/deployment/install-and-vm-handover-guide.md
```

## User Manual

For role-based user instructions and workflow steps, see:

```text
docs/user-manual.md
```

## Structure

```text
src/app
  core
    api                 Central endpoint map and generic API wrapper
    auth                Session model, auth service, guards, token interceptor
    models              Shared domain enums and interfaces
  features
    account-info        User profile/account area
    admin               Approval matrix and reference setup
    auth                Login route
    budgets             Phase 2 budget upload/tracking placeholders
    dashboard           Spend dashboard landing area
    disbursement        Accounting/Purchasing queue placeholders
    maintenance         Departments, cost centers, categories, users, projects
    notifications       In-app notification queue placeholders
    procurement         Phase 3 purchase request placeholders
    reimbursements      Phase 3 reimbursement placeholders
    reports             Spend/export reports
    requests            Expense request submission and detail placeholders
    utilities           Monitoring/SOA utilities
    workflow            Endorsement/approval queues and audit views
  shared
    layout              Header/sidebar/footer shell
    pages               Reusable feature placeholder page
```

## Route Map

```text
/auth/login
/dashboard
/requests
/requests/new
/requests/:id
/workflow/endorsements
/workflow/approvals
/workflow/audit
/maintenance/departments
/maintenance/cost-centers
/maintenance/categories
/maintenance/users
/maintenance/projects
/reports/spend
/reports/exports
/budgets
/disbursement/accounting
/disbursement/purchasing
/procurement
/reimbursements
/notifications
/admin/approval-matrix
/admin/reference-data
/account-info
/utilities/monitoring
```

All non-auth routes are protected by `authGuard`. Role requirements are declared in route `data.roles` and enforced by `roleGuard`.

## Backend Integration

Set the backend base URL in `src/environments/environment*.ts`.

The endpoint map lives in `src/app/core/api/api-endpoints.ts`. Replace placeholder paths there when the backend contract is ready.

## Mock Accounts

Development uses `mockAuth: true`, so the app can be tested without a backend. Select one of these accounts on the login page. All passwords are `password123`.

| Role | Email |
| --- | --- |
| Requester | requester@test.com |
| Endorser | endorser@test.com |
| Approver | approver@test.com |
| Finance Viewer | finance@test.com |
| Admin | admin@test.com |
| All Roles | super@test.com |

## LocalStorage Workflow Testing

Mock requests are stored in localStorage under these keys:

- `IT_EXPENSE_SESSION`
- `IT_EXPENSE_REQUESTS`
- `IT_EXPENSE_AUDIT_LOG`

Suggested test flow:

1. Login as `requester@test.com` and create a request from `/requests/new`.
2. Logout and login as `endorser@test.com`, then endorse the pending request.
3. Logout and login as `approver@test.com`, then approve the endorsed request.
4. Logout and login as `finance@test.com`, then close the approved request.
5. Login as `admin@test.com` or `super@test.com` to view admin routes and reset mock request data.
