const crypto = require('crypto');
const data = require('../data/dummy-data');

const state = {
  users: [...data.users],
  departments: [...data.departments],
  costCenters: [...data.costCenters],
  categories: [...data.categories],
  projects: [...data.projects],
  requests: [...data.requests],
  auditLogs: [...data.auditLogs]
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
  return request;
}

function updateDraft(id, command, user) {
  const request = findRequest(id);
  if (!request || request.status !== 'Draft' || (request.requesterId !== user.id && !user.roles.includes('Admin'))) {
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

  addAuditLog(request, user, 'Updated Draft');
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
    request.submittedAt = request.submittedAt ?? now;
  }

  addAuditLog(request, user, action, remarks);
  return request;
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
  return state.auditLogs.filter((log) => log.requestId === requestId || log.requestNumber === requestId);
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
      category: item.category ?? 'Hardware',
      categoryId: item.categoryId,
      description: item.description,
      vendor: item.vendor,
      quantity,
      unitAmount,
      lineTotal: quantity * unitAmount,
      sellerLink: item.sellerLink
    };
  });
}

module.exports = {
  state,
  publicUser,
  findUserByEmail,
  findUserById,
  listRequestsForUser,
  findRequest,
  createRequest,
  updateDraft,
  deleteDraft,
  transitionRequest,
  auditTrail
};
