/*
  IT Expense - baseline reference data

  Run after 01-create-database.sql and 02-schema.sql.
  This seed is safe to rerun.
*/

USE ITExpense;
GO

MERGE app.Roles AS target
USING (VALUES
  (N'Requester', N'Requester', N'Creates and tracks IT expense requests.'),
  (N'Endorser', N'Endorser', N'Reviews department requests before approval.'),
  (N'Approver', N'Approver', N'Performs final request approval.'),
  (N'FinanceViewer', N'Finance Viewer', N'Processes approved expenses and views finance reports.'),
  (N'Admin', N'Admin', N'Manages setup, users, and reference data.')
) AS source(RoleCode, RoleName, Description)
ON target.RoleCode = source.RoleCode
WHEN MATCHED THEN UPDATE SET RoleName = source.RoleName, Description = source.Description, IsActive = 1
WHEN NOT MATCHED THEN INSERT (RoleCode, RoleName, Description) VALUES (source.RoleCode, source.RoleName, source.Description);
GO

MERGE app.RequestTypes AS target
USING (VALUES
  (N'Expense', N'Expense'),
  (N'Purchase', N'Purchase'),
  (N'Reimbursement', N'Reimbursement')
) AS source(RequestTypeCode, RequestTypeName)
ON target.RequestTypeCode = source.RequestTypeCode
WHEN MATCHED THEN UPDATE SET RequestTypeName = source.RequestTypeName, IsActive = 1
WHEN NOT MATCHED THEN INSERT (RequestTypeCode, RequestTypeName) VALUES (source.RequestTypeCode, source.RequestTypeName);
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
WHEN MATCHED THEN UPDATE SET StatusName = source.StatusName, SortOrder = source.SortOrder, IsTerminal = source.IsTerminal
WHEN NOT MATCHED THEN INSERT (StatusCode, StatusName, SortOrder, IsTerminal) VALUES (source.StatusCode, source.StatusName, source.SortOrder, source.IsTerminal);
GO

MERGE app.DisbursementStatuses AS target
USING (VALUES
  (N'Pending', N'Pending', 10),
  (N'InProcess', N'In Process', 20),
  (N'Processed', N'Processed', 30),
  (N'OnHold', N'On Hold', 40)
) AS source(DisbursementStatusCode, StatusName, SortOrder)
ON target.DisbursementStatusCode = source.DisbursementStatusCode
WHEN MATCHED THEN UPDATE SET StatusName = source.StatusName, SortOrder = source.SortOrder
WHEN NOT MATCHED THEN INSERT (DisbursementStatusCode, StatusName, SortOrder) VALUES (source.DisbursementStatusCode, source.StatusName, source.SortOrder);
GO

MERGE app.Departments AS target
USING (VALUES
  (N'ITOPS', N'IT Operations'),
  (N'CYBER', N'Cybersecurity'),
  (N'INFRA', N'Infrastructure'),
  (N'FIN', N'Finance'),
  (N'IT', N'IT')
) AS source(Code, Name)
ON target.Code = source.Code
WHEN MATCHED THEN UPDATE SET Name = source.Name, IsActive = 1, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (Code, Name) VALUES (source.Code, source.Name);
GO

DECLARE @ItOps UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'ITOPS');
DECLARE @Cyber UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'CYBER');
DECLARE @Infra UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'INFRA');

MERGE app.CostCenters AS target
USING (VALUES
  (N'CC-IT-001', @ItOps, N'Service Desk and end-user support'),
  (N'CC-IT-002', @Cyber, N'Security tools and compliance'),
  (N'CC-IT-003', @Infra, N'Network, server, and cloud operations')
) AS source(Code, DepartmentId, Description)
ON target.Code = source.Code
WHEN MATCHED THEN UPDATE SET DepartmentId = source.DepartmentId, Description = source.Description, IsActive = 1, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (Code, DepartmentId, Description) VALUES (source.Code, source.DepartmentId, source.Description);
GO

MERGE app.CoaAccounts AS target
USING (VALUES
  (N'6100', N'IT Hardware Expense', N'Operating Expense'),
  (N'6200', N'IT Software Subscription', N'Operating Expense'),
  (N'6300', N'Cloud Services', N'Operating Expense')
) AS source(Code, Name, ParentName)
ON target.Code = source.Code
WHEN MATCHED THEN UPDATE SET Name = source.Name, ParentName = source.ParentName, IsActive = 1
WHEN NOT MATCHED THEN INSERT (Code, Name, ParentName) VALUES (source.Code, source.Name, source.ParentName);
GO

DECLARE @CoaHardware UNIQUEIDENTIFIER = (SELECT CoaAccountId FROM app.CoaAccounts WHERE Code = N'6100');
DECLARE @CoaSoftware UNIQUEIDENTIFIER = (SELECT CoaAccountId FROM app.CoaAccounts WHERE Code = N'6200');
DECLARE @CoaCloud UNIQUEIDENTIFIER = (SELECT CoaAccountId FROM app.CoaAccounts WHERE Code = N'6300');

MERGE app.ExpenseCategories AS target
USING (VALUES
  (N'HW', N'Hardware', @CoaHardware),
  (N'SW', N'Software', @CoaSoftware),
  (N'CLOUD', N'Cloud Services', @CoaCloud)
) AS source(Code, Name, CoaAccountId)
ON target.Code = source.Code
WHEN MATCHED THEN UPDATE SET Name = source.Name, CoaAccountId = source.CoaAccountId, IsActive = 1
WHEN NOT MATCHED THEN INSERT (Code, Name, CoaAccountId) VALUES (source.Code, source.Name, source.CoaAccountId);
GO

DECLARE @ItOps2 UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'ITOPS');
DECLARE @Cyber2 UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'CYBER');

MERGE app.Projects AS target
USING (VALUES
  (N'Q3-REFRESH', N'Q3 Device Refresh', @ItOps2, N'Active'),
  (N'SEC-2026', N'Security Hardening 2026', @Cyber2, N'Active')
) AS source(Code, Name, DepartmentId, Status)
ON target.Code = source.Code
WHEN MATCHED THEN UPDATE SET Name = source.Name, DepartmentId = source.DepartmentId, Status = source.Status, IsActive = 1, UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN INSERT (Code, Name, DepartmentId, Status) VALUES (source.Code, source.Name, source.DepartmentId, source.Status);
GO

DECLARE @ItOps4 UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'ITOPS');
DECLARE @Cyber4 UNIQUEIDENTIFIER = (SELECT DepartmentId FROM app.Departments WHERE Code = N'CYBER');
DECLARE @Hardware UNIQUEIDENTIFIER = (SELECT CategoryId FROM app.ExpenseCategories WHERE Code = N'HW');
DECLARE @Software UNIQUEIDENTIFIER = (SELECT CategoryId FROM app.ExpenseCategories WHERE Code = N'SW');

INSERT INTO app.ApprovalMatrixRules (DepartmentId, CategoryId, AmountMin, AmountMax, EndorserRoleCode, ApproverRoleCode, SecondaryApproverRoleCode)
SELECT @ItOps4, @Hardware, 0, 100000, N'Endorser', N'Approver', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM app.ApprovalMatrixRules
  WHERE DepartmentId = @ItOps4 AND CategoryId = @Hardware AND AmountMin = 0 AND AmountMax = 100000
);

INSERT INTO app.ApprovalMatrixRules (DepartmentId, CategoryId, AmountMin, AmountMax, EndorserRoleCode, ApproverRoleCode, SecondaryApproverRoleCode)
SELECT @ItOps4, @Hardware, 100001, NULL, N'Endorser', N'Approver', N'FinanceViewer'
WHERE NOT EXISTS (
  SELECT 1 FROM app.ApprovalMatrixRules
  WHERE DepartmentId = @ItOps4 AND CategoryId = @Hardware AND AmountMin = 100001 AND AmountMax IS NULL
);

INSERT INTO app.ApprovalMatrixRules (DepartmentId, CategoryId, AmountMin, AmountMax, EndorserRoleCode, ApproverRoleCode, SecondaryApproverRoleCode)
SELECT @Cyber4, @Software, 0, NULL, N'Endorser', N'Approver', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM app.ApprovalMatrixRules
  WHERE DepartmentId = @Cyber4 AND CategoryId = @Software AND AmountMin = 0 AND AmountMax IS NULL
);
GO
