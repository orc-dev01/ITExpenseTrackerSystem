/*
  IT Expense - optional demo/UAT users

  Do not run this for production data unless ALLOW_DEV_PASSWORDS=true is set
  temporarily for UAT. These users use the plain test password password123.
*/

USE ITExpense;
GO

DECLARE @ItOps UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'ITOPS');
DECLARE @Finance UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'FIN');
DECLARE @It UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'IT');

MERGE app.Users AS target
USING (VALUES
  (N'requester@test.com', N'DEV_ONLY_password123', N'Mia Santos', @ItOps),
  (N'endorser@test.com', N'DEV_ONLY_password123', N'Noel Tan', @ItOps),
  (N'approver@test.com', N'DEV_ONLY_password123', N'Ramon Cruz', @It),
  (N'finance@test.com', N'DEV_ONLY_password123', N'Paula Dizon', @Finance),
  (N'admin@test.com', N'DEV_ONLY_password123', N'Demo Admin', @It),
  (N'super@test.com', N'DEV_ONLY_password123', N'Super Tester', @It)
) AS source(Email, PasswordHash, FullName, DepartmentId)
ON target.Email = source.Email
WHEN MATCHED THEN UPDATE SET
  PasswordHash = source.PasswordHash,
  FullName = source.FullName,
  DepartmentId = source.DepartmentId,
  IsActive = 1,
  UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (Email, PasswordHash, FullName, DepartmentId)
  VALUES (source.Email, source.PasswordHash, source.FullName, source.DepartmentId);
GO

INSERT INTO app.UserRoles (UserId, RoleCode)
SELECT u.UserId, v.RoleCode
FROM app.Users u
CROSS APPLY (VALUES
  (CASE WHEN u.Email = N'requester@test.com' THEN N'Requester' END),
  (CASE WHEN u.Email = N'endorser@test.com' THEN N'Endorser' END),
  (CASE WHEN u.Email = N'approver@test.com' THEN N'Approver' END),
  (CASE WHEN u.Email = N'finance@test.com' THEN N'FinanceViewer' END),
  (CASE WHEN u.Email = N'admin@test.com' THEN N'Admin' END),
  (CASE WHEN u.Email = N'super@test.com' THEN N'Requester' END),
  (CASE WHEN u.Email = N'super@test.com' THEN N'Endorser' END),
  (CASE WHEN u.Email = N'super@test.com' THEN N'Approver' END),
  (CASE WHEN u.Email = N'super@test.com' THEN N'FinanceViewer' END),
  (CASE WHEN u.Email = N'super@test.com' THEN N'Admin' END)
) v(RoleCode)
WHERE v.RoleCode IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM app.UserRoles existing
    WHERE existing.UserId = u.UserId
      AND existing.RoleCode = v.RoleCode
  );
GO
