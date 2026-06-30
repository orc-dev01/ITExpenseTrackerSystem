/*
  IT Expense - reset local app login password

  Run this in SSMS while connected with Windows Authentication.
  It makes the SQL login match the password in the local .env file.
*/

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'it_expense_app')
BEGIN
  CREATE LOGIN it_expense_app
    WITH PASSWORD = N'ITExpense_ChangeMe_2026!Strong',
    CHECK_POLICY = OFF,
    CHECK_EXPIRATION = OFF;
END;
ELSE
BEGIN
  ALTER LOGIN it_expense_app
    WITH PASSWORD = N'ITExpense_ChangeMe_2026!Strong',
    CHECK_POLICY = OFF,
    CHECK_EXPIRATION = OFF,
    UNLOCK;
END;
GO

USE ITExpense;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'it_expense_app')
BEGIN
  CREATE USER it_expense_app FOR LOGIN it_expense_app;
END;
GO

IF IS_ROLEMEMBER(N'db_datareader', N'it_expense_app') = 0
BEGIN
  ALTER ROLE db_datareader ADD MEMBER it_expense_app;
END;

IF IS_ROLEMEMBER(N'db_datawriter', N'it_expense_app') = 0
BEGIN
  ALTER ROLE db_datawriter ADD MEMBER it_expense_app;
END;
GO
