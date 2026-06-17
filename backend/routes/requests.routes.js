const crypto = require('crypto');
const express = require('express');
const store = require('../store/dummy-store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  return res.json(store.listRequestsForUser(req.user));
});

router.post('/drafts', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  const request = store.createRequest(req.body, req.user, false);
  return res.status(201).json(request);
});

router.post('/submit', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  if (req.body.id) {
    const request = store.transitionRequest(req.body.id, req.user, 'PendingEndorsement', 'Submitted');
    return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
  }

  const request = store.createRequest(req.body, req.user, true);
  return res.status(201).json(request);
});

router.patch('/:id/draft', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  const request = store.updateDraft(req.params.id, req.body, req.user);
  return request ? res.json(request) : res.status(404).json({ message: 'Draft request not found or cannot be edited.' });
});

router.delete('/:id/draft', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  const deleted = store.deleteDraft(req.params.id, req.user);
  return deleted ? res.status(204).send() : res.status(404).json({ message: 'Draft request not found or cannot be deleted.' });
});

router.get('/:id', (req, res) => {
  const request = store.findRequest(req.params.id);
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.post('/:id/cancel', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  const request = store.transitionRequest(req.params.id, req.user, 'Cancelled', 'Cancelled', req.body.remarks);
  return request ? res.json(request) : res.status(404).json({ message: 'Request not found.' });
});

router.get('/:requestId/line-items', (req, res) => {
  const request = store.findRequest(req.params.requestId);
  return request ? res.json(request.lineItems) : res.status(404).json({ message: 'Request not found.' });
});

router.post('/:requestId/line-items', requireAnyRole(['Requester', 'Admin']), (req, res) => {
  const request = store.findRequest(req.params.requestId);
  if (!request) {
    return res.status(404).json({ message: 'Request not found.' });
  }

  const quantity = Number(req.body.quantity ?? 1);
  const unitAmount = Number(req.body.unitAmount ?? 0);
  const lineItem = {
    id: crypto.randomUUID(),
    ...req.body,
    quantity,
    unitAmount,
    lineTotal: quantity * unitAmount
  };
  request.lineItems.push(lineItem);
  request.totalAmount = request.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  request.updatedAt = new Date().toISOString();
  return res.status(201).json(lineItem);
});

router.get('/:requestId/line-items/:lineItemId/attachments', (_req, res) => {
  return res.json([]);
});

router.get('/:requestId/line-items/:lineItemId/links', (req, res) => {
  const request = store.findRequest(req.params.requestId);
  const lineItem = request?.lineItems.find((item) => item.id === req.params.lineItemId);
  return lineItem ? res.json([{ type: 'Other', url: lineItem.sellerLink }].filter((link) => link.url)) : res.status(404).json({ message: 'Line item not found.' });
});

module.exports = router;
