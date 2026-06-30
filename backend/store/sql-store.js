const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sql, query, transaction, txRequest } = require('../db/sql-server');

const state = {
  users: [],
  departments: [],
  costCenters: [],
  categories: [],
  projects: [],
  requests: [],
  auditLogs: [],
  attachments: [],
  notifications: []
};

function iso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function publicUser(user) {
  if (!user) {
    return null;
  }

  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT
        u.UserId AS id,
        u.Email AS email,
        u.PasswordHash AS passwordHash,
        u.FullName AS fullName,
        u.DepartmentId AS departmentId,
        d.Name AS department,
        STRING_AGG(ur.RoleCode, ',') WITHIN GROUP (ORDER BY ur.RoleCode) AS roles
      FROM app.Users u
      LEFT JOIN app.Departments d ON d.DepartmentId = u.DepartmentId
      LEFT JOIN app.UserRoles ur ON ur.UserId = u.UserId
      WHERE LOWER(u.Email) = LOWER(@email)
        AND u.IsActive = 1
      GROUP BY u.UserId, u.Email, u.PasswordHash, u.FullName, u.DepartmentId, d.Name;
    `,
    { email: [sql.NVarChar(180), String(email ?? '')] }
  );

  return mapUser(result.recordset[0]);
}

async function findUserById(id) {
  const result = await query(
    `
      SELECT
        u.UserId AS id,
        u.Email AS email,
        u.PasswordHash AS passwordHash,
        u.FullName AS fullName,
        u.DepartmentId AS departmentId,
        d.Name AS department,
        STRING_AGG(ur.RoleCode, ',') WITHIN GROUP (ORDER BY ur.RoleCode) AS roles
      FROM app.Users u
      LEFT JOIN app.Departments d ON d.DepartmentId = u.DepartmentId
      LEFT JOIN app.UserRoles ur ON ur.UserId = u.UserId
      WHERE u.UserId = TRY_CONVERT(uniqueidentifier, @id)
        AND u.IsActive = 1
      GROUP BY u.UserId, u.Email, u.PasswordHash, u.FullName, u.DepartmentId, d.Name;
    `,
    { id: [sql.NVarChar(80), String(id ?? '')] }
  );

  return mapUser(result.recordset[0]);
}

async function verifyPassword(user, password) {
  if (!user?.passwordHash) {
    return false;
  }

  if (user.passwordHash.startsWith('DEV_ONLY_')) {
    return user.passwordHash.replace('DEV_ONLY_', '') === password;
  }

  return bcrypt.compare(password, user.passwordHash);
}

async function findUsersByRole(role) {
  const result = await query(
    `
      SELECT
        u.UserId AS id,
        u.Email AS email,
        u.PasswordHash AS passwordHash,
        u.FullName AS fullName,
        u.DepartmentId AS departmentId,
        d.Name AS department,
        STRING_AGG(ur.RoleCode, ',') WITHIN GROUP (ORDER BY ur.RoleCode) AS roles
      FROM app.Users u
      LEFT JOIN app.Departments d ON d.DepartmentId = u.DepartmentId
      LEFT JOIN app.UserRoles ur ON ur.UserId = u.UserId
      WHERE u.IsActive = 1
        AND EXISTS (
          SELECT 1
          FROM app.UserRoles roleMatch
          WHERE roleMatch.UserId = u.UserId
            AND roleMatch.RoleCode = @role
        )
      GROUP BY u.UserId, u.Email, u.PasswordHash, u.FullName, u.DepartmentId, d.Name;
    `,
    { role: [sql.NVarChar(30), role] }
  );

  return result.recordset.map(mapUser);
}

async function listRequestsForUser(user) {
  const requests = await fetchRequests();
  return requests.filter((request) => userCanSeeRequest(user, request));
}

async function findRequest(id) {
  const requests = await fetchRequests(id);
  return requests[0] ?? null;
}

async function requestDashboardSummary(user) {
  const requests = await listRequestsForUser(user);
  const countsByStatus = requests.reduce((counts, request) => {
    counts[request.status] = (counts[request.status] ?? 0) + 1;
    return counts;
  }, {});
  const openStatuses = ['Draft', 'Returned', 'PendingEndorsement', 'PendingApproval', 'Approved'];
  const pendingStatuses = ['PendingEndorsement', 'PendingApproval'];

  return {
    total: requests.length,
    open: requests.filter((request) => openStatuses.includes(request.status)).length,
    pendingAction: requests.filter((request) => pendingStatuses.includes(request.status)).length,
    urgent: requests.filter((request) => request.urgent).length,
    approved: countsByStatus.Approved ?? 0,
    returned: countsByStatus.Returned ?? 0,
    rejected: countsByStatus.Rejected ?? 0,
    closed: countsByStatus.Closed ?? 0,
    totalAmount: requests.reduce((sum, request) => sum + request.totalAmount, 0),
    countsByStatus,
    recentRequests: [...requests]
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
      .slice(0, 5)
      .map((request) => ({
        id: request.id,
        requestNumber: request.requestNumber,
        title: request.title,
        requesterName: request.requesterName,
        status: request.status,
        disbursementStatus: request.disbursementStatus,
        urgent: request.urgent,
        totalAmount: request.totalAmount,
        updatedAt: request.updatedAt
      }))
  };
}

async function userCanReadRequest(user, request) {
  return userCanSeeRequest(user, request);
}

function canUploadAttachment(user, request) {
  return canEditRequest(user, request);
}

function canEditRequest(user, request) {
  if (user.roles.includes('Admin')) {
    return ['Draft', 'Returned'].includes(request.status);
  }

  return user.roles.includes('Requester') && request.requesterId === user.id && ['Draft', 'Returned'].includes(request.status);
}

async function findLineItem(requestId, lineItemId) {
  const request = await findRequest(requestId);
  const lineItem = request?.lineItems.find((item) => item.id === lineItemId);
  return lineItem ? { request, lineItem } : null;
}

async function listAttachments(requestId, lineItemId) {
  const result = await query(
    `
      SELECT
        AttachmentId AS id,
        RequestId AS requestId,
        LineItemId AS lineItemId,
        OriginalFileName AS fileName,
        ContentType AS contentType,
        FileSizeBytes AS size,
        UploadedByUserId AS uploadedById,
        CreatedAt AS createdAt
      FROM app.Attachments
      WHERE RequestId = TRY_CONVERT(uniqueidentifier, @requestId)
        AND LineItemId = TRY_CONVERT(uniqueidentifier, @lineItemId)
      ORDER BY CreatedAt DESC;
    `,
    {
      requestId: [sql.NVarChar(80), requestId],
      lineItemId: [sql.NVarChar(80), lineItemId]
    }
  );

  return result.recordset.map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}

async function addAttachment(command, user) {
  const id = crypto.randomUUID();
  const storedFileName = command.storagePath.split(/[\\/]/).pop();
  await query(
    `
      INSERT INTO app.Attachments (
        AttachmentId, RequestId, LineItemId, OriginalFileName, StoredFileName,
        ContentType, FileSizeBytes, StoragePath, UploadedByUserId
      )
      VALUES (
        @id, @requestId, @lineItemId, @fileName, @storedFileName,
        @contentType, @size, @storagePath, @uploadedById
      );
    `,
    {
      id: [sql.UniqueIdentifier, id],
      requestId: [sql.UniqueIdentifier, command.requestId],
      lineItemId: [sql.UniqueIdentifier, command.lineItemId],
      fileName: [sql.NVarChar(260), command.fileName],
      storedFileName: [sql.NVarChar(260), storedFileName],
      contentType: [sql.NVarChar(120), command.contentType],
      size: [sql.Int, command.size],
      storagePath: [sql.NVarChar(1000), command.storagePath],
      uploadedById: [sql.UniqueIdentifier, user.id]
    }
  );

  return {
    id,
    requestId: command.requestId,
    lineItemId: command.lineItemId,
    fileName: command.fileName,
    contentType: command.contentType,
    size: command.size,
    uploadedById: user.id,
    uploadedByName: user.fullName,
    createdAt: new Date().toISOString()
  };
}

async function addLineItem(requestId, item) {
  const lineItem = normalizeLineItems([{ ...item, id: crypto.randomUUID() }])[0];
  await transaction(async (tx) => {
    await insertLineItemsTx(tx, requestId, [lineItem]);
    const dbRequest = txRequest(tx);
    dbRequest.input('requestId', sql.UniqueIdentifier, requestId);
    await dbRequest.query(`
      UPDATE app.ExpenseRequests
      SET TotalAmount = (
            SELECT COALESCE(SUM(LineTotal), 0)
            FROM app.RequestLineItems
            WHERE RequestId = @requestId
          ),
          UpdatedAt = SYSUTCDATETIME()
      WHERE RequestId = @requestId;
    `);
  });

  const request = await findRequest(requestId);
  return request.lineItems.find((existing) => existing.id === lineItem.id) ?? lineItem;
}

async function findAttachment(id) {
  const result = await query(
    `
      SELECT
        AttachmentId AS id,
        RequestId AS requestId,
        LineItemId AS lineItemId,
        OriginalFileName AS fileName,
        ContentType AS contentType,
        FileSizeBytes AS size,
        StoragePath AS storagePath,
        UploadedByUserId AS uploadedById,
        CreatedAt AS createdAt
      FROM app.Attachments
      WHERE AttachmentId = TRY_CONVERT(uniqueidentifier, @id);
    `,
    { id: [sql.NVarChar(80), id] }
  );

  const row = result.recordset[0];
  return row ? { ...row, createdAt: iso(row.createdAt) } : null;
}

async function createRequest(command, user, submit) {
  let createdId;
  await transaction(async (tx) => {
    const request = await insertRequest(tx, command, user, submit);
    createdId = request.id;
    await addAuditLogTx(tx, request, user, submit ? 'Submitted' : 'Saved Draft');
    if (submit) {
      await addWorkflowNotificationsTx(tx, request, user, 'Submitted');
    }
  });

  return findRequest(createdId);
}

async function updateDraft(id, command, user) {
  const existing = await findRequest(id);
  if (!existing || !canEditRequest(user, existing)) {
    return null;
  }

  await transaction(async (tx) => {
    const refs = await resolveReferencesTx(tx, command);
    const lineItems = normalizeLineItems(command.lineItems ?? [command.lineItem].filter(Boolean));
    const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const request = txRequest(tx);
    request.input('id', sql.UniqueIdentifier, existing.id);
    request.input('title', sql.NVarChar(160), command.title);
    request.input('justification', sql.NVarChar(1200), command.justification);
    request.input('departmentId', sql.UniqueIdentifier, refs.departmentId);
    request.input('costCenterId', sql.UniqueIdentifier, refs.costCenterId);
    request.input('projectId', sql.UniqueIdentifier, refs.projectId);
    request.input('requestType', sql.NVarChar(30), command.requestType ?? existing.requestType);
    request.input('urgent', sql.Bit, Boolean(command.urgent));
    request.input('totalAmount', sql.Decimal(18, 2), totalAmount);
    await request.query(`
      UPDATE app.ExpenseRequests
      SET Title = @title,
          Justification = @justification,
          DepartmentId = @departmentId,
          CostCenterId = @costCenterId,
          ProjectId = @projectId,
          RequestTypeCode = @requestType,
          Urgent = @urgent,
          TotalAmount = @totalAmount,
          UpdatedAt = SYSUTCDATETIME()
      WHERE RequestId = @id;
    `);

    await deleteLineItemsTx(tx, existing.id);
    await insertLineItemsTx(tx, existing.id, lineItems);
    await addAuditLogTx(tx, existing, user, existing.status === 'Returned' ? 'Updated Returned Request' : 'Updated Draft');
  });

  return findRequest(existing.id);
}

async function deleteDraft(id, user) {
  const existing = await findRequest(id);
  if (!existing || existing.status !== 'Draft' || (existing.requesterId !== user.id && !user.roles.includes('Admin'))) {
    return false;
  }

  await query(
    `
      DELETE FROM app.WorkflowLogs WHERE RequestId = TRY_CONVERT(uniqueidentifier, @id);
      DELETE FROM app.ExpenseRequests WHERE RequestId = TRY_CONVERT(uniqueidentifier, @id);
    `,
    { id: [sql.NVarChar(80), id] }
  );
  return true;
}

async function transitionRequest(id, user, nextStatus, action, remarks) {
  const result = await transitionRequestStrict(id, user, nextStatus, action, remarks, {});
  return result.request ?? null;
}

async function transitionRequestStrict(id, user, nextStatus, action, remarks, rules) {
  const request = await findRequest(id);
  if (!request) {
    return { ok: false, status: 404, message: 'Request not found.' };
  }

  const ruleError = validateTransition(request, user, action, remarks, rules);
  if (ruleError) {
    return ruleError;
  }

  const updated = await transaction(async (tx) => {
    let requestNumber = request.requestNumber === 'DRAFT' && nextStatus === 'PendingEndorsement'
      ? await nextRequestNumberTx(tx)
      : request.requestNumber;
    requestNumber = requestNumber === 'DRAFT' ? null : requestNumber;

    const nextDisbursementStatus = nextStatus === 'Approved' && request.requestType === 'Expense'
      ? 'Pending'
      : request.disbursementStatus ?? null;

    const dbRequest = txRequest(tx);
    dbRequest.input('id', sql.UniqueIdentifier, request.id);
    dbRequest.input('requestNumber', sql.NVarChar(40), requestNumber);
    dbRequest.input('nextStatus', sql.NVarChar(40), nextStatus);
    dbRequest.input('remarks', sql.NVarChar(1000), remarks);
    dbRequest.input('disbursementStatus', sql.NVarChar(30), nextDisbursementStatus);
    await dbRequest.query(`
      UPDATE app.ExpenseRequests
      SET RequestNumber = @requestNumber,
          StatusCode = @nextStatus,
          Remarks = @remarks,
          DisbursementStatusCode = @disbursementStatus,
          SubmittedAt = CASE WHEN @nextStatus = N'PendingEndorsement' THEN SYSUTCDATETIME() ELSE SubmittedAt END,
          UpdatedAt = SYSUTCDATETIME()
      WHERE RequestId = @id;
    `);

    const changed = {
      ...request,
      requestNumber: requestNumber ?? 'DRAFT',
      status: nextStatus,
      remarks,
      disbursementStatus: nextDisbursementStatus ?? undefined
    };
    await addAuditLogTx(tx, changed, user, action, remarks);
    await addWorkflowNotificationsTx(tx, changed, user, action, remarks);
    return changed;
  });

  return { ok: true, request: await findRequest(updated.id) };
}

async function updateDisbursementStatus(id, user, nextStatus) {
  const request = await findRequest(id);
  const allowedStatuses = ['Pending', 'InProcess', 'Processed', 'OnHold'];

  if (!request) {
    return { ok: false, status: 404, message: 'Request not found.' };
  }
  if (!user.roles.includes('FinanceViewer') && !user.roles.includes('Admin')) {
    return { ok: false, status: 403, message: 'Only Finance can update disbursement status.' };
  }
  if (request.requestType !== 'Expense') {
    return { ok: false, status: 409, message: 'Only expense requests can be processed in the Finance queue.' };
  }
  if (request.status !== 'Approved') {
    return { ok: false, status: 409, message: `Finance status cannot be changed while request is ${request.status}.` };
  }
  if (!allowedStatuses.includes(nextStatus)) {
    return { ok: false, status: 400, message: `Finance status must be one of: ${allowedStatuses.join(', ')}.` };
  }

  await transaction(async (tx) => {
    const dbRequest = txRequest(tx);
    dbRequest.input('id', sql.UniqueIdentifier, request.id);
    dbRequest.input('status', sql.NVarChar(30), nextStatus);
    dbRequest.input('processedBy', sql.UniqueIdentifier, user.id);
    await dbRequest.query(`
      UPDATE app.ExpenseRequests
      SET DisbursementStatusCode = @status,
          UpdatedAt = SYSUTCDATETIME()
      WHERE RequestId = @id;

      MERGE app.DisbursementRecords AS target
      USING (SELECT @id AS RequestId, @status AS DisbursementStatusCode) AS source
      ON target.RequestId = source.RequestId
      WHEN MATCHED THEN
        UPDATE SET DisbursementStatusCode = source.DisbursementStatusCode,
                   ProcessedByUserId = CASE WHEN source.DisbursementStatusCode = N'Processed' THEN @processedBy ELSE ProcessedByUserId END,
                   ProcessedAt = CASE WHEN source.DisbursementStatusCode = N'Processed' THEN SYSUTCDATETIME() ELSE ProcessedAt END,
                   UpdatedAt = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (RequestId, DisbursementStatusCode, ProcessedByUserId, ProcessedAt)
        VALUES (source.RequestId, source.DisbursementStatusCode, CASE WHEN source.DisbursementStatusCode = N'Processed' THEN @processedBy ELSE NULL END, CASE WHEN source.DisbursementStatusCode = N'Processed' THEN SYSUTCDATETIME() ELSE NULL END);
    `);

    await addAuditLogTx(tx, request, user, 'Finance Status Updated', `Finance status changed to ${financeStatusLabel(nextStatus)}.`);
    await markRequestNotificationsReadForUserTx(tx, request.id, user);
    await addWorkflowNotificationsTx(tx, { ...request, disbursementStatus: nextStatus }, user, 'Finance Status Updated');
  });

  return { ok: true, request: await findRequest(request.id) };
}

async function auditTrail(requestId) {
  const result = await query(
    `
      SELECT
        WorkflowLogId AS id,
        RequestId AS requestId,
        RequestNumberSnapshot AS requestNumber,
        ActorUserId AS actorId,
        ActorRole AS actorRole,
        Action AS action,
        Remarks AS remarks,
        CreatedAt AS createdAt,
        COALESCE(u.FullName, N'System') AS actorName
      FROM app.WorkflowLogs wl
      LEFT JOIN app.Users u ON u.UserId = wl.ActorUserId
      WHERE wl.RequestId = TRY_CONVERT(uniqueidentifier, @id)
         OR wl.RequestNumberSnapshot = @id
      ORDER BY wl.CreatedAt DESC;
    `,
    { id: [sql.NVarChar(80), requestId] }
  );

  return result.recordset.map(mapAuditLog);
}

async function listAuditLogsForUser(user) {
  const requests = await listRequestsForUser(user);
  const visibleIds = new Set(requests.map((request) => request.id));
  const result = await query(`
    SELECT
      wl.WorkflowLogId AS id,
      wl.RequestId AS requestId,
      wl.RequestNumberSnapshot AS requestNumber,
      wl.ActorUserId AS actorId,
      wl.ActorRole AS actorRole,
      wl.Action AS action,
      wl.Remarks AS remarks,
      wl.CreatedAt AS createdAt,
      COALESCE(u.FullName, N'System') AS actorName
    FROM app.WorkflowLogs wl
    LEFT JOIN app.Users u ON u.UserId = wl.ActorUserId
    ORDER BY wl.CreatedAt DESC;
  `);

  return result.recordset.map(mapAuditLog).filter((log) => visibleIds.has(log.requestId));
}

async function listNotificationsForUser(user) {
  const result = await query(
    `
      SELECT
        NotificationId AS id,
        UserId AS userId,
        RequestId AS requestId,
        RequestNumberSnapshot AS requestNumber,
        NotificationType AS type,
        Subject AS subject,
        Message AS message,
        IsUnread AS unread,
        ReadAt AS readAt,
        CreatedAt AS createdAt
      FROM app.Notifications
      WHERE UserId = TRY_CONVERT(uniqueidentifier, @userId)
      ORDER BY CreatedAt DESC;
    `,
    { userId: [sql.NVarChar(80), user.id] }
  );

  return result.recordset.map(mapNotification);
}

async function unreadNotificationCount(user) {
  const result = await query(
    `
      SELECT COUNT(*) AS count
      FROM app.Notifications
      WHERE UserId = TRY_CONVERT(uniqueidentifier, @userId)
        AND IsUnread = 1;
    `,
    { userId: [sql.NVarChar(80), user.id] }
  );

  return Number(result.recordset[0]?.count ?? 0);
}

async function markNotificationRead(id, user) {
  await query(
    `
      UPDATE app.Notifications
      SET IsUnread = 0,
          ReadAt = COALESCE(ReadAt, SYSUTCDATETIME())
      WHERE NotificationId = TRY_CONVERT(uniqueidentifier, @id)
        AND UserId = TRY_CONVERT(uniqueidentifier, @userId);
    `,
    {
      id: [sql.NVarChar(80), id],
      userId: [sql.NVarChar(80), user.id]
    }
  );

  const notifications = await listNotificationsForUser(user);
  return notifications.find((notification) => notification.id === id) ?? null;
}

async function markAllNotificationsRead(user) {
  await query(
    `
      UPDATE app.Notifications
      SET IsUnread = 0,
          ReadAt = COALESCE(ReadAt, SYSUTCDATETIME())
      WHERE UserId = TRY_CONVERT(uniqueidentifier, @userId)
        AND IsUnread = 1;
    `,
    { userId: [sql.NVarChar(80), user.id] }
  );

  return listNotificationsForUser(user);
}

async function markRequestNotificationsReadForUser(requestId, user) {
  await query(
    `
      UPDATE app.Notifications
      SET IsUnread = 0,
          ReadAt = COALESCE(ReadAt, SYSUTCDATETIME())
      WHERE RequestId = TRY_CONVERT(uniqueidentifier, @requestId)
        AND UserId = TRY_CONVERT(uniqueidentifier, @userId)
        AND IsUnread = 1;
    `,
    {
      requestId: [sql.NVarChar(80), requestId],
      userId: [sql.NVarChar(80), user.id]
    }
  );
}

async function getValidationState() {
  const [departments, costCenters, categories, projects] = await Promise.all([
    listDepartments(),
    listCostCenters(),
    listCategories(),
    listProjects()
  ]);
  return { departments, costCenters, categories, projects };
}

async function listUsers() {
  const result = await query(`
    SELECT
      u.UserId AS id,
      u.Email AS email,
      u.FullName AS fullName,
      u.DepartmentId AS departmentId,
      d.Name AS department,
      STRING_AGG(ur.RoleCode, ',') WITHIN GROUP (ORDER BY ur.RoleCode) AS roles
    FROM app.Users u
    LEFT JOIN app.Departments d ON d.DepartmentId = u.DepartmentId
    LEFT JOIN app.UserRoles ur ON ur.UserId = u.UserId
    GROUP BY u.UserId, u.Email, u.FullName, u.DepartmentId, d.Name
    ORDER BY u.FullName;
  `);
  return result.recordset.map(mapUser).map(publicUser);
}

async function listDepartments() {
  const result = await query(`
    SELECT
      d.DepartmentId AS id,
      d.Code AS code,
      d.Name AS name,
      COALESCE(manager.FullName, N'') AS manager,
      cc.CostCenterId AS costCenterId,
      cc.Code AS costCenter,
      d.IsActive AS active
    FROM app.Departments d
    LEFT JOIN app.Users manager ON manager.UserId = d.ManagerUserId
    LEFT JOIN app.CostCenters cc ON cc.DepartmentId = d.DepartmentId
    ORDER BY d.Name;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function listCostCenters() {
  const result = await query(`
    SELECT
      cc.CostCenterId AS id,
      cc.Code AS code,
      cc.DepartmentId AS departmentId,
      d.Name AS department,
      cc.Description AS description,
      cc.IsActive AS active
    FROM app.CostCenters cc
    INNER JOIN app.Departments d ON d.DepartmentId = cc.DepartmentId
    ORDER BY cc.Code;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function listCategories() {
  const result = await query(`
    SELECT
      c.CategoryId AS id,
      c.Code AS code,
      c.Name AS name,
      coa.Code AS glAccount,
      c.CoaAccountId AS coaAccountId,
      c.IsActive AS active
    FROM app.ExpenseCategories c
    LEFT JOIN app.CoaAccounts coa ON coa.CoaAccountId = c.CoaAccountId
    ORDER BY c.Name;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function listProjects() {
  const result = await query(`
    SELECT
      p.ProjectId AS id,
      p.Code AS code,
      p.Name AS name,
      p.DepartmentId AS departmentId,
      d.Name AS department,
      p.Status AS status,
      p.IsActive AS active
    FROM app.Projects p
    LEFT JOIN app.Departments d ON d.DepartmentId = p.DepartmentId
    ORDER BY p.Name;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function listApprovalMatrix() {
  const result = await query(`
    SELECT
      r.ApprovalMatrixRuleId AS id,
      r.DepartmentId AS departmentId,
      d.Name AS department,
      r.CategoryId AS categoryId,
      c.Name AS category,
      r.AmountMin AS amountMin,
      r.AmountMax AS amountMax,
      r.EndorserRoleCode AS endorserRole,
      r.ApproverRoleCode AS approverRole,
      r.SecondaryApproverRoleCode AS secondaryApproverRole,
      r.IsActive AS active
    FROM app.ApprovalMatrixRules r
    LEFT JOIN app.Departments d ON d.DepartmentId = r.DepartmentId
    LEFT JOIN app.ExpenseCategories c ON c.CategoryId = r.CategoryId
    ORDER BY d.Name, c.Name, r.AmountMin;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function listCoaAccounts() {
  const result = await query(`
    SELECT
      CoaAccountId AS id,
      Code AS code,
      Name AS name,
      ParentName AS parent,
      IsActive AS active
    FROM app.CoaAccounts
    ORDER BY Code;
  `);
  return result.recordset.map((row) => ({ ...row, active: Boolean(row.active) }));
}

async function spendDashboard() {
  const requests = await fetchRequests();
  const approved = sumByStatus(requests, ['Approved', 'Closed']);
  const pending = sumByStatus(requests, ['PendingEndorsement', 'PendingApproval']);
  return {
    openRequests: requests.filter((request) => !['Closed', 'Cancelled', 'Rejected'].includes(request.status)).length,
    pendingApproval: requests.filter((request) => request.status === 'PendingApproval').length,
    approvedSpend: approved,
    pendingSpend: pending,
    byCategory: groupByCategory(requests)
  };
}

async function expenseSummary() {
  const requests = await fetchRequests();
  return {
    totalRequests: requests.length,
    totalAmount: requests.reduce((sum, request) => sum + request.totalAmount, 0),
    byDepartment: groupByDepartment(requests)
  };
}

async function approvedRequestsCsvRows() {
  const requests = await fetchRequests();
  return requests.filter((request) => ['Approved', 'Closed'].includes(request.status));
}

async function budgets() {
  const result = await query(`
    SELECT
      b.BudgetId AS id,
      b.PeriodCode AS period,
      d.Name AS department,
      c.Name AS category,
      cc.Code AS costCenter,
      b.BudgetAmount AS budget,
      b.ActualAmount AS actual,
      b.BudgetAmount - b.ActualAmount AS available,
      CASE
        WHEN b.BudgetAmount = 0 THEN N'No Budget'
        WHEN (b.ActualAmount / NULLIF(b.BudgetAmount, 0)) * 100 >= b.AlertThresholdPercent THEN N'Near Threshold'
        ELSE N'Healthy'
      END AS status
    FROM app.Budgets b
    INNER JOIN app.Departments d ON d.DepartmentId = b.DepartmentId
    INNER JOIN app.ExpenseCategories c ON c.CategoryId = b.CategoryId
    INNER JOIN app.CostCenters cc ON cc.CostCenterId = b.CostCenterId
    ORDER BY b.PeriodCode DESC, d.Name, c.Name;
  `);
  return result.recordset.map((row) => ({
    ...row,
    budget: Number(row.budget),
    actual: Number(row.actual),
    available: Number(row.available)
  }));
}

async function budgetAvailability() {
  const rows = await budgets();
  const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0);
  return {
    available: totalAvailable,
    status: rows.some((row) => row.status === 'Near Threshold') ? 'Near Threshold' : 'Healthy'
  };
}

async function thresholdAlerts() {
  const rows = await budgets();
  return rows.filter((row) => row.status === 'Near Threshold');
}

async function health() {
  await query('SELECT 1 AS ok;');
  return { status: 'ok', service: 'it-expense-api', dataStore: 'sqlserver', timestamp: new Date().toISOString() };
}

async function fetchRequests(id) {
  const where = id
    ? 'WHERE er.RequestId = TRY_CONVERT(uniqueidentifier, @id) OR er.RequestNumber = @id'
    : '';
  const result = await query(
    `
      SELECT
        er.RequestId AS id,
        COALESCE(er.RequestNumber, N'DRAFT') AS requestNumber,
        er.Title AS title,
        er.Justification AS justification,
        er.RequesterUserId AS requesterId,
        requester.FullName AS requesterName,
        er.DepartmentId AS departmentId,
        d.Name AS department,
        er.CostCenterId AS costCenterId,
        cc.Code AS costCenter,
        er.ProjectId AS projectId,
        p.Name AS project,
        er.RequestTypeCode AS requestType,
        er.StatusCode AS status,
        er.DisbursementStatusCode AS disbursementStatus,
        er.Urgent AS urgent,
        er.TotalAmount AS totalAmount,
        er.Remarks AS remarks,
        er.SubmittedAt AS submittedAt,
        er.CreatedAt AS createdAt,
        er.UpdatedAt AS updatedAt,
        li.LineItemId AS lineItemId,
        li.CategoryId AS lineItemCategoryId,
        cat.Name AS lineItemCategory,
        li.Description AS lineItemDescription,
        li.Vendor AS lineItemVendor,
        li.Quantity AS lineItemQuantity,
        li.UnitAmount AS lineItemUnitAmount,
        li.LineTotal AS lineItemLineTotal,
        li.SellerLink AS lineItemSellerLink
      FROM app.ExpenseRequests er
      INNER JOIN app.Users requester ON requester.UserId = er.RequesterUserId
      INNER JOIN app.Departments d ON d.DepartmentId = er.DepartmentId
      INNER JOIN app.CostCenters cc ON cc.CostCenterId = er.CostCenterId
      LEFT JOIN app.Projects p ON p.ProjectId = er.ProjectId
      LEFT JOIN app.RequestLineItems li ON li.RequestId = er.RequestId
      LEFT JOIN app.ExpenseCategories cat ON cat.CategoryId = li.CategoryId
      ${where}
      ORDER BY er.UpdatedAt DESC, li.CreatedAt ASC;
    `,
    id ? { id: [sql.NVarChar(80), id] } : {}
  );

  return hydrateRequests(result.recordset);
}

function hydrateRequests(rows) {
  const byId = new Map();
  for (const row of rows) {
    if (!byId.has(row.id)) {
      byId.set(row.id, {
        id: row.id,
        requestNumber: row.requestNumber,
        title: row.title,
        justification: row.justification,
        requesterId: row.requesterId,
        requesterName: row.requesterName,
        department: row.department,
        departmentId: row.departmentId,
        costCenter: row.costCenter,
        costCenterId: row.costCenterId,
        project: row.project,
        projectId: row.projectId,
        requestType: row.requestType,
        status: row.status,
        disbursementStatus: row.disbursementStatus ?? undefined,
        urgent: Boolean(row.urgent),
        totalAmount: Number(row.totalAmount),
        remarks: row.remarks ?? undefined,
        createdAt: iso(row.createdAt),
        submittedAt: iso(row.submittedAt),
        updatedAt: iso(row.updatedAt),
        lineItems: []
      });
    }

    if (row.lineItemId) {
      byId.get(row.id).lineItems.push({
        id: row.lineItemId,
        requestId: row.id,
        category: row.lineItemCategory,
        categoryId: row.lineItemCategoryId,
        description: row.lineItemDescription,
        vendor: row.lineItemVendor ?? undefined,
        quantity: Number(row.lineItemQuantity),
        unitAmount: Number(row.lineItemUnitAmount),
        lineTotal: Number(row.lineItemLineTotal),
        sellerLink: row.lineItemSellerLink ?? undefined
      });
    }
  }

  return Array.from(byId.values());
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    fullName: row.fullName,
    departmentId: row.departmentId,
    department: row.department,
    roles: String(row.roles ?? '').split(',').filter(Boolean)
  };
}

function mapAuditLog(row) {
  return {
    id: row.id,
    requestId: row.requestId,
    requestNumber: row.requestNumber,
    actorId: row.actorId ?? 'system',
    actorName: row.actorName ?? 'System',
    actorRole: row.actorRole,
    action: row.action,
    remarks: row.remarks ?? undefined,
    createdAt: iso(row.createdAt)
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.userId,
    requestId: row.requestId,
    requestNumber: row.requestNumber,
    type: row.type,
    subject: row.subject,
    message: row.message,
    unread: Boolean(row.unread),
    readAt: iso(row.readAt),
    createdAt: iso(row.createdAt)
  };
}

function userCanSeeRequest(user, request) {
  if (user.roles.includes('Admin')) {
    return true;
  }
  if (user.roles.includes('Requester') && request.requesterId === user.id) {
    return true;
  }
  if (user.roles.includes('Endorser') && request.status === 'PendingEndorsement') {
    return true;
  }
  if (user.roles.includes('Approver') && request.status === 'PendingApproval') {
    return true;
  }
  if (user.roles.includes('FinanceViewer') && ['Approved', 'Closed'].includes(request.status)) {
    return true;
  }
  return false;
}

async function insertRequest(tx, command, user, submit) {
  const refs = await resolveReferencesTx(tx, command);
  const lineItems = normalizeLineItems(command.lineItems ?? [command.lineItem].filter(Boolean));
  const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const requestNumber = submit ? await nextRequestNumberTx(tx) : null;
  const id = crypto.randomUUID();
  const dbRequest = txRequest(tx);
  dbRequest.input('id', sql.UniqueIdentifier, id);
  dbRequest.input('requestNumber', sql.NVarChar(40), requestNumber);
  dbRequest.input('title', sql.NVarChar(160), command.title);
  dbRequest.input('justification', sql.NVarChar(1200), command.justification);
  dbRequest.input('requesterId', sql.UniqueIdentifier, user.id);
  dbRequest.input('departmentId', sql.UniqueIdentifier, refs.departmentId);
  dbRequest.input('costCenterId', sql.UniqueIdentifier, refs.costCenterId);
  dbRequest.input('projectId', sql.UniqueIdentifier, refs.projectId);
  dbRequest.input('requestType', sql.NVarChar(30), command.requestType ?? 'Expense');
  dbRequest.input('status', sql.NVarChar(40), submit ? 'PendingEndorsement' : 'Draft');
  dbRequest.input('urgent', sql.Bit, Boolean(command.urgent));
  dbRequest.input('totalAmount', sql.Decimal(18, 2), totalAmount);
  await dbRequest.query(`
    INSERT INTO app.ExpenseRequests (
      RequestId, RequestNumber, Title, Justification, RequesterUserId,
      DepartmentId, CostCenterId, ProjectId, RequestTypeCode, StatusCode,
      Urgent, TotalAmount, SubmittedAt
    )
    VALUES (
      @id, @requestNumber, @title, @justification, @requesterId,
      @departmentId, @costCenterId, @projectId, @requestType, @status,
      @urgent, @totalAmount, CASE WHEN @status = N'PendingEndorsement' THEN SYSUTCDATETIME() ELSE NULL END
    );
  `);
  await insertLineItemsTx(tx, id, lineItems);

  return {
    id,
    requestNumber: requestNumber ?? 'DRAFT',
    title: command.title,
    requesterId: user.id,
    requesterName: user.fullName,
    requestType: command.requestType ?? 'Expense',
    status: submit ? 'PendingEndorsement' : 'Draft',
    totalAmount,
    lineItems
  };
}

async function resolveReferencesTx(tx, command) {
  const request = txRequest(tx);
  request.input('department', sql.NVarChar(120), command.department);
  request.input('costCenter', sql.NVarChar(40), command.costCenter);
  request.input('project', sql.NVarChar(150), command.project);
  const result = await request.query(`
    SELECT
      (SELECT TOP 1 DepartmentId FROM app.Departments WHERE Name = @department OR Code = @department) AS departmentId,
      (SELECT TOP 1 CostCenterId FROM app.CostCenters WHERE Code = @costCenter) AS costCenterId,
      (SELECT TOP 1 ProjectId FROM app.Projects WHERE Name = @project OR Code = @project) AS projectId;
  `);

  const refs = result.recordset[0];
  return {
    departmentId: refs.departmentId,
    costCenterId: refs.costCenterId,
    projectId: refs.projectId
  };
}

async function insertLineItemsTx(tx, requestId, lineItems) {
  for (const item of lineItems) {
    const categoryId = await resolveCategoryIdTx(tx, item);
    const id = item.id && isGuid(item.id) ? item.id : crypto.randomUUID();
    const dbRequest = txRequest(tx);
    dbRequest.input('id', sql.UniqueIdentifier, id);
    dbRequest.input('requestId', sql.UniqueIdentifier, requestId);
    dbRequest.input('categoryId', sql.UniqueIdentifier, categoryId);
    dbRequest.input('description', sql.NVarChar(250), item.description);
    dbRequest.input('vendor', sql.NVarChar(160), item.vendor);
    dbRequest.input('quantity', sql.Decimal(18, 2), item.quantity);
    dbRequest.input('unitAmount', sql.Decimal(18, 2), item.unitAmount);
    dbRequest.input('sellerLink', sql.NVarChar(1000), item.sellerLink);
    await dbRequest.query(`
      INSERT INTO app.RequestLineItems (
        LineItemId, RequestId, CategoryId, Description, Vendor,
        Quantity, UnitAmount, SellerLink
      )
      VALUES (
        @id, @requestId, @categoryId, @description, @vendor,
        @quantity, @unitAmount, @sellerLink
      );
    `);
  }
}

async function deleteLineItemsTx(tx, requestId) {
  const request = txRequest(tx);
  request.input('requestId', sql.UniqueIdentifier, requestId);
  await request.query(`
    DELETE links
    FROM app.RequestLineItemLinks links
    INNER JOIN app.RequestLineItems items ON items.LineItemId = links.LineItemId
    WHERE items.RequestId = @requestId;

    DELETE FROM app.RequestLineItems
    WHERE RequestId = @requestId;
  `);
}

async function resolveCategoryIdTx(tx, item) {
  const request = txRequest(tx);
  request.input('categoryId', sql.NVarChar(80), item.categoryId);
  request.input('category', sql.NVarChar(120), item.category);
  const result = await request.query(`
    SELECT TOP 1 CategoryId
    FROM app.ExpenseCategories
    WHERE CategoryId = TRY_CONVERT(uniqueidentifier, @categoryId)
       OR Name = @category
       OR Code = @category;
  `);
  return result.recordset[0]?.CategoryId;
}

async function nextRequestNumberTx(tx) {
  const request = txRequest(tx);
  const result = await request.query('SELECT NEXT VALUE FOR app.ExpenseRequestNumberSeq AS nextValue;');
  const year = new Date().getFullYear();
  return `EXP-${year}-${String(result.recordset[0].nextValue).padStart(6, '0')}`;
}

async function addAuditLogTx(tx, request, user, action, remarks) {
  const dbRequest = txRequest(tx);
  dbRequest.input('id', sql.UniqueIdentifier, crypto.randomUUID());
  dbRequest.input('requestId', sql.UniqueIdentifier, request.id);
  dbRequest.input('requestNumber', sql.NVarChar(40), request.requestNumber ?? 'DRAFT');
  dbRequest.input('actorId', sql.UniqueIdentifier, user?.id ?? null);
  dbRequest.input('actorRole', sql.NVarChar(120), user?.roles?.join(', ') ?? 'System');
  dbRequest.input('action', sql.NVarChar(80), action);
  dbRequest.input('remarks', sql.NVarChar(1000), remarks);
  await dbRequest.query(`
    INSERT INTO app.WorkflowLogs (
      WorkflowLogId, RequestId, RequestNumberSnapshot, ActorUserId,
      ActorRole, Action, Remarks
    )
    VALUES (
      @id, @requestId, @requestNumber, @actorId,
      @actorRole, @action, @remarks
    );
  `);
}

async function addWorkflowNotificationsTx(tx, request, actor, action, remarks) {
  if (action === 'Submitted' || action === 'Resubmitted') {
    await notifyRoleTx(tx, 'Endorser', request, actor, {
      type: 'RequestSubmitted',
      subject: `${request.requestNumber} needs endorsement`,
      message: `${actor.fullName} submitted "${request.title}" for endorsement.`
    });
    return;
  }

  if (action === 'Returned') {
    await notifyUsersTx(tx, [request.requesterId], request, actor, {
      type: 'RequestReturned',
      subject: `${request.requestNumber} was returned`,
      message: `${actor.fullName} returned "${request.title}". ${remarks ? `Remarks: ${remarks}` : ''}`.trim()
    });
    return;
  }

  if (action === 'Approved') {
    await notifyUsersTx(tx, [request.requesterId], request, actor, {
      type: 'RequestApproved',
      subject: `${request.requestNumber} was approved`,
      message: `${actor.fullName} approved "${request.title}".`
    });
    await notifyRoleTx(tx, 'FinanceViewer', request, actor, {
      type: 'RequestApproved',
      subject: `${request.requestNumber} was approved`,
      message: `${actor.fullName} approved "${request.title}".`
    });
    return;
  }

  if (action === 'Finance Status Updated') {
    await notifyUsersTx(tx, [request.requesterId], request, actor, {
      type: 'RequestFinanceStatusUpdated',
      subject: `${request.requestNumber} Finance status changed`,
      message: `${actor.fullName} updated "${request.title}" to ${financeStatusLabel(request.disbursementStatus)}.`
    });
    return;
  }

  if (action === 'Closed') {
    await notifyUsersTx(tx, [request.requesterId], request, actor, {
      type: 'RequestClosed',
      subject: `${request.requestNumber} was closed`,
      message: `${actor.fullName} closed "${request.title}" after Finance processing.`
    });
  }
}

async function notifyRoleTx(tx, role, request, actor, notification) {
  const dbRequest = txRequest(tx);
  dbRequest.input('role', sql.NVarChar(30), role);
  const result = await dbRequest.query(`
    SELECT UserId
    FROM app.UserRoles
    WHERE RoleCode = @role;
  `);
  await notifyUsersTx(tx, result.recordset.map((row) => row.UserId), request, actor, notification);
}

async function notifyUsersTx(tx, userIds, request, actor, notification) {
  for (const userId of [...new Set(userIds.filter(Boolean).map(String))]) {
    if (userId === actor.id) {
      continue;
    }
    const dbRequest = txRequest(tx);
    dbRequest.input('id', sql.UniqueIdentifier, crypto.randomUUID());
    dbRequest.input('userId', sql.UniqueIdentifier, userId);
    dbRequest.input('requestId', sql.UniqueIdentifier, request.id);
    dbRequest.input('requestNumber', sql.NVarChar(40), request.requestNumber ?? 'DRAFT');
    dbRequest.input('type', sql.NVarChar(80), notification.type);
    dbRequest.input('subject', sql.NVarChar(180), notification.subject);
    dbRequest.input('message', sql.NVarChar(1000), notification.message);
    await dbRequest.query(`
      INSERT INTO app.Notifications (
        NotificationId, UserId, RequestId, RequestNumberSnapshot,
        NotificationType, Subject, Message
      )
      VALUES (
        @id, @userId, @requestId, @requestNumber,
        @type, @subject, @message
      );
    `);
  }
}

async function markRequestNotificationsReadForUserTx(tx, requestId, user) {
  const dbRequest = txRequest(tx);
  dbRequest.input('requestId', sql.UniqueIdentifier, requestId);
  dbRequest.input('userId', sql.UniqueIdentifier, user.id);
  await dbRequest.query(`
    UPDATE app.Notifications
    SET IsUnread = 0,
        ReadAt = COALESCE(ReadAt, SYSUTCDATETIME())
    WHERE RequestId = @requestId
      AND UserId = @userId
      AND IsUnread = 1;
  `);
}

function validateTransition(request, user, action, remarks, rules) {
  if (rules.fromStatuses?.length && !rules.fromStatuses.includes(request.status)) {
    return { ok: false, status: 409, message: `${action} is not allowed while request is ${request.status}.` };
  }
  if (rules.ownerOnly && request.requesterId !== user.id && !user.roles.includes('Admin')) {
    return { ok: false, status: 403, message: 'Only the requester can perform this action.' };
  }
  if (rules.requiredRoles?.length && !user.roles.some((role) => rules.requiredRoles.includes(role)) && !user.roles.includes('Admin')) {
    return { ok: false, status: 403, message: 'You do not have permission to perform this action.' };
  }
  if (rules.requireRemarks && !String(remarks ?? '').trim()) {
    return { ok: false, status: 400, message: `${action} remarks are required.` };
  }
  if (rules.requiredDisbursementStatus && (request.disbursementStatus ?? 'Pending') !== rules.requiredDisbursementStatus) {
    return { ok: false, status: 409, message: `${action} is only allowed after Finance status is ${rules.requiredDisbursementStatus}.` };
  }
  return null;
}

function normalizeLineItems(items) {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 1);
    const unitAmount = Number(item.unitAmount ?? 0);
    return {
      id: item.id,
      category: String(item.category ?? 'Hardware').trim(),
      categoryId: item.categoryId,
      description: String(item.description ?? '').trim(),
      vendor: item.vendor ? String(item.vendor).trim() : undefined,
      quantity,
      unitAmount,
      lineTotal: quantity * unitAmount,
      sellerLink: item.sellerLink ? String(item.sellerLink).trim() : undefined
    };
  });
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function financeStatusLabel(status) {
  const labels = {
    Pending: 'Pending Finance',
    InProcess: 'In Process',
    Processed: 'Processed',
    OnHold: 'On Hold'
  };
  return labels[status] ?? status;
}

function sumByStatus(requests, statuses) {
  return requests.filter((request) => statuses.includes(request.status)).reduce((sum, request) => sum + request.totalAmount, 0);
}

function groupByCategory(requests) {
  const groups = new Map();
  for (const request of requests) {
    for (const lineItem of request.lineItems) {
      groups.set(lineItem.category, (groups.get(lineItem.category) ?? 0) + lineItem.lineTotal);
    }
  }
  return Array.from(groups.entries()).map(([category, amount]) => ({ category, amount }));
}

function groupByDepartment(requests) {
  const groups = new Map();
  for (const request of requests) {
    groups.set(request.department, (groups.get(request.department) ?? 0) + request.totalAmount);
  }
  return Array.from(groups.entries()).map(([department, amount]) => ({ department, amount }));
}

module.exports = {
  state,
  publicUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  findUsersByRole,
  listRequestsForUser,
  findRequest,
  requestDashboardSummary,
  userCanReadRequest,
  canUploadAttachment,
  canEditRequest,
  findLineItem,
  addLineItem,
  listAttachments,
  addAttachment,
  findAttachment,
  createRequest,
  updateDraft,
  deleteDraft,
  transitionRequest,
  transitionRequestStrict,
  updateDisbursementStatus,
  auditTrail,
  listAuditLogsForUser,
  listNotificationsForUser,
  unreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  markRequestNotificationsReadForUser,
  getValidationState,
  listUsers,
  listDepartments,
  listCostCenters,
  listCategories,
  listProjects,
  listApprovalMatrix,
  listCoaAccounts,
  spendDashboard,
  expenseSummary,
  approvedRequestsCsvRows,
  budgets,
  budgetAvailability,
  thresholdAlerts,
  health
};
