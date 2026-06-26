const express = require('express');
const store = require('../store/dummy-store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/endorsements', requireAnyRole(['Endorser', 'Admin']), (req, res) => {
  return res.json(store.listRequestsForUser(req.user).filter((request) => request.status === 'PendingEndorsement'));
});

router.get('/approvals', requireAnyRole(['Approver', 'Admin']), (req, res) => {
  return res.json(store.listRequestsForUser(req.user).filter((request) => request.status === 'PendingApproval'));
});

router.get('/audit-trail', requireAnyRole(['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin']), (req, res) => {
  const visibleRequestIds = new Set(store.listRequestsForUser(req.user).map((request) => request.id));
  return res.json(store.state.auditLogs.filter((log) => visibleRequestIds.has(log.requestId)));
});

router.post('/requests/:id/endorse', requireAnyRole(['Endorser', 'Admin']), (req, res) => {
  const result = store.transitionRequestStrict(req.params.id, req.user, 'PendingApproval', 'Endorsed', req.body.remarks, {
    fromStatuses: ['PendingEndorsement'],
    requiredRoles: ['Endorser']
  });
  return sendTransitionResult(res, result);
});

router.post('/requests/:id/approve', requireAnyRole(['Approver', 'Admin']), (req, res) => {
  const result = store.transitionRequestStrict(req.params.id, req.user, 'Approved', 'Approved', req.body.remarks, {
    fromStatuses: ['PendingApproval'],
    requiredRoles: ['Approver']
  });
  return sendTransitionResult(res, result);
});

router.post('/requests/:id/return', requireAnyRole(['Endorser', 'Approver', 'Admin']), (req, res) => {
  return sendReviewTransition(req, res, 'Returned', 'Returned');
});

router.post('/requests/:id/reject', requireAnyRole(['Endorser', 'Approver', 'Admin']), (req, res) => {
  return sendReviewTransition(req, res, 'Rejected', 'Rejected');
});

router.post('/requests/:id/close', requireAnyRole(['FinanceViewer', 'Admin']), (req, res) => {
  const result = store.transitionRequestStrict(req.params.id, req.user, 'Closed', 'Closed', req.body.remarks ?? 'Closed after Finance processing.', {
    fromStatuses: ['Approved'],
    requiredRoles: ['FinanceViewer'],
    requiredDisbursementStatus: 'Processed'
  });
  if (result.ok) {
    store.markRequestNotificationsReadForUser(result.request.id, req.user);
  }
  return sendTransitionResult(res, result);
});

router.get('/requests/:id/audit-trail', (req, res) => {
  const request = store.findRequest(req.params.id);
  if (!request || !store.userCanReadRequest(req.user, request)) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  return res.json(store.auditTrail(req.params.id));
});

module.exports = router;

function sendTransitionResult(res, result) {
  return result.ok ? res.json(result.request) : res.status(result.status).json({ message: result.message });
}

function sendReviewTransition(req, res, nextStatus, action) {
  const request = store.findRequest(req.params.id);
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

  const result = store.transitionRequestStrict(req.params.id, req.user, nextStatus, action, req.body.remarks, {
    fromStatuses: [request.status],
    requiredRoles,
    requireRemarks: true
  });
  return sendTransitionResult(res, result);
}
