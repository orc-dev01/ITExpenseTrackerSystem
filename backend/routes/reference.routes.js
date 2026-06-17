const express = require('express');
const store = require('../store/dummy-store');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/users', (_req, res) => res.json(store.state.users.map(store.publicUser)));
router.get('/departments', (_req, res) => res.json(store.state.departments));
router.get('/cost-centers', (_req, res) => res.json(store.state.costCenters));
router.get('/expense-categories', (_req, res) => res.json(store.state.categories));
router.get('/projects', (_req, res) => res.json(store.state.projects));

router.get('/approval-matrix', (_req, res) => {
  return res.json([
    { id: 'matrix-1', departmentId: 'it-operations', categoryId: 'hardware', amountMin: 0, amountMax: 100000, endorserRole: 'Endorser', approverRole: 'Approver' },
    { id: 'matrix-2', departmentId: 'it-operations', categoryId: 'hardware', amountMin: 100001, amountMax: null, endorserRole: 'Endorser', approverRole: 'Approver', secondaryApproverRole: 'FinanceViewer' },
    { id: 'matrix-3', departmentId: 'cybersecurity', categoryId: 'software', amountMin: 0, amountMax: null, endorserRole: 'Endorser', approverRole: 'Approver' }
  ]);
});

router.get('/coa-accounts', (_req, res) => {
  return res.json([
    { id: 'coa-6100', code: '6100', name: 'IT Hardware Expense', parent: 'Operating Expense', active: true },
    { id: 'coa-6200', code: '6200', name: 'IT Software Subscription', parent: 'Operating Expense', active: true },
    { id: 'coa-6300', code: '6300', name: 'Cloud Services', parent: 'Operating Expense', active: true }
  ]);
});

module.exports = router;
