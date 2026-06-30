const express = require('express');
const store = require('../store');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/users', async (_req, res) => res.json(store.listUsers ? await store.listUsers() : store.state.users.map(store.publicUser)));
router.get('/departments', async (_req, res) => res.json(store.listDepartments ? await store.listDepartments() : store.state.departments));
router.get('/cost-centers', async (_req, res) => res.json(store.listCostCenters ? await store.listCostCenters() : store.state.costCenters));
router.get('/expense-categories', async (_req, res) => res.json(store.listCategories ? await store.listCategories() : store.state.categories));
router.get('/projects', async (_req, res) => res.json(store.listProjects ? await store.listProjects() : store.state.projects));

router.get('/approval-matrix', async (_req, res) => {
  if (store.listApprovalMatrix) {
    return res.json(await store.listApprovalMatrix());
  }

  return res.json([
    { id: 'matrix-1', departmentId: 'it-operations', categoryId: 'hardware', amountMin: 0, amountMax: 100000, endorserRole: 'Endorser', approverRole: 'Approver' },
    { id: 'matrix-2', departmentId: 'it-operations', categoryId: 'hardware', amountMin: 100001, amountMax: null, endorserRole: 'Endorser', approverRole: 'Approver', secondaryApproverRole: 'FinanceViewer' },
    { id: 'matrix-3', departmentId: 'cybersecurity', categoryId: 'software', amountMin: 0, amountMax: null, endorserRole: 'Endorser', approverRole: 'Approver' }
  ]);
});

router.get('/coa-accounts', async (_req, res) => {
  if (store.listCoaAccounts) {
    return res.json(await store.listCoaAccounts());
  }

  return res.json([
    { id: 'coa-6100', code: '6100', name: 'IT Hardware Expense', parent: 'Operating Expense', active: true },
    { id: 'coa-6200', code: '6200', name: 'IT Software Subscription', parent: 'Operating Expense', active: true },
    { id: 'coa-6300', code: '6300', name: 'Cloud Services', parent: 'Operating Expense', active: true }
  ]);
});

module.exports = router;
