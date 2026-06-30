# IT Expense SQL Server Database

For production or internal pilot setup, run these scripts in order:

1. `01-create-database.sql`
2. `02-schema.sql`
3. `03-seed-reference-data.sql`

`03-seed-reference-data.sql` inserts required setup data only: roles,
statuses, departments, cost centers, categories, projects, and approval matrix
rules. It does not create demo login accounts.

If the database was already created before `04-migrate-existing-database.sql`
was added, run that migration once as well.

For UAT/demo only, optionally run:

4. `06-seed-demo-users.sql`

Those users use `password123` through `DEV_ONLY_` password markers. They are
blocked automatically when `NODE_ENV=production` unless
`ALLOW_DEV_PASSWORDS=true` is set.

Before real users start entering data, remove demo users with:

5. `07-remove-demo-data.sql`

Create real internal users by generating a bcrypt hash with
`npm run hash:password -- "StrongPassword"` and then running
`08-create-internal-user-template.sql` once per user.

The schema uses the `app` schema inside the `ITExpense` database. Current modules are represented by request, workflow, finance queue, report, notification, and reference-data tables. Future modules are reserved through budget, purchase order/delivery, reimbursement, and export job tables.
