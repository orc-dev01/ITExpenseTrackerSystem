/*
  IT Expense - SQL Server database bootstrap

  Run this script first as a SQL Server sysadmin or a login with permission
  to create databases and logins.
*/

IF DB_ID(N'ITExpense') IS NULL
BEGIN
  CREATE DATABASE ITExpense;
END;
GO

ALTER DATABASE ITExpense SET RECOVERY SIMPLE;
ALTER DATABASE ITExpense SET READ_COMMITTED_SNAPSHOT ON;
GO

USE ITExpense;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'app')
BEGIN
  EXEC(N'CREATE SCHEMA app AUTHORIZATION dbo;');
END;
GO

/*
  Optional application login.

  1. Replace CHANGE_THIS_STRONG_PASSWORD before running in production.
  2. If you use Windows Authentication, skip this block and grant the
     application pool/service account db_datareader/db_datawriter instead.
*/
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'it_expense_app')
BEGIN
  CREATE LOGIN it_expense_app
    WITH PASSWORD = N'ITExpense_ChangeMe_2026!Strong',
    CHECK_POLICY = ON,
    CHECK_EXPIRATION = ON;
END;
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
