/*
  IT Expense - create or update one internal user

  1. Generate a bcrypt hash:
     npm run hash:password -- "A-Strong-Temporary-Password"

  2. Paste the hash below.
  3. Set the user's email, full name, department code, and roles.
  4. Run this script once per real user.
*/

USE ITExpense;
GO

DECLARE @Email NVARCHAR(180) = N'user@company.local';
DECLARE @FullName NVARCHAR(160) = N'User Name';
DECLARE @DepartmentCode NVARCHAR(30) = N'ITOPS';
DECLARE @PasswordHash NVARCHAR(255) = N'PASTE_BCRYPT_HASH_HERE';

DECLARE @DepartmentId UNIQUEIDENTIFIER = (
  SELECT DepartmentId
  FROM app.Departments
  WHERE Code = @DepartmentCode
);

IF @DepartmentId IS NULL
BEGIN
  THROW 50001, 'Department code was not found.', 1;
END;

MERGE app.Users AS target
USING (
  SELECT @Email AS Email, @PasswordHash AS PasswordHash, @FullName AS FullName, @DepartmentId AS DepartmentId
) AS source
ON LOWER(target.Email) = LOWER(source.Email)
WHEN MATCHED THEN UPDATE SET
  PasswordHash = source.PasswordHash,
  FullName = source.FullName,
  DepartmentId = source.DepartmentId,
  IsActive = 1,
  UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
  INSERT (Email, PasswordHash, FullName, DepartmentId)
  VALUES (source.Email, source.PasswordHash, source.FullName, source.DepartmentId);

DECLARE @UserId UNIQUEIDENTIFIER = (
  SELECT UserId
  FROM app.Users
  WHERE LOWER(Email) = LOWER(@Email)
);

/*
  Keep only the roles this user should have.
  Valid roles: Requester, Endorser, Approver, FinanceViewer, Admin.
*/
DECLARE @Roles TABLE (RoleCode NVARCHAR(30) PRIMARY KEY);

INSERT INTO @Roles (RoleCode)
VALUES
  (N'Requester');

DELETE FROM app.UserRoles
WHERE UserId = @UserId
  AND RoleCode NOT IN (SELECT RoleCode FROM @Roles);

INSERT INTO app.UserRoles (UserId, RoleCode)
SELECT @UserId, r.RoleCode
FROM @Roles r
WHERE NOT EXISTS (
  SELECT 1
  FROM app.UserRoles existing
  WHERE existing.UserId = @UserId
    AND existing.RoleCode = r.RoleCode
);
GO
