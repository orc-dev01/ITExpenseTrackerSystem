const express = require('express');
const store = require('../store/dummy-store');
const { requireAnyRole, requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/request-dashboard', requireAnyRole(['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin']), (req, res) => {
  return res.json(store.requestDashboardSummary(req.user));
});

router.get('/spend-dashboard', requireAnyRole(['Approver', 'FinanceViewer', 'Admin']), (_req, res) => {
  const approved = sumByStatus(['Approved', 'Closed']);
  const pending = sumByStatus(['PendingEndorsement', 'PendingApproval']);
  return res.json({
    openRequests: store.state.requests.filter((request) => !['Closed', 'Cancelled', 'Rejected'].includes(request.status)).length,
    pendingApproval: store.state.requests.filter((request) => request.status === 'PendingApproval').length,
    approvedSpend: approved,
    pendingSpend: pending,
    byCategory: groupByCategory()
  });
});

router.get('/expense-summary', requireAnyRole(['Approver', 'FinanceViewer', 'Admin']), (_req, res) => {
  return res.json({
    totalRequests: store.state.requests.length,
    totalAmount: store.state.requests.reduce((sum, request) => sum + request.totalAmount, 0),
    byDepartment: groupByDepartment()
  });
});

router.get('/approved-requests.csv', requireAnyRole(['FinanceViewer', 'Admin']), (_req, res) => {
  const approved = store.state.requests.filter((request) => ['Approved', 'Closed'].includes(request.status));
  const rows = [
    ['Request No', 'Title', 'Requester', 'Department', 'Status', 'Amount'],
    ...approved.map((request) => [request.requestNumber, request.title, request.requesterName, request.department, request.status, request.totalAmount])
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="approved-requests.csv"');
  return res.send(rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'));
});

router.get('/gl-export', requireAnyRole(['FinanceViewer', 'Admin']), (_req, res) => {
  return res.json({
    message: 'Dummy GL export endpoint. SQL Server integration will generate real accounting entries here.',
    records: []
  });
});

function sumByStatus(statuses) {
  return store.state.requests.filter((request) => statuses.includes(request.status)).reduce((sum, request) => sum + request.totalAmount, 0);
}

function groupByCategory() {
  const groups = new Map();
  for (const request of store.state.requests) {
    for (const lineItem of request.lineItems) {
      groups.set(lineItem.category, (groups.get(lineItem.category) ?? 0) + lineItem.lineTotal);
    }
  }
  return Array.from(groups.entries()).map(([category, amount]) => ({ category, amount }));
}

function groupByDepartment() {
  const groups = new Map();
  for (const request of store.state.requests) {
    groups.set(request.department, (groups.get(request.department) ?? 0) + request.totalAmount);
  }
  return Array.from(groups.entries()).map(([department, amount]) => ({ department, amount }));
}

module.exports = router;
