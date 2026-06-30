const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const store = require('../store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', async (_req, res) => {
  return res.json(store.health ? await store.health() : { status: 'ok', service: 'it-expense-api', dataStore: 'dummy', timestamp: new Date().toISOString() });
});

router.use('/budgets', requireAuth, requireAnyRole(['FinanceViewer', 'Admin']));
router.get('/budgets', async (_req, res) => res.json(store.budgets ? await store.budgets() : [{ id: 'budget-2026-q3-itops-hw', period: '2026-Q3', department: 'IT Operations', category: 'Hardware', budget: 500000, actual: 310000, available: 190000 }]));
router.post('/budgets/upload', (_req, res) => res.status(202).json({ message: 'Dummy budget upload accepted.' }));
router.get('/budgets/availability', async (_req, res) => res.json(store.budgetAvailability ? await store.budgetAvailability() : { available: 190000, status: 'Healthy' }));
router.get('/budgets/threshold-alerts', async (_req, res) => res.json(store.thresholdAlerts ? await store.thresholdAlerts() : []));

router.use('/disbursement', requireAuth, requireAnyRole(['FinanceViewer', 'Admin']));
router.get('/disbursement/accounting', async (req, res) => {
  const requests = await store.listRequestsForUser(req.user);
  return res.json(
    requests.filter((request) => request.status === 'Approved' && request.requestType === 'Expense')
  );
});
router.get('/disbursement/purchasing', (_req, res) => res.json([]));
router.patch('/disbursement/:id/status', async (req, res) => {
  const result = await store.updateDisbursementStatus(req.params.id, req.user, req.body.status);
  return result.ok ? res.json(result.request) : res.status(result.status).json({ message: result.message });
});

router.use('/purchase-requests', requireAuth);
router.get('/purchase-requests', (_req, res) => res.json([]));
router.get('/purchase-requests/line-items/:lineItemId/quotation-comparison', (req, res) => res.json({ lineItemId: req.params.lineItemId, quotes: [] }));
router.patch('/purchase-requests/:id/delivery', (req, res) => res.json({ id: req.params.id, deliveryStatus: req.body.deliveryStatus ?? 'Pending' }));

router.use('/reimbursements', requireAuth);
router.get('/reimbursements', (_req, res) => res.json([]));
router.post('/reimbursements/submit', (req, res) => res.status(201).json({ id: crypto.randomUUID(), ...req.body, status: 'PendingEndorsement' }));
router.patch('/reimbursements/:id/payment-status', (req, res) => res.json({ id: req.params.id, paymentStatus: req.body.paymentStatus ?? 'Pending' }));

router.use('/notifications', requireAuth);
router.get('/notifications', async (req, res) => res.json(await store.listNotificationsForUser(req.user)));
router.get('/notifications/unread-count', async (req, res) => res.json({ count: await store.unreadNotificationCount(req.user) }));
router.patch('/notifications/read-all', async (req, res) => res.json(await store.markAllNotificationsRead(req.user)));
router.patch('/notifications/:id/read', async (req, res) => {
  const notification = await store.markNotificationRead(req.params.id, req.user);
  return notification ? res.json(notification) : res.status(404).json({ message: 'Notification not found.' });
});

router.get('/files/:fileId/download', requireAuth, async (req, res) => {
  const attachment = await store.findAttachment(req.params.fileId);
  const request = attachment ? await store.findRequest(attachment.requestId) : null;
  if (!attachment || !request || !(await store.userCanReadRequest(req.user, request))) {
    return res.status(404).json({ message: 'File not found.' });
  }

  if (!fs.existsSync(attachment.storagePath)) {
    return res.status(404).json({ message: 'Stored file is missing.' });
  }

  res.setHeader('Content-Type', attachment.contentType);
  return res.download(attachment.storagePath, attachment.fileName);
});

router.get('/jobs/notifications', requireAuth, requireAnyRole(['Admin']), (_req, res) => res.json({ status: 'idle' }));
router.get('/storage/check', requireAuth, requireAnyRole(['Admin']), (_req, res) => res.json({ status: 'ok', provider: 'dummy-local' }));

module.exports = router;
