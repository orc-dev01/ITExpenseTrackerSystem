const crypto = require('crypto');
const data = require('../data/dummy-data');

const state = {
  users: [...data.users],
  departments: [...data.departments],
  costCenters: [...data.costCenters],
  categories: [...data.categories],
  projects: [...data.projects],
  requests: [...data.requests],
  auditLogs: [...data.auditLogs],
  attachments: [...data.attachments],
  notifications: [...data.notifications]
};

function publicUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

function findUserByEmail(email) {
  return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function findUserById(id) {
  return state.users.find((user) => user.id === id);
}

function findUsersByRole(role) {
  return state.users.filter((user) => user.roles.includes(role));
}

function listRequestsForUser(user) {
  if (user.roles.includes('Admin')) {
    return state.requests;
  }
  if (user.roles.includes('Requester')) {
    return state.requests.filter((request) => request.requesterId === user.id);
  }
  if (user.roles.includes('Endorser')) {
    return state.requests.filter((request) => request.status === 'PendingEndorsement');
  }
  if (user.roles.includes('Approver')) {
    return state.requests.filter((request) => request.status === 'PendingApproval');
  }
  if (user.roles.includes('FinanceViewer')) {
    return state.requests.filter((request) => ['Approved', 'Closed'].includes(request.status));
  }
  return [];
}

function findRequest(id) {
  return state.requests.find((request) => request.id === id || request.requestNumber === id);
}

function requestDashboardSummary(user) {
  const requests = listRequestsForUser(user);
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
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
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

function userCanReadRequest(user, request) {
  return listRequestsForUser(user).some((visibleRequest) => visibleRequest.id === request.id);
}

function canUploadAttachment(user, request) {
  if (user.roles.includes('Admin')) {
    return ['Draft', 'Returned'].includes(request.status);
  }

  return user.roles.includes('Requester') && request.requesterId === user.id && ['Draft', 'Returned'].includes(request.status);
}

function canEditRequest(user, request) {
  if (user.roles.includes('Admin')) {
    return ['Draft', 'Returned'].includes(request.status);
  }

  return user.roles.includes('Requester') && request.requesterId === user.id && ['Draft', 'Returned'].includes(request.status);
}

function findLineItem(requestId, lineItemId) {
  const request = findRequest(requestId);
  const lineItem = request?.lineItems.find((item) => item.id === lineItemId);
  return lineItem ? { request, lineItem } : null;
}

function publicAttachment(attachment) {
  const { storagePath, ...safeAttachment } = attachment;
  return safeAttachment;
}

function listAttachments(requestId, lineItemId) {
  return state.attachments
    .filter((attachment) => attachment.requestId === requestId && attachment.lineItemId === lineItemId)
    .map(publicAttachment);
}

function addAttachment(command, user) {
  const attachment = {
    id: crypto.randomUUID(),
    requestId: command.requestId,
    lineItemId: command.lineItemId,
    fileName: command.fileName,
    contentType: command.contentType,
    size: command.size,
    storagePath: command.storagePath,
    uploadedById: user.id,
    uploadedByName: user.fullName,
    createdAt: new Date().toISOString()
  };

  state.attachments.unshift(attachment);
  return publicAttachment(attachment);
}

function findAttachment(id) {
  return state.attachments.find((attachment) => attachment.id === id);
}

function createRequest(command, user, submit) {
  const now = new Date().toISOString();
  const lineItems = normalizeLineItems(command.lineItems ?? [command.lineItem].filter(Boolean));
  const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const request = {
    id: crypto.randomUUID(),
    requestNumber: submit ? nextRequestNumber() : 'DRAFT',
    title: command.title,
    justification: command.justification,
    requesterId: user.id,
    requesterName: user.fullName,
    department: command.department ?? 'IT Operations',
    departmentId: command.departmentId,
    costCenter: command.costCenter ?? 'CC-IT-001',
    costCenterId: command.costCenterId,
    projectId: command.projectId,
    requestType: command.requestType ?? 'Expense',
    status: submit ? 'PendingEndorsement' : 'Draft',
    urgent: Boolean(command.urgent),
    totalAmount,
    createdAt: now,
    submittedAt: submit ? now : undefined,
    updatedAt: now,
    lineItems
  };

  state.requests.unshift(request);
  addAuditLog(request, user, submit ? 'Submitted' : 'Saved Draft');
  if (submit) {
    addWorkflowNotifications(request, user, 'Submitted');
  }
  return request;
}

function updateDraft(id, command, user) {
  const request = findRequest(id);
  if (!request || !['Draft', 'Returned'].includes(request.status) || (request.requesterId !== user.id && !user.roles.includes('Admin'))) {
    return null;
  }

  const lineItems = normalizeLineItems(command.lineItems ?? [command.lineItem].filter(Boolean));
  const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  request.title = command.title;
  request.justification = command.justification;
  request.department = command.department ?? request.department;
  request.departmentId = command.departmentId;
  request.costCenter = command.costCenter ?? request.costCenter;
  request.costCenterId = command.costCenterId;
  request.projectId = command.projectId;
  request.requestType = command.requestType ?? request.requestType;
  request.urgent = Boolean(command.urgent);
  request.totalAmount = totalAmount;
  request.lineItems = lineItems;
  request.updatedAt = new Date().toISOString();

  addAuditLog(request, user, request.status === 'Returned' ? 'Updated Returned Request' : 'Updated Draft');
  return request;
}

function deleteDraft(id, user) {
  const index = state.requests.findIndex((request) => request.id === id && request.status === 'Draft' && (request.requesterId === user.id || user.roles.includes('Admin')));
  if (index === -1) {
    return false;
  }

  state.requests.splice(index, 1);
  state.auditLogs = state.auditLogs.filter((log) => log.requestId !== id);
  return true;
}

function transitionRequest(id, user, nextStatus, action, remarks) {
  const request = findRequest(id);
  if (!request) {
    return null;
  }

  const now = new Date().toISOString();
  request.status = nextStatus;
  request.remarks = remarks;
  request.updatedAt = now;
  if (nextStatus === 'PendingEndorsement') {
    request.requestNumber = request.requestNumber === 'DRAFT' ? nextRequestNumber() : request.requestNumber;
    request.submittedAt = now;
  }
  if (nextStatus === 'Approved' && request.requestType === 'Expense') {
    request.disbursementStatus = 'Pending';
  }

  addAuditLog(request, user, action, remarks);
  addWorkflowNotifications(request, user, action, remarks);
  return request;
}

function addWorkflowNotifications(request, actor, action, remarks) {
  if (action === 'Submitted' || action === 'Resubmitted') {
    notifyUsers(findUsersByRole('Endorser'), {
      request,
      actor,
      type: 'RequestSubmitted',
      subject: `${request.requestNumber} needs endorsement`,
      message: `${actor.fullName} submitted "${request.title}" for endorsement.`
    });
    return;
  }

  if (action === 'Returned') {
    notifyUsers([findUserById(request.requesterId)].filter(Boolean), {
      request,
      actor,
      type: 'RequestReturned',
      subject: `${request.requestNumber} was returned`,
      message: `${actor.fullName} returned "${request.title}". ${remarks ? `Remarks: ${remarks}` : ''}`.trim()
    });
    return;
  }

  if (action === 'Approved') {
    notifyUsers([findUserById(request.requesterId), ...findUsersByRole('FinanceViewer')].filter(Boolean), {
      request,
      actor,
      type: 'RequestApproved',
      subject: `${request.requestNumber} was approved`,
      message: `${actor.fullName} approved "${request.title}".`
    });
    return;
  }

  if (action === 'Finance Status Updated') {
    notifyUsers([findUserById(request.requesterId)].filter(Boolean), {
      request,
      actor,
      type: 'RequestFinanceStatusUpdated',
      subject: `${request.requestNumber} Finance status changed`,
      message: `${actor.fullName} updated "${request.title}" to ${financeStatusLabel(financeStatus(request))}.`
    });
    return;
  }

  if (action === 'Closed') {
    notifyUsers([findUserById(request.requesterId)].filter(Boolean), {
      request,
      actor,
      type: 'RequestClosed',
      subject: `${request.requestNumber} was closed`,
      message: `${actor.fullName} closed "${request.title}" after Finance processing.`
    });
  }
}

function notifyUsers(users, command) {
  const uniqueUsers = new Map(users.map((user) => [user.id, user]));
  for (const user of uniqueUsers.values()) {
    if (user.id === command.actor.id) {
      continue;
    }

    state.notifications.unshift({
      id: crypto.randomUUID(),
      userId: user.id,
      requestId: command.request.id,
      requestNumber: command.request.requestNumber,
      type: command.type,
      subject: command.subject,
      message: command.message,
      unread: true,
      createdAt: new Date().toISOString()
    });
  }
}

function listNotificationsForUser(user) {
  return state.notifications
    .filter((notification) => notification.userId === user.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function unreadNotificationCount(user) {
  return listNotificationsForUser(user).filter((notification) => notification.unread).length;
}

function markNotificationRead(id, user) {
  const notification = state.notifications.find((item) => item.id === id && item.userId === user.id);
  if (!notification) {
    return null;
  }

  notification.unread = false;
  notification.readAt = new Date().toISOString();
  return notification;
}

function markAllNotificationsRead(user) {
  const now = new Date().toISOString();
  for (const notification of state.notifications) {
    if (notification.userId === user.id && notification.unread) {
      notification.unread = false;
      notification.readAt = now;
    }
  }

  return listNotificationsForUser(user);
}

function markRequestNotificationsReadForUser(requestId, user) {
  const now = new Date().toISOString();
  for (const notification of state.notifications) {
    if (notification.userId === user.id && notification.requestId === requestId && notification.unread) {
      notification.unread = false;
      notification.readAt = now;
    }
  }
}

function transitionRequestStrict(id, user, nextStatus, action, remarks, rules) {
  const request = findRequest(id);
  if (!request) {
    return {
      ok: false,
      status: 404,
      message: 'Request not found.'
    };
  }

  if (rules.fromStatuses?.length && !rules.fromStatuses.includes(request.status)) {
    return {
      ok: false,
      status: 409,
      message: `${action} is not allowed while request is ${request.status}.`
    };
  }

  if (rules.ownerOnly && request.requesterId !== user.id && !user.roles.includes('Admin')) {
    return {
      ok: false,
      status: 403,
      message: 'Only the requester can perform this action.'
    };
  }

  if (rules.requiredRoles?.length && !user.roles.some((role) => rules.requiredRoles.includes(role)) && !user.roles.includes('Admin')) {
    return {
      ok: false,
      status: 403,
      message: 'You do not have permission to perform this action.'
    };
  }

  if (rules.requireRemarks && !String(remarks ?? '').trim()) {
    return {
      ok: false,
      status: 400,
      message: `${action} remarks are required.`
    };
  }

  if (rules.requiredDisbursementStatus && financeStatus(request) !== rules.requiredDisbursementStatus) {
    return {
      ok: false,
      status: 409,
      message: `${action} is only allowed after Finance status is ${rules.requiredDisbursementStatus}.`
    };
  }

  return {
    ok: true,
    request: transitionRequest(id, user, nextStatus, action, remarks)
  };
}

function financeStatus(request) {
  return request.disbursementStatus ?? 'Pending';
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

function updateDisbursementStatus(id, user, nextStatus) {
  const request = findRequest(id);
  const allowedStatuses = ['Pending', 'InProcess', 'Processed', 'OnHold'];

  if (!request) {
    return {
      ok: false,
      status: 404,
      message: 'Request not found.'
    };
  }

  if (!user.roles.includes('FinanceViewer') && !user.roles.includes('Admin')) {
    return {
      ok: false,
      status: 403,
      message: 'Only Finance can update disbursement status.'
    };
  }

  if (request.requestType !== 'Expense') {
    return {
      ok: false,
      status: 409,
      message: 'Only expense requests can be processed in the Finance queue.'
    };
  }

  if (request.status !== 'Approved') {
    return {
      ok: false,
      status: 409,
      message: `Finance status cannot be changed while request is ${request.status}.`
    };
  }

  if (!allowedStatuses.includes(nextStatus)) {
    return {
      ok: false,
      status: 400,
      message: `Finance status must be one of: ${allowedStatuses.join(', ')}.`
    };
  }

  request.disbursementStatus = nextStatus;
  request.updatedAt = new Date().toISOString();
  addAuditLog(request, user, 'Finance Status Updated', `Finance status changed to ${financeStatusLabel(nextStatus)}.`);
  markRequestNotificationsReadForUser(request.id, user);
  addWorkflowNotifications(request, user, 'Finance Status Updated');

  return {
    ok: true,
    request
  };
}

function addAuditLog(request, user, action, remarks) {
  state.auditLogs.unshift({
    id: crypto.randomUUID(),
    requestId: request.id,
    requestNumber: request.requestNumber,
    actorId: user?.id ?? 'system',
    actorName: user?.fullName ?? 'System',
    actorRole: user?.roles?.join(', ') ?? 'System',
    action,
    remarks,
    createdAt: new Date().toISOString()
  });
}

function auditTrail(requestId) {
  return state.auditLogs
    .filter((log) => log.requestId === requestId || log.requestNumber === requestId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function nextRequestNumber() {
  const year = new Date().getFullYear();
  const count = state.requests.filter((request) => request.requestNumber.startsWith(`EXP-${year}-`)).length + 1;
  return `EXP-${year}-${String(count).padStart(6, '0')}`;
}

function normalizeLineItems(items) {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 1);
    const unitAmount = Number(item.unitAmount ?? 0);
    return {
      id: item.id ?? crypto.randomUUID(),
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

module.exports = {
  state,
  publicUser,
  findUserByEmail,
  findUserById,
  findUsersByRole,
  listRequestsForUser,
  findRequest,
  requestDashboardSummary,
  userCanReadRequest,
  canUploadAttachment,
  canEditRequest,
  findLineItem,
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
  listNotificationsForUser,
  unreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  markRequestNotificationsReadForUser
};
