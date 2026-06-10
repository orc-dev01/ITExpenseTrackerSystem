export const ApiEndpoints = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me'
  },
  requests: {
    list: '/expense-requests',
    createDraft: '/expense-requests/drafts',
    submit: '/expense-requests/submit',
    detail: (id: string | number) => `/expense-requests/${id}`,
    cancel: (id: string | number) => `/expense-requests/${id}/cancel`,
    lineItems: (requestId: string | number) => `/expense-requests/${requestId}/line-items`,
    attachments: (requestId: string | number, lineItemId: string | number) => `/expense-requests/${requestId}/line-items/${lineItemId}/attachments`,
    links: (requestId: string | number, lineItemId: string | number) => `/expense-requests/${requestId}/line-items/${lineItemId}/links`
  },
  workflow: {
    endorsements: '/workflow/endorsements',
    approvals: '/workflow/approvals',
    endorse: (id: string | number) => `/workflow/requests/${id}/endorse`,
    approve: (id: string | number) => `/workflow/requests/${id}/approve`,
    return: (id: string | number) => `/workflow/requests/${id}/return`,
    reject: (id: string | number) => `/workflow/requests/${id}/reject`,
    auditTrail: (id: string | number) => `/workflow/requests/${id}/audit-trail`
  },
  admin: {
    approvalMatrix: '/admin/approval-matrix',
    users: '/admin/users',
    departments: '/admin/departments',
    costCenters: '/admin/cost-centers',
    categories: '/admin/expense-categories',
    projects: '/admin/projects',
    coaAccounts: '/admin/coa-accounts'
  },
  reports: {
    spendDashboard: '/reports/spend-dashboard',
    expenseSummary: '/reports/expense-summary',
    exportApprovedCsv: '/reports/approved-requests.csv',
    glExport: '/reports/gl-export'
  },
  budgets: {
    list: '/budgets',
    upload: '/budgets/upload',
    availability: '/budgets/availability',
    thresholdAlerts: '/budgets/threshold-alerts'
  },
  disbursement: {
    accountingQueue: '/disbursement/accounting',
    purchasingQueue: '/disbursement/purchasing',
    updateStatus: (id: string | number) => `/disbursement/${id}/status`
  },
  procurement: {
    purchaseRequests: '/purchase-requests',
    quotationComparison: (lineItemId: string | number) => `/purchase-requests/line-items/${lineItemId}/quotation-comparison`,
    delivery: (id: string | number) => `/purchase-requests/${id}/delivery`
  },
  reimbursements: {
    list: '/reimbursements',
    submit: '/reimbursements/submit',
    updatePaymentStatus: (id: string | number) => `/reimbursements/${id}/payment-status`
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (id: string | number) => `/notifications/${id}/read`
  },
  files: {
    download: (fileId: string | number) => `/files/${fileId}/download`
  }
} as const;
