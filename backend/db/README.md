# IT Expense SQL Server Database

Run these scripts in order:

1. `01-create-database.sql`
2. `02-schema.sql`
3. `03-seed-reference-data.sql`

If the database was already created before `04-migrate-existing-database.sql`
was added, run that migration once as well.

The schema uses the `app` schema inside the `ITExpense` database. Current modules are represented by request, workflow, finance queue, report, notification, and reference-data tables. Future modules are reserved through budget, purchase order/delivery, reimbursement, and export job tables.
