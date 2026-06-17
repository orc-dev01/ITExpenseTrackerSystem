const express = require('express');
const store = require('../store/dummy-store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/endorsements', requireAnyRole(['Endorser', 'Admin']), (_req, res) => {
  return res.json(store.state.requests.filter((request) => request.status === 'PendingEndorsement'));
});

router.get('/approvals', requireAnyRole(['Approver', 'Admin']), (_req, res) => {
  return res.json(store.state.requests.filter((request) => request.status === 'PendingApproval'));
});

router.post('/requests/:id/endorse', requireAnyRole(['Endorser', 'Admin']), (req, res) => {
  const request = store.transitionRequest(req.params.id, req.user, 'PendingApproval', 'Endorsed', req.body.remarks);
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.post('/requests/:id/approve', requireAnyRole(['Approver', 'Admin']), (req, res) => {
  const request = store.transitionRequest(req.params.id, req.user, 'Approved', 'Approved', req.body.remarks);
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.post('/requests/:id/return', requireAnyRole(['Endorser', 'Approver', 'Admin']), (req, res) => {
  const request = store.transitionRequest(req.params.id, req.user, 'Returned', 'Returned', req.body.remarks ?? 'Needs revision.');
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.post('/requests/:id/reject', requireAnyRole(['Endorser', 'Approver', 'Admin']), (req, res) => {
  const request = store.transitionRequest(req.params.id, req.user, 'Rejected', 'Rejected', req.body.remarks ?? 'Rejected during review.');
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.get('/requests/:id/audit-trail', (req, res) => {
  return res.json(store.auditTrail(req.params.id));
});

module.exports = router;
