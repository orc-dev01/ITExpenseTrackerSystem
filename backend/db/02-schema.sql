/*
  IT Expense - SQL Server schema

  Design goals:
  - Clear table names and relationships.
  - Simple GUID primary keys that the API can expose as strings.
  - Lookup tables for statuses/types so future phases can add values safely.
  - Current Phase 1 modules plus Phase 2/3 placeholders for budgets,
    purchasing, and reimbursements.
*/

USE ITExpense;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'app')
BEGIN
  EXEC(N'CREATE SCHEMA app AUTHORIZATION dbo;');
END;
GO

IF OBJECT_ID(N'app.ExpenseRequestNumberSeq', N'SO') IS NULL
BEGIN
  CREATE SEQUENCE app.ExpenseRequestNumberSeq
    AS INT
    START WITH 1
    INCREMENT BY 1;
END;
GO

IF OBJECT_ID(N'app.Roles', N'U') IS NULL
BEGIN
  CREATE TABLE app.Roles (
    RoleCode NVARCHAR(30) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    RoleName NVARCHAR(80) NOT NULL,
    Description NVARCHAR(250) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Roles_IsActive DEFAULT (1)
  );
END;
GO

IF OBJECT_ID(N'app.RequestTypes', N'U') IS NULL
BEGIN
  CREATE TABLE app.RequestTypes (
    RequestTypeCode NVARCHAR(30) NOT NULL CONSTRAINT PK_RequestTypes PRIMARY KEY,
    RequestTypeName NVARCHAR(80) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_RequestTypes_IsActive DEFAULT (1)
  );
END;
GO

IF OBJECT_ID(N'app.RequestStatuses', N'U') IS NULL
BEGIN
  CREATE TABLE app.RequestStatuses (
    StatusCode NVARCHAR(40) NOT NULL CONSTRAINT PK_RequestStatuses PRIMARY KEY,
    StatusName NVARCHAR(80) NOT NULL,
    SortOrder INT NOT NULL,
    IsTerminal BIT NOT NULL CONSTRAINT DF_RequestStatuses_IsTerminal DEFAULT (0)
  );
END;
GO

IF OBJECT_ID(N'app.DisbursementStatuses', N'U') IS NULL
BEGIN
  CREATE TABLE app.DisbursementStatuses (
    DisbursementStatusCode NVARCHAR(30) NOT NULL CONSTRAINT PK_DisbursementStatuses PRIMARY KEY,
    StatusName NVARCHAR(80) NOT NULL,
    SortOrder INT NOT NULL
  );
END;
GO

IF OBJECT_ID(N'app.Departments', N'U') IS NULL
BEGIN
  CREATE TABLE app.Departments (
    DepartmentId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Departments_DepartmentId DEFAULT NEWID(),
    Code NVARCHAR(30) NOT NULL,
    Name NVARCHAR(120) NOT NULL,
    ManagerUserId UNIQUEIDENTIFIER NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Departments_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Departments_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Departments_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Departments PRIMARY KEY (DepartmentId),
    CONSTRAINT UQ_Departments_Code UNIQUE (Code),
    CONSTRAINT UQ_Departments_Name UNIQUE (Name)
  );
END;
GO

IF OBJECT_ID(N'app.CostCenters', N'U') IS NULL
BEGIN
  CREATE TABLE app.CostCenters (
    CostCenterId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CostCenters_CostCenterId DEFAULT NEWID(),
    Code NVARCHAR(40) NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    Description NVARCHAR(200) NOT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CostCenters_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_CostCenters_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_CostCenters_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_CostCenters PRIMARY KEY (CostCenterId),
    CONSTRAINT UQ_CostCenters_Code UNIQUE (Code),
    CONSTRAINT FK_CostCenters_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId)
  );
END;
GO

IF OBJECT_ID(N'app.CoaAccounts', N'U') IS NULL
BEGIN
  CREATE TABLE app.CoaAccounts (
    CoaAccountId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_CoaAccounts_CoaAccountId DEFAULT NEWID(),
    Code NVARCHAR(40) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    ParentName NVARCHAR(120) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_CoaAccounts_IsActive DEFAULT (1),
    CONSTRAINT PK_CoaAccounts PRIMARY KEY (CoaAccountId),
    CONSTRAINT UQ_CoaAccounts_Code UNIQUE (Code)
  );
END;
GO

IF OBJECT_ID(N'app.ExpenseCategories', N'U') IS NULL
BEGIN
  CREATE TABLE app.ExpenseCategories (
    CategoryId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ExpenseCategories_CategoryId DEFAULT NEWID(),
    Code NVARCHAR(30) NOT NULL,
    Name NVARCHAR(120) NOT NULL,
    CoaAccountId UNIQUEIDENTIFIER NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_ExpenseCategories_IsActive DEFAULT (1),
    CONSTRAINT PK_ExpenseCategories PRIMARY KEY (CategoryId),
    CONSTRAINT UQ_ExpenseCategories_Code UNIQUE (Code),
    CONSTRAINT UQ_ExpenseCategories_Name UNIQUE (Name),
    CONSTRAINT FK_ExpenseCategories_CoaAccounts FOREIGN KEY (CoaAccountId) REFERENCES app.CoaAccounts(CoaAccountId)
  );
END;
GO

IF OBJECT_ID(N'app.Projects', N'U') IS NULL
BEGIN
  CREATE TABLE app.Projects (
    ProjectId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Projects_ProjectId DEFAULT NEWID(),
    Code NVARCHAR(40) NOT NULL,
    Name NVARCHAR(150) NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NULL,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_Projects_Status DEFAULT N'Active',
    IsActive BIT NOT NULL CONSTRAINT DF_Projects_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Projects PRIMARY KEY (ProjectId),
    CONSTRAINT UQ_Projects_Code UNIQUE (Code),
    CONSTRAINT FK_Projects_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId)
  );
END;
GO

IF OBJECT_ID(N'app.Users', N'U') IS NULL
BEGIN
  CREATE TABLE app.Users (
    UserId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_UserId DEFAULT NEWID(),
    Email NVARCHAR(180) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    LastLoginAt DATETIME2(0) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY (UserId),
    CONSTRAINT UQ_Users_Email UNIQUE (Email),
    CONSTRAINT FK_Users_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId)
  );
END;
GO

IF COL_LENGTH(N'app.Departments', N'ManagerUserId') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Departments_ManagerUser')
BEGIN
  ALTER TABLE app.Departments
    ADD CONSTRAINT FK_Departments_ManagerUser FOREIGN KEY (ManagerUserId) REFERENCES app.Users(UserId);
END;
GO

IF OBJECT_ID(N'app.UserRoles', N'U') IS NULL
BEGIN
  CREATE TABLE app.UserRoles (
    UserId UNIQUEIDENTIFIER NOT NULL,
    RoleCode NVARCHAR(30) NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_UserRoles_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleCode),
    CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES app.Users(UserId),
    CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleCode) REFERENCES app.Roles(RoleCode)
  );
END;
GO

IF OBJECT_ID(N'app.ApprovalMatrixRules', N'U') IS NULL
BEGIN
  CREATE TABLE app.ApprovalMatrixRules (
    ApprovalMatrixRuleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ApprovalMatrixRules_Id DEFAULT NEWID(),
    DepartmentId UNIQUEIDENTIFIER NULL,
    CategoryId UNIQUEIDENTIFIER NULL,
    AmountMin DECIMAL(18,2) NOT NULL CONSTRAINT DF_ApprovalMatrixRules_AmountMin DEFAULT (0),
    AmountMax DECIMAL(18,2) NULL,
    EndorserRoleCode NVARCHAR(30) NOT NULL,
    ApproverRoleCode NVARCHAR(30) NOT NULL,
    SecondaryApproverRoleCode NVARCHAR(30) NULL,
    IsEmergencyRoute BIT NOT NULL CONSTRAINT DF_ApprovalMatrixRules_IsEmergencyRoute DEFAULT (0),
    IsActive BIT NOT NULL CONSTRAINT DF_ApprovalMatrixRules_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ApprovalMatrixRules_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ApprovalMatrixRules_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ApprovalMatrixRules PRIMARY KEY (ApprovalMatrixRuleId),
    CONSTRAINT CK_ApprovalMatrixRules_AmountRange CHECK (AmountMax IS NULL OR AmountMax >= AmountMin),
    CONSTRAINT FK_ApprovalMatrixRules_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId),
    CONSTRAINT FK_ApprovalMatrixRules_Categories FOREIGN KEY (CategoryId) REFERENCES app.ExpenseCategories(CategoryId),
    CONSTRAINT FK_ApprovalMatrixRules_EndorserRole FOREIGN KEY (EndorserRoleCode) REFERENCES app.Roles(RoleCode),
    CONSTRAINT FK_ApprovalMatrixRules_ApproverRole FOREIGN KEY (ApproverRoleCode) REFERENCES app.Roles(RoleCode),
    CONSTRAINT FK_ApprovalMatrixRules_SecondaryRole FOREIGN KEY (SecondaryApproverRoleCode) REFERENCES app.Roles(RoleCode)
  );
END;
GO

IF OBJECT_ID(N'app.ExpenseRequests', N'U') IS NULL
BEGIN
  CREATE TABLE app.ExpenseRequests (
    RequestId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ExpenseRequests_RequestId DEFAULT NEWID(),
    RequestNumber NVARCHAR(40) NULL,
    Title NVARCHAR(160) NOT NULL,
    Justification NVARCHAR(1200) NOT NULL,
    RequesterUserId UNIQUEIDENTIFIER NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    CostCenterId UNIQUEIDENTIFIER NOT NULL,
    ProjectId UNIQUEIDENTIFIER NULL,
    RequestTypeCode NVARCHAR(30) NOT NULL,
    StatusCode NVARCHAR(40) NOT NULL,
    DisbursementStatusCode NVARCHAR(30) NULL,
    Urgent BIT NOT NULL CONSTRAINT DF_ExpenseRequests_Urgent DEFAULT (0),
    TotalAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_ExpenseRequests_TotalAmount DEFAULT (0),
    Remarks NVARCHAR(1000) NULL,
    SubmittedAt DATETIME2(0) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ExpenseRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ExpenseRequests_UpdatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT PK_ExpenseRequests PRIMARY KEY (RequestId),
    CONSTRAINT FK_ExpenseRequests_Requester FOREIGN KEY (RequesterUserId) REFERENCES app.Users(UserId),
    CONSTRAINT FK_ExpenseRequests_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId),
    CONSTRAINT FK_ExpenseRequests_CostCenters FOREIGN KEY (CostCenterId) REFERENCES app.CostCenters(CostCenterId),
    CONSTRAINT FK_ExpenseRequests_Projects FOREIGN KEY (ProjectId) REFERENCES app.Projects(ProjectId),
    CONSTRAINT FK_ExpenseRequests_RequestTypes FOREIGN KEY (RequestTypeCode) REFERENCES app.RequestTypes(RequestTypeCode),
    CONSTRAINT FK_ExpenseRequests_RequestStatuses FOREIGN KEY (StatusCode) REFERENCES app.RequestStatuses(StatusCode),
    CONSTRAINT FK_ExpenseRequests_DisbursementStatuses FOREIGN KEY (DisbursementStatusCode) REFERENCES app.DisbursementStatuses(DisbursementStatusCode)
  );
END;
GO

IF OBJECT_ID(N'app.RequestLineItems', N'U') IS NULL
BEGIN
  CREATE TABLE app.RequestLineItems (
    LineItemId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RequestLineItems_LineItemId DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    CategoryId UNIQUEIDENTIFIER NOT NULL,
    Description NVARCHAR(250) NOT NULL,
    Vendor NVARCHAR(160) NULL,
    Quantity DECIMAL(18,2) NOT NULL,
    UnitAmount DECIMAL(18,2) NOT NULL,
    LineTotal AS (CONVERT(DECIMAL(18,2), Quantity * UnitAmount)) PERSISTED,
    SellerLink NVARCHAR(1000) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_RequestLineItems_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_RequestLineItems_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RequestLineItems PRIMARY KEY (LineItemId),
    CONSTRAINT CK_RequestLineItems_Quantity CHECK (Quantity > 0),
    CONSTRAINT CK_RequestLineItems_UnitAmount CHECK (UnitAmount > 0),
    CONSTRAINT FK_RequestLineItems_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId) ON DELETE CASCADE,
    CONSTRAINT FK_RequestLineItems_Categories FOREIGN KEY (CategoryId) REFERENCES app.ExpenseCategories(CategoryId)
  );
END;
GO

IF OBJECT_ID(N'app.RequestLineItemLinks', N'U') IS NULL
BEGIN
  CREATE TABLE app.RequestLineItemLinks (
    LinkId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RequestLineItemLinks_LinkId DEFAULT NEWID(),
    LineItemId UNIQUEIDENTIFIER NOT NULL,
    LinkType NVARCHAR(30) NOT NULL CONSTRAINT DF_RequestLineItemLinks_LinkType DEFAULT N'Other',
    Url NVARCHAR(1000) NOT NULL,
    Notes NVARCHAR(300) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_RequestLineItemLinks_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_RequestLineItemLinks PRIMARY KEY (LinkId),
    CONSTRAINT FK_RequestLineItemLinks_LineItems FOREIGN KEY (LineItemId) REFERENCES app.RequestLineItems(LineItemId) ON DELETE CASCADE
  );
END;
GO

IF OBJECT_ID(N'app.Attachments', N'U') IS NULL
BEGIN
  CREATE TABLE app.Attachments (
    AttachmentId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Attachments_AttachmentId DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    LineItemId UNIQUEIDENTIFIER NULL,
    OriginalFileName NVARCHAR(260) NOT NULL,
    StoredFileName NVARCHAR(260) NOT NULL,
    ContentType NVARCHAR(120) NOT NULL,
    FileSizeBytes INT NOT NULL,
    StoragePath NVARCHAR(1000) NOT NULL,
    UploadedByUserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Attachments_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Attachments PRIMARY KEY (AttachmentId),
    CONSTRAINT CK_Attachments_FileSize CHECK (FileSizeBytes > 0),
    CONSTRAINT FK_Attachments_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId),
    CONSTRAINT FK_Attachments_LineItems FOREIGN KEY (LineItemId) REFERENCES app.RequestLineItems(LineItemId),
    CONSTRAINT FK_Attachments_UploadedBy FOREIGN KEY (UploadedByUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF OBJECT_ID(N'app.WorkflowLogs', N'U') IS NULL
BEGIN
  CREATE TABLE app.WorkflowLogs (
    WorkflowLogId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_WorkflowLogs_WorkflowLogId DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NULL,
    RequestNumberSnapshot NVARCHAR(40) NOT NULL,
    ActorUserId UNIQUEIDENTIFIER NULL,
    ActorRole NVARCHAR(120) NOT NULL,
    Action NVARCHAR(80) NOT NULL,
    Remarks NVARCHAR(1000) NULL,
    IpAddress NVARCHAR(60) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WorkflowLogs_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_WorkflowLogs PRIMARY KEY (WorkflowLogId),
    CONSTRAINT FK_WorkflowLogs_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId),
    CONSTRAINT FK_WorkflowLogs_Actor FOREIGN KEY (ActorUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF OBJECT_ID(N'app.Notifications', N'U') IS NULL
BEGIN
  CREATE TABLE app.Notifications (
    NotificationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Notifications_NotificationId DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    RequestId UNIQUEIDENTIFIER NULL,
    RequestNumberSnapshot NVARCHAR(40) NULL,
    NotificationType NVARCHAR(80) NOT NULL,
    Subject NVARCHAR(180) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    IsUnread BIT NOT NULL CONSTRAINT DF_Notifications_IsUnread DEFAULT (1),
    ReadAt DATETIME2(0) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Notifications PRIMARY KEY (NotificationId),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES app.Users(UserId),
    CONSTRAINT FK_Notifications_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId)
  );
END;
GO

IF OBJECT_ID(N'app.Budgets', N'U') IS NULL
BEGIN
  CREATE TABLE app.Budgets (
    BudgetId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Budgets_BudgetId DEFAULT NEWID(),
    PeriodCode NVARCHAR(30) NOT NULL,
    DepartmentId UNIQUEIDENTIFIER NOT NULL,
    CategoryId UNIQUEIDENTIFIER NOT NULL,
    CostCenterId UNIQUEIDENTIFIER NOT NULL,
    ProjectId UNIQUEIDENTIFIER NULL,
    BudgetAmount DECIMAL(18,2) NOT NULL,
    ActualAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Budgets_ActualAmount DEFAULT (0),
    AlertThresholdPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_Budgets_AlertThreshold DEFAULT (90),
    IsActive BIT NOT NULL CONSTRAINT DF_Budgets_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Budgets_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Budgets_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Budgets PRIMARY KEY (BudgetId),
    CONSTRAINT UQ_Budgets_Line UNIQUE (PeriodCode, DepartmentId, CategoryId, CostCenterId, ProjectId),
    CONSTRAINT CK_Budgets_Amounts CHECK (BudgetAmount >= 0 AND ActualAmount >= 0),
    CONSTRAINT FK_Budgets_Departments FOREIGN KEY (DepartmentId) REFERENCES app.Departments(DepartmentId),
    CONSTRAINT FK_Budgets_Categories FOREIGN KEY (CategoryId) REFERENCES app.ExpenseCategories(CategoryId),
    CONSTRAINT FK_Budgets_CostCenters FOREIGN KEY (CostCenterId) REFERENCES app.CostCenters(CostCenterId),
    CONSTRAINT FK_Budgets_Projects FOREIGN KEY (ProjectId) REFERENCES app.Projects(ProjectId)
  );
END;
GO

IF OBJECT_ID(N'app.BudgetTransactions', N'U') IS NULL
BEGIN
  CREATE TABLE app.BudgetTransactions (
    BudgetTransactionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_BudgetTransactions_Id DEFAULT NEWID(),
    BudgetId UNIQUEIDENTIFIER NOT NULL,
    RequestId UNIQUEIDENTIFIER NULL,
    TransactionType NVARCHAR(30) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    Notes NVARCHAR(300) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_BudgetTransactions_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_BudgetTransactions PRIMARY KEY (BudgetTransactionId),
    CONSTRAINT CK_BudgetTransactions_Type CHECK (TransactionType IN (N'Commit', N'Release', N'Actual', N'Adjustment')),
    CONSTRAINT FK_BudgetTransactions_Budgets FOREIGN KEY (BudgetId) REFERENCES app.Budgets(BudgetId),
    CONSTRAINT FK_BudgetTransactions_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId)
  );
END;
GO

IF OBJECT_ID(N'app.DisbursementRecords', N'U') IS NULL
BEGIN
  CREATE TABLE app.DisbursementRecords (
    DisbursementRecordId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_DisbursementRecords_Id DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    DisbursementStatusCode NVARCHAR(30) NOT NULL,
    PaymentReference NVARCHAR(120) NULL,
    ProcessedByUserId UNIQUEIDENTIFIER NULL,
    ProcessedAt DATETIME2(0) NULL,
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_DisbursementRecords_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_DisbursementRecords_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_DisbursementRecords PRIMARY KEY (DisbursementRecordId),
    CONSTRAINT UQ_DisbursementRecords_Request UNIQUE (RequestId),
    CONSTRAINT FK_DisbursementRecords_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId),
    CONSTRAINT FK_DisbursementRecords_Statuses FOREIGN KEY (DisbursementStatusCode) REFERENCES app.DisbursementStatuses(DisbursementStatusCode),
    CONSTRAINT FK_DisbursementRecords_ProcessedBy FOREIGN KEY (ProcessedByUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF OBJECT_ID(N'app.PurchaseOrders', N'U') IS NULL
BEGIN
  CREATE TABLE app.PurchaseOrders (
    PurchaseOrderId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PurchaseOrders_Id DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    PoNumber NVARCHAR(60) NOT NULL,
    VendorName NVARCHAR(160) NOT NULL,
    Status NVARCHAR(40) NOT NULL CONSTRAINT DF_PurchaseOrders_Status DEFAULT N'Draft',
    ExpectedDeliveryDate DATE NULL,
    CreatedByUserId UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_PurchaseOrders_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_PurchaseOrders_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PurchaseOrders PRIMARY KEY (PurchaseOrderId),
    CONSTRAINT UQ_PurchaseOrders_PoNumber UNIQUE (PoNumber),
    CONSTRAINT FK_PurchaseOrders_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId),
    CONSTRAINT FK_PurchaseOrders_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF OBJECT_ID(N'app.PurchaseOrderItems', N'U') IS NULL
BEGIN
  CREATE TABLE app.PurchaseOrderItems (
    PurchaseOrderItemId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PurchaseOrderItems_Id DEFAULT NEWID(),
    PurchaseOrderId UNIQUEIDENTIFIER NOT NULL,
    LineItemId UNIQUEIDENTIFIER NULL,
    Description NVARCHAR(250) NOT NULL,
    Quantity DECIMAL(18,2) NOT NULL,
    UnitAmount DECIMAL(18,2) NOT NULL,
    LineTotal AS (CONVERT(DECIMAL(18,2), Quantity * UnitAmount)) PERSISTED,
    CONSTRAINT PK_PurchaseOrderItems PRIMARY KEY (PurchaseOrderItemId),
    CONSTRAINT FK_PurchaseOrderItems_PurchaseOrders FOREIGN KEY (PurchaseOrderId) REFERENCES app.PurchaseOrders(PurchaseOrderId) ON DELETE CASCADE,
    CONSTRAINT FK_PurchaseOrderItems_LineItems FOREIGN KEY (LineItemId) REFERENCES app.RequestLineItems(LineItemId)
  );
END;
GO

IF OBJECT_ID(N'app.Deliveries', N'U') IS NULL
BEGIN
  CREATE TABLE app.Deliveries (
    DeliveryId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Deliveries_Id DEFAULT NEWID(),
    PurchaseOrderId UNIQUEIDENTIFIER NOT NULL,
    DeliveryStatus NVARCHAR(40) NOT NULL CONSTRAINT DF_Deliveries_Status DEFAULT N'Pending',
    ReceivedByUserId UNIQUEIDENTIFIER NULL,
    ReceivedAt DATETIME2(0) NULL,
    Notes NVARCHAR(500) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Deliveries_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Deliveries_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Deliveries PRIMARY KEY (DeliveryId),
    CONSTRAINT FK_Deliveries_PurchaseOrders FOREIGN KEY (PurchaseOrderId) REFERENCES app.PurchaseOrders(PurchaseOrderId),
    CONSTRAINT FK_Deliveries_ReceivedBy FOREIGN KEY (ReceivedByUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF OBJECT_ID(N'app.ReimbursementDetails', N'U') IS NULL
BEGIN
  CREATE TABLE app.ReimbursementDetails (
    ReimbursementDetailId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ReimbursementDetails_Id DEFAULT NEWID(),
    RequestId UNIQUEIDENTIFIER NOT NULL,
    VendorName NVARCHAR(160) NOT NULL,
    ReceiptDate DATE NOT NULL,
    PaymentStatus NVARCHAR(40) NOT NULL CONSTRAINT DF_ReimbursementDetails_PaymentStatus DEFAULT N'Pending',
    PaidAt DATETIME2(0) NULL,
    PaymentReference NVARCHAR(120) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ReimbursementDetails_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ReimbursementDetails_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ReimbursementDetails PRIMARY KEY (ReimbursementDetailId),
    CONSTRAINT UQ_ReimbursementDetails_Request UNIQUE (RequestId),
    CONSTRAINT FK_ReimbursementDetails_Requests FOREIGN KEY (RequestId) REFERENCES app.ExpenseRequests(RequestId)
  );
END;
GO

IF OBJECT_ID(N'app.ExportJobs', N'U') IS NULL
BEGIN
  CREATE TABLE app.ExportJobs (
    ExportJobId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ExportJobs_Id DEFAULT NEWID(),
    ExportType NVARCHAR(50) NOT NULL,
    RequestedByUserId UNIQUEIDENTIFIER NOT NULL,
    CriteriaJson NVARCHAR(MAX) NULL,
    Status NVARCHAR(40) NOT NULL CONSTRAINT DF_ExportJobs_Status DEFAULT N'Queued',
    OutputPath NVARCHAR(1000) NULL,
    ErrorMessage NVARCHAR(1000) NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ExportJobs_CreatedAt DEFAULT SYSUTCDATETIME(),
    CompletedAt DATETIME2(0) NULL,
    CONSTRAINT PK_ExportJobs PRIMARY KEY (ExportJobId),
    CONSTRAINT FK_ExportJobs_RequestedBy FOREIGN KEY (RequestedByUserId) REFERENCES app.Users(UserId)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Users_DepartmentId' AND object_id = OBJECT_ID(N'app.Users'))
  CREATE INDEX IX_Users_DepartmentId ON app.Users(DepartmentId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_CostCenters_DepartmentId' AND object_id = OBJECT_ID(N'app.CostCenters'))
  CREATE INDEX IX_CostCenters_DepartmentId ON app.CostCenters(DepartmentId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ExpenseRequests_Requester_Status' AND object_id = OBJECT_ID(N'app.ExpenseRequests'))
  CREATE INDEX IX_ExpenseRequests_Requester_Status ON app.ExpenseRequests(RequesterUserId, StatusCode);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_ExpenseRequests_RequestNumber' AND object_id = OBJECT_ID(N'app.ExpenseRequests'))
  CREATE UNIQUE INDEX UX_ExpenseRequests_RequestNumber
    ON app.ExpenseRequests(RequestNumber)
    WHERE RequestNumber IS NOT NULL AND RequestNumber <> N'DRAFT';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ExpenseRequests_Status_UpdatedAt' AND object_id = OBJECT_ID(N'app.ExpenseRequests'))
  CREATE INDEX IX_ExpenseRequests_Status_UpdatedAt ON app.ExpenseRequests(StatusCode, UpdatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_ExpenseRequests_Department_CategoryDate' AND object_id = OBJECT_ID(N'app.ExpenseRequests'))
  CREATE INDEX IX_ExpenseRequests_Department_CategoryDate ON app.ExpenseRequests(DepartmentId, CreatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RequestLineItems_RequestId' AND object_id = OBJECT_ID(N'app.RequestLineItems'))
  CREATE INDEX IX_RequestLineItems_RequestId ON app.RequestLineItems(RequestId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowLogs_RequestId_CreatedAt' AND object_id = OBJECT_ID(N'app.WorkflowLogs'))
  CREATE INDEX IX_WorkflowLogs_RequestId_CreatedAt ON app.WorkflowLogs(RequestId, CreatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Notifications_User_Unread_CreatedAt' AND object_id = OBJECT_ID(N'app.Notifications'))
  CREATE INDEX IX_Notifications_User_Unread_CreatedAt ON app.Notifications(UserId, IsUnread, CreatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Budgets_Period_Department' AND object_id = OBJECT_ID(N'app.Budgets'))
  CREATE INDEX IX_Budgets_Period_Department ON app.Budgets(PeriodCode, DepartmentId);
GO
