/*
  IT Expense - migration for databases created before the backend SQL wiring.

  Run this once if you already ran 01/02/03 before this file existed.
  It makes draft requests production-friendly by allowing RequestNumber to be
  NULL for drafts and enforcing uniqueness only for real request numbers.
*/

USE ITExpense;
GO

DECLARE @constraintName SYSNAME;

SELECT @constraintName = kc.name
FROM sys.key_constraints kc
INNER JOIN sys.index_columns ic
  ON ic.object_id = kc.parent_object_id
 AND ic.index_id = kc.unique_index_id
INNER JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE kc.parent_object_id = OBJECT_ID(N'app.ExpenseRequests')
  AND kc.type = N'UQ'
  AND c.name = N'RequestNumber';

IF @constraintName IS NOT NULL
BEGIN
  DECLARE @sql NVARCHAR(MAX) = N'ALTER TABLE app.ExpenseRequests DROP CONSTRAINT ' + QUOTENAME(@constraintName) + N';';
  EXEC sys.sp_executesql @sql;
END;
GO

IF EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = OBJECT_ID(N'app.ExpenseRequests')
    AND name = N'RequestNumber'
    AND is_nullable = 0
)
BEGIN
  ALTER TABLE app.ExpenseRequests ALTER COLUMN RequestNumber NVARCHAR(40) NULL;
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UX_ExpenseRequests_RequestNumber'
    AND object_id = OBJECT_ID(N'app.ExpenseRequests')
)
BEGIN
  CREATE UNIQUE INDEX UX_ExpenseRequests_RequestNumber
    ON app.ExpenseRequests(RequestNumber)
    WHERE RequestNumber IS NOT NULL AND RequestNumber <> N'DRAFT';
END;
GO

MERGE app.RequestStatuses AS target
USING (VALUES
  (N'Draft', N'Draft', 10, 0),
  (N'Submitted', N'Submitted', 20, 0),
  (N'PendingAssignment', N'Pending Assignment', 30, 0),
  (N'Returned', N'Returned', 40, 0),
  (N'PendingEndorsement', N'Pending Endorsement', 50, 0),
  (N'Endorsed', N'Endorsed', 60, 0),
  (N'PendingApproval', N'Pending Approval', 70, 0),
  (N'Approved', N'Approved', 80, 0),
  (N'Rejected', N'Rejected', 90, 1),
  (N'Cancelled', N'Cancelled', 100, 1),
  (N'Closed', N'Closed', 110, 1)
) AS source(StatusCode, StatusName, SortOrder, IsTerminal)
ON target.StatusCode = source.StatusCode
WHEN MATCHED THEN
  UPDATE SET StatusName = source.StatusName,
             SortOrder = source.SortOrder,
             IsTerminal = source.IsTerminal
WHEN NOT MATCHED THEN
  INSERT (StatusCode, StatusName, SortOrder, IsTerminal)
  VALUES (source.StatusCode, source.StatusName, source.SortOrder, source.IsTerminal);
GO
