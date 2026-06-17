const crypto = require('crypto');
const express = require('express');
const store = require('../store/dummy-store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/health', (_req, res) => {
  return res.json({ status: 'ok', service: 'it-expense-api', timestamp: new Date().toISOString() });
});

router.use('/budgets', requireAuth, requireAnyRole(['FinanceViewer', 'Admin']));
router.get('/budgets', (_req, res) => res.json([{ id: 'budget-2026-q3-itops-hw', period: '2026-Q3', department: 'IT Operations', category: 'Hardware', budget: 500000, actual: 310000, available: 190000 }]));
router.post('/budgets/upload', (_req, res) => res.status(202).json({ message: 'Dummy budget upload accepted.' }));
router.get('/budgets/availability', (_req, res) => res.json({ available: 190000, status: 'Healthy' }));
router.get('/budgets/threshold-alerts', (_req, res) => res.json([]));

router.use('/disbursement', requireAuth, requireAnyRole(['FinanceViewer', 'Admin']));
router.get('/disbursement/accounting', (_req, res) => res.json(store.state.requests.filter((request) => request.status === 'Approved')));
router.get('/disbursement/purchasing', (_req, res) => res.json([]));
router.patch('/disbursement/:id/status', (req, res) => res.json({ id: req.params.id, status: req.body.status ?? 'InProcess' }));

router.use('/purchase-requests', requireAuth);
router.get('/purchase-requests', (_req, res) => res.json([]));
router.get('/purchase-requests/line-items/:lineItemId/quotation-comparison', (req, res) => res.json({ lineItemId: req.params.lineItemId, quotes: [] }));
router.patch('/purchase-requests/:id/delivery', (req, res) => res.json({ id: req.params.id, deliveryStatus: req.body.deliveryStatus ?? 'Pending' }));

router.use('/reimbursements', requireAuth);
router.get('/reimbursements', (_req, res) => res.json([]));
router.post('/reimbursements/submit', (req, res) => res.status(201).json({ id: crypto.randomUUID(), ...req.body, status: 'PendingEndorsement' }));
router.patch('/reimbursements/:id/payment-status', (req, res) => res.json({ id: req.params.id, paymentStatus: req.body.paymentStatus ?? 'Pending' }));

router.use('/notifications', requireAuth);
router.get('/notifications', (_req, res) => res.json([{ id: 'notif-1', subject: 'New endorsement required', unread: true }]));
router.get('/notifications/unread-count', (_req, res) => res.json({ count: 1 }));
router.patch('/notifications/:id/read', (req, res) => res.json({ id: req.params.id, unread: false }));

router.get('/files/:fileId/download', requireAuth, (req, res) => {
  return res.json({ message: 'Dummy file endpoint. Real file streaming will be added with storage integration.', fileId: req.params.fileId });
});

router.get('/jobs/notifications', requireAuth, requireAnyRole(['Admin']), (_req, res) => res.json({ status: 'idle' }));
router.get('/storage/check', requireAuth, requireAnyRole(['Admin']), (_req, res) => res.json({ status: 'ok', provider: 'dummy-local' }));

module.exports = router;
