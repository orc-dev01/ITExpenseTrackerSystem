/*
  IT Expense - remove optional demo/UAT accounts and their request data

  Run this before handing the internal production database to real users if
  the demo users from 06-seed-demo-users.sql were ever inserted.
*/

USE ITExpense;
GO

DECLARE @DemoUsers TABLE (UserId UNIQUEIDENTIFIER PRIMARY KEY);
DECLARE @DemoRequests TABLE (RequestId UNIQUEIDENTIFIER PRIMARY KEY);

INSERT INTO @DemoUsers (UserId)
SELECT UserId
FROM app.Users
WHERE Email IN (
  N'requester@test.com',
  N'endorser@test.com',
  N'approver@test.com',
  N'finance@test.com',
  N'admin@test.com',
  N'super@test.com'
);

INSERT INTO @DemoRequests (RequestId)
SELECT RequestId
FROM app.ExpenseRequests
WHERE RequesterUserId IN (SELECT UserId FROM @DemoUsers);

DELETE FROM app.Notifications
WHERE UserId IN (SELECT UserId FROM @DemoUsers)
   OR RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE FROM app.WorkflowLogs
WHERE ActorUserId IN (SELECT UserId FROM @DemoUsers)
   OR RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE FROM app.ExportJobs
WHERE RequestedByUserId IN (SELECT UserId FROM @DemoUsers);

DELETE FROM app.Attachments
WHERE UploadedByUserId IN (SELECT UserId FROM @DemoUsers)
   OR RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE poi
FROM app.PurchaseOrderItems poi
WHERE poi.PurchaseOrderId IN (
    SELECT PurchaseOrderId
    FROM app.PurchaseOrders
    WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
  )
  OR poi.LineItemId IN (
    SELECT LineItemId
    FROM app.RequestLineItems
    WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
  );

DELETE d
FROM app.Deliveries d
WHERE d.PurchaseOrderId IN (
  SELECT PurchaseOrderId
  FROM app.PurchaseOrders
  WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
);

DELETE FROM app.PurchaseOrders
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
   OR CreatedByUserId IN (SELECT UserId FROM @DemoUsers);

DELETE FROM app.DisbursementRecords
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
   OR ProcessedByUserId IN (SELECT UserId FROM @DemoUsers);

DELETE FROM app.BudgetTransactions
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE FROM app.ReimbursementDetails
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE ril
FROM app.RequestLineItemLinks ril
WHERE ril.LineItemId IN (
  SELECT LineItemId
  FROM app.RequestLineItems
  WHERE RequestId IN (SELECT RequestId FROM @DemoRequests)
);

DELETE FROM app.RequestLineItems
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE FROM app.ExpenseRequests
WHERE RequestId IN (SELECT RequestId FROM @DemoRequests);

DELETE FROM app.UserRoles
WHERE UserId IN (SELECT UserId FROM @DemoUsers);

DELETE FROM app.Users
WHERE UserId IN (SELECT UserId FROM @DemoUsers);
GO
