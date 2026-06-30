const express = require('express');
const store = require('../store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/endorsements', requireAnyRole(['Endorser', 'Admin']), async (req, res) => {
  const requests = await store.listRequestsForUser(req.user);
  return res.json(requests.filter((request) => request.status === 'PendingEndorsement'));
});

router.get('/approvals', requireAnyRole(['Approver', 'Admin']), async (req, res) => {
  const requests = await store.listRequestsForUser(req.user);
  return res.json(requests.filter((request) => request.status === 'PendingApproval'));
});

router.get('/audit-trail', requireAnyRole(['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin']), async (req, res) => {
  if (store.listAuditLogsForUser) {
    return res.json(await store.listAuditLogsForUser(req.user));
  }

  const visibleRequestIds = new Set((await store.listRequestsForUser(req.user)).map((request) => request.id));
  return res.json(store.state.auditLogs.filter((log) => visibleRequestIds.has(log.requestId)));
});

router.post('/requests/:id/endorse', requireAnyRole(['Endorser', 'Admin']), async (req, res) => {
  const result = await store.transitionRequestStrict(req.params.id, req.user, 'PendingApproval', 'Endorsed', req.body.remarks, {
    fromStatuses: ['PendingEndorsement'],
    requiredRoles: ['Endorser']
  });
  return sendTransitionResult(res, result);
});

router.post('/requests/:id/approve', requireAnyRole(['Approver', 'Admin']), async (req, res) => {
  const result = await store.transitionRequestStrict(req.params.id, req.user, 'Approved', 'Approved', req.body.remarks, {
    fromStatuses: ['PendingApproval'],
    requiredRoles: ['Approver']
  });
  return sendTransitionResult(res, result);
});

router.post('/requests/:id/return', requireAnyRole(['Endorser', 'Approver', 'Admin']), async (req, res) => {
  return sendReviewTransition(req, res, 'Returned', 'Returned');
});

router.post('/requests/:id/reject', requireAnyRole(['Endorser', 'Approver', 'Admin']), async (req, res) => {
  return sendReviewTransition(req, res, 'Rejected', 'Rejected');
});

router.post('/requests/:id/close', requireAnyRole(['FinanceViewer', 'Admin']), async (req, res) => {
  const result = await store.transitionRequestStrict(req.params.id, req.user, 'Closed', 'Closed', req.body.remarks ?? 'Closed after Finance processing.', {
    fromStatuses: ['Approved'],
    requiredRoles: ['FinanceViewer'],
    requiredDisbursementStatus: 'Processed'
  });
  if (result.ok) {
    await store.markRequestNotificationsReadForUser(result.request.id, req.user);
  }
  return sendTransitionResult(res, result);
});

router.get('/requests/:id/audit-trail', async (req, res) => {
  const request = await store.findRequest(req.params.id);
  if (!request || !(await store.userCanReadRequest(req.user, request))) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  return res.json(await store.auditTrail(req.params.id));
});

module.exports = router;

function sendTransitionResult(res, result) {
  return result.ok ? res.json(result.request) : res.status(result.status).json({ message: result.message });
}

async function sendReviewTransition(req, res, nextStatus, action) {
  const request = await store.findRequest(req.params.id);
  if (!request) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  const rulesByStatus = {
    PendingEndorsement: ['Endorser'],
    PendingApproval: ['Approver']
  };
  const requiredRoles = rulesByStatus[request.status];

  if (!requiredRoles) {
    return res.status(409).json({ message: `${action} is not allowed while request is ${request.status}.` });
  }

  const result = await store.transitionRequestStrict(req.params.id, req.user, nextStatus, action, req.body.remarks, {
    fromStatuses: [request.status],
    requiredRoles,
    requireRemarks: true
  });
  return sendTransitionResult(res, result);
}
