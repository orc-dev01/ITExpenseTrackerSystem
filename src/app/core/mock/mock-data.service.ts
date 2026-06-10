import { Injectable } from '@angular/core';

export interface MockMetric {
  label: string;
  value: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}

export interface MockTable {
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number | boolean>>;
}

export interface MockModuleData {
  metrics?: MockMetric[];
  tables: MockTable[];
  notes?: string[];
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly modules: Record<string, MockModuleData> = {
    dashboard: {
      metrics: [
        { label: 'Open Requests', value: '18', tone: 'neutral' },
        { label: 'Pending Approval', value: '7', tone: 'warning' },
        { label: 'Approved This Month', value: 'PHP 428,500', tone: 'success' },
        { label: 'Budget Alerts', value: '2', tone: 'danger' }
      ],
      tables: [
        {
          title: 'Recent Activity',
          columns: ['requestNo', 'title', 'owner', 'status', 'amount'],
          rows: [
            { requestNo: 'EXP-2026-000041', title: 'Laptop refresh for Service Desk', owner: 'Mia Santos', status: 'Pending Approval', amount: 'PHP 184,000' },
            { requestNo: 'EXP-2026-000040', title: 'Firewall license renewal', owner: 'Ramon Cruz', status: 'Endorsed', amount: 'PHP 96,500' },
            { requestNo: 'EXP-2026-000039', title: 'Replacement docking stations', owner: 'Ana Lim', status: 'Approved', amount: 'PHP 42,000' }
          ]
        },
        {
          title: 'Spend By Category',
          columns: ['category', 'approved', 'pending', 'budgetUsed'],
          rows: [
            { category: 'Hardware', approved: 'PHP 310,000', pending: 'PHP 184,000', budgetUsed: '68%' },
            { category: 'Software', approved: 'PHP 118,500', pending: 'PHP 96,500', budgetUsed: '74%' },
            { category: 'Cloud Services', approved: 'PHP 82,000', pending: 'PHP 0', budgetUsed: '51%' }
          ]
        }
      ],
      notes: ['Dashboard is the landing page after login.', 'Charts can be added later when a chart library is approved.']
    },
    requests: {
      metrics: [
        { label: 'Drafts', value: '3', tone: 'neutral' },
        { label: 'Submitted', value: '5', tone: 'neutral' },
        { label: 'Urgent', value: '2', tone: 'warning' },
        { label: 'Returned', value: '1', tone: 'danger' }
      ],
      tables: [
        {
          title: 'My Requests',
          columns: ['requestNo', 'title', 'type', 'department', 'status', 'urgent', 'amount'],
          rows: [
            { requestNo: 'EXP-2026-000041', title: 'Laptop refresh for Service Desk', type: 'Expense', department: 'IT Operations', status: 'Pending Approval', urgent: 'Yes', amount: 'PHP 184,000' },
            { requestNo: 'EXP-2026-000038', title: 'Projector replacement', type: 'Purchase', department: 'Facilities IT', status: 'Returned', urgent: 'No', amount: 'PHP 31,500' },
            { requestNo: 'DRAFT', title: 'USB security keys', type: 'Expense', department: 'Cybersecurity', status: 'Draft', urgent: 'No', amount: 'PHP 18,000' }
          ]
        },
        {
          title: 'Sample Line Items',
          columns: ['category', 'description', 'vendor', 'qty', 'unitAmount', 'lineTotal', 'link'],
          rows: [
            { category: 'Hardware', description: 'Business laptop i7/16GB/512GB', vendor: 'Preferred Supplier A', qty: 4, unitAmount: 'PHP 46,000', lineTotal: 'PHP 184,000', link: 'Marketplace URL' },
            { category: 'Software', description: 'Firewall subscription renewal', vendor: 'Network Vendor', qty: 1, unitAmount: 'PHP 96,500', lineTotal: 'PHP 96,500', link: 'Quotation PDF' }
          ]
        }
      ],
      notes: ['Requesters can save drafts, submit, cancel before endorsement, and view only their own records.']
    },
    endorsements: {
      metrics: [
        { label: 'Waiting Endorsement', value: '6', tone: 'warning' },
        { label: 'Urgent', value: '2', tone: 'danger' },
        { label: 'Returned Today', value: '1', tone: 'neutral' }
      ],
      tables: [
        {
          title: 'Endorsement Queue',
          columns: ['requestNo', 'requester', 'department', 'title', 'age', 'urgent', 'amount'],
          rows: [
            { requestNo: 'EXP-2026-000044', requester: 'Lara Reyes', department: 'Cybersecurity', title: 'Incident response tool renewal', age: '28h', urgent: 'Yes', amount: 'PHP 74,000' },
            { requestNo: 'EXP-2026-000043', requester: 'Ben Yu', department: 'Infrastructure', title: 'UPS battery replacement', age: '12h', urgent: 'No', amount: 'PHP 53,200' }
          ]
        }
      ],
      notes: ['Endorsers can endorse, return with remarks, or reject with remarks. Urgent items are pinned first.']
    },
    approvals: {
      metrics: [
        { label: 'Waiting Approval', value: '7', tone: 'warning' },
        { label: 'Over Threshold', value: '3', tone: 'danger' },
        { label: 'Approved Today', value: '4', tone: 'success' }
      ],
      tables: [
        {
          title: 'Approval Queue',
          columns: ['requestNo', 'endorsedBy', 'category', 'title', 'budgetWarning', 'amount'],
          rows: [
            { requestNo: 'EXP-2026-000041', endorsedBy: 'Noel Tan', category: 'Hardware', title: 'Laptop refresh for Service Desk', budgetWarning: 'Within Budget', amount: 'PHP 184,000' },
            { requestNo: 'EXP-2026-000040', endorsedBy: 'Rina Chua', category: 'Software', title: 'Firewall license renewal', budgetWarning: 'Near Threshold', amount: 'PHP 96,500' }
          ]
        }
      ],
      notes: ['Approvers see full request detail, files, seller links, endorsement history, and budget warnings.']
    },
    audit: {
      tables: [
        {
          title: 'Workflow Log',
          columns: ['timestamp', 'requestNo', 'actor', 'role', 'action', 'remarks'],
          rows: [
            { timestamp: '2026-06-10 09:12', requestNo: 'EXP-2026-000041', actor: 'Mia Santos', role: 'Requester', action: 'Submitted', remarks: 'For Q3 refresh' },
            { timestamp: '2026-06-10 10:25', requestNo: 'EXP-2026-000041', actor: 'Noel Tan', role: 'Endorser', action: 'Endorsed', remarks: 'Validated need' },
            { timestamp: '2026-06-10 11:04', requestNo: 'EXP-2026-000038', actor: 'Ramon Cruz', role: 'Approver', action: 'Returned', remarks: 'Attach updated quotation' }
          ]
        }
      ],
      notes: ['Audit records are append-only in the future backend. No edit/delete UI should be built for this table.']
    },
    departments: {
      tables: [
        {
          title: 'Departments',
          columns: ['code', 'name', 'manager', 'costCenter', 'active'],
          rows: [
            { code: 'ITOPS', name: 'IT Operations', manager: 'Noel Tan', costCenter: 'CC-IT-001', active: 'Yes' },
            { code: 'CYBER', name: 'Cybersecurity', manager: 'Rina Chua', costCenter: 'CC-IT-002', active: 'Yes' },
            { code: 'INFRA', name: 'Infrastructure', manager: 'Marco Uy', costCenter: 'CC-IT-003', active: 'Yes' }
          ]
        }
      ]
    },
    costCenters: {
      tables: [
        {
          title: 'Cost Centers',
          columns: ['code', 'department', 'description', 'active'],
          rows: [
            { code: 'CC-IT-001', department: 'IT Operations', description: 'Service Desk and end-user support', active: 'Yes' },
            { code: 'CC-IT-002', department: 'Cybersecurity', description: 'Security tools and compliance', active: 'Yes' },
            { code: 'CC-IT-003', department: 'Infrastructure', description: 'Network, server, and cloud operations', active: 'Yes' }
          ]
        }
      ]
    },
    categories: {
      tables: [
        {
          title: 'Expense Categories',
          columns: ['code', 'name', 'glAccount', 'active'],
          rows: [
            { code: 'HW', name: 'Hardware', glAccount: 'Pending Phase 2', active: 'Yes' },
            { code: 'SW', name: 'Software', glAccount: 'Pending Phase 2', active: 'Yes' },
            { code: 'CLOUD', name: 'Cloud Services', glAccount: 'Pending Phase 2', active: 'Yes' }
          ]
        }
      ]
    },
    users: {
      tables: [
        {
          title: 'Users And Roles',
          columns: ['name', 'email', 'department', 'roles', 'manager'],
          rows: [
            { name: 'Mia Santos', email: 'mia.santos@example.com', department: 'IT Operations', roles: 'Requester', manager: 'Noel Tan' },
            { name: 'Noel Tan', email: 'noel.tan@example.com', department: 'IT Operations', roles: 'Endorser', manager: 'IT Director' },
            { name: 'Ramon Cruz', email: 'ramon.cruz@example.com', department: 'IT', roles: 'Approver, Admin', manager: 'COO' },
            { name: 'Paula Dizon', email: 'paula.dizon@example.com', department: 'Finance', roles: 'FinanceViewer', manager: 'Finance Head' }
          ]
        }
      ]
    },
    projects: {
      tables: [
        {
          title: 'Projects',
          columns: ['code', 'name', 'department', 'status'],
          rows: [
            { code: 'Q3-REFRESH', name: 'Q3 Device Refresh', department: 'IT Operations', status: 'Active' },
            { code: 'SEC-2026', name: 'Security Hardening 2026', department: 'Cybersecurity', status: 'Active' }
          ]
        }
      ]
    },
    reports: {
      metrics: [
        { label: 'Approved Spend', value: 'PHP 428,500', tone: 'success' },
        { label: 'Pending Spend', value: 'PHP 331,700', tone: 'warning' },
        { label: 'Rejected Spend', value: 'PHP 27,300', tone: 'danger' }
      ],
      tables: [
        {
          title: 'Period Summary',
          columns: ['department', 'hardware', 'software', 'cloud', 'total'],
          rows: [
            { department: 'IT Operations', hardware: 'PHP 226,000', software: 'PHP 0', cloud: 'PHP 0', total: 'PHP 226,000' },
            { department: 'Cybersecurity', hardware: 'PHP 0', software: 'PHP 170,500', cloud: 'PHP 42,000', total: 'PHP 212,500' }
          ]
        }
      ],
      notes: ['Finance exports approved requests to CSV. GL code export becomes active in Phase 2.']
    },
    budgets: {
      metrics: [
        { label: 'Annual Budget', value: 'PHP 1,800,000', tone: 'neutral' },
        { label: 'Committed', value: 'PHP 760,200', tone: 'warning' },
        { label: 'Available', value: 'PHP 1,039,800', tone: 'success' }
      ],
      tables: [
        {
          title: 'Budget Lines',
          columns: ['period', 'department', 'category', 'costCenter', 'budget', 'actual', 'available', 'status'],
          rows: [
            { period: '2026-Q3', department: 'IT Operations', category: 'Hardware', costCenter: 'CC-IT-001', budget: 'PHP 500,000', actual: 'PHP 310,000', available: 'PHP 190,000', status: 'Healthy' },
            { period: '2026-Q3', department: 'Cybersecurity', category: 'Software', costCenter: 'CC-IT-002', budget: 'PHP 230,000', actual: 'PHP 170,500', available: 'PHP 59,500', status: 'Near Threshold' }
          ]
        }
      ],
      notes: ['Budget upload is Phase 2. The frontend is prepared for CSV/Excel upload once backend parsing exists.']
    },
    disbursementAccounting: {
      tables: [
        {
          title: 'Accounting Queue',
          columns: ['requestNo', 'payee', 'category', 'amount', 'status', 'processor'],
          rows: [
            { requestNo: 'EXP-2026-000039', payee: 'Supplier B', category: 'Hardware', amount: 'PHP 42,000', status: 'Pending', processor: 'Paula Dizon' },
            { requestNo: 'EXP-2026-000037', payee: 'Cloud Provider', category: 'Cloud Services', amount: 'PHP 82,000', status: 'In Process', processor: 'Luis Garcia' }
          ]
        }
      ]
    },
    disbursementPurchasing: {
      tables: [
        {
          title: 'Purchasing Queue',
          columns: ['requestNo', 'item', 'vendor', 'expectedDelivery', 'status'],
          rows: [
            { requestNo: 'EXP-2026-000041', item: 'Business laptops', vendor: 'Preferred Supplier A', expectedDelivery: '2026-06-24', status: 'Pending PO' },
            { requestNo: 'EXP-2026-000036', item: 'Network switches', vendor: 'Network Vendor', expectedDelivery: '2026-06-18', status: 'Ordered' }
          ]
        }
      ]
    },
    procurement: {
      tables: [
        {
          title: 'Purchase Requests',
          columns: ['requestNo', 'item', 'seller1', 'seller2', 'selected', 'deliveryStatus'],
          rows: [
            { requestNo: 'PR-2026-000012', item: 'Docking station', seller1: 'Lazada PHP 7,200', seller2: 'Shopee PHP 7,050', selected: 'Shopee', deliveryStatus: 'For Approval' },
            { requestNo: 'PR-2026-000011', item: 'Webcam kit', seller1: 'Amazon PHP 4,800', seller2: 'Local Vendor PHP 5,100', selected: 'Amazon', deliveryStatus: 'In Transit' }
          ]
        }
      ],
      notes: ['Phase 3 can resolve marketplace links later. Phase 1 stores URLs only.']
    },
    reimbursements: {
      tables: [
        {
          title: 'Reimbursements',
          columns: ['requestNo', 'employee', 'vendor', 'receiptDate', 'category', 'amount', 'status'],
          rows: [
            { requestNo: 'REB-2026-000006', employee: 'Ana Lim', vendor: 'Datablitz', receiptDate: '2026-06-08', category: 'Hardware', amount: 'PHP 5,200', status: 'Pending Endorsement' },
            { requestNo: 'REB-2026-000005', employee: 'Ben Yu', vendor: 'Microsoft', receiptDate: '2026-06-04', category: 'Software', amount: 'PHP 3,900', status: 'Approved' }
          ]
        }
      ]
    },
    notifications: {
      metrics: [
        { label: 'Unread', value: '5', tone: 'warning' },
        { label: 'Failed Emails', value: '1', tone: 'danger' }
      ],
      tables: [
        {
          title: 'Notification Queue',
          columns: ['recipient', 'type', 'requestNo', 'subject', 'status'],
          rows: [
            { recipient: 'noel.tan@example.com', type: 'Email', requestNo: 'EXP-2026-000044', subject: 'New endorsement required', status: 'Pending' },
            { recipient: 'mia.santos@example.com', type: 'In App', requestNo: 'EXP-2026-000041', subject: 'Request endorsed', status: 'Unread' }
          ]
        }
      ]
    },
    approvalMatrix: {
      tables: [
        {
          title: 'Approval Matrix',
          columns: ['department', 'category', 'amountRange', 'endorser', 'approver', 'secondaryApprover'],
          rows: [
            { department: 'IT Operations', category: 'Hardware', amountRange: '0 - 100,000', endorser: 'Department Head', approver: 'IT Director', secondaryApprover: 'None' },
            { department: 'IT Operations', category: 'Hardware', amountRange: '100,001+', endorser: 'Department Head', approver: 'IT Director', secondaryApprover: 'Finance Head' },
            { department: 'Cybersecurity', category: 'Software', amountRange: 'Any', endorser: 'Security Lead', approver: 'IT Director', secondaryApprover: 'Finance Head if over threshold' }
          ]
        }
      ],
      notes: ['This must be editable by Admin without code deployment.']
    },
    referenceData: {
      tables: [
        {
          title: 'Chart Of Accounts',
          columns: ['code', 'name', 'parent', 'active'],
          rows: [
            { code: '6100', name: 'IT Hardware Expense', parent: 'Operating Expense', active: 'Yes' },
            { code: '6200', name: 'IT Software Subscription', parent: 'Operating Expense', active: 'Yes' },
            { code: '6300', name: 'Cloud Services', parent: 'Operating Expense', active: 'Yes' }
          ]
        }
      ]
    },
    account: {
      tables: [
        {
          title: 'Current User',
          columns: ['field', 'value'],
          rows: [
            { field: 'Name', value: 'Demo Admin' },
            { field: 'Roles', value: 'Requester, Endorser, Approver, FinanceViewer, Admin' },
            { field: 'Department', value: 'IT' },
            { field: 'Auth Mode', value: 'Development Mock Session' }
          ]
        }
      ]
    },
    utilities: {
      tables: [
        {
          title: 'System Checks',
          columns: ['check', 'target', 'status'],
          rows: [
            { check: 'API Health', target: '/health', status: 'Pending Backend' },
            { check: 'Notification Jobs', target: '/jobs/notifications', status: 'Pending Backend' },
            { check: 'File Storage', target: '/storage/check', status: 'Pending Backend' }
          ]
        }
      ]
    }
  };

  getModuleData(key: string | undefined): MockModuleData | null {
    if (!key) {
      return null;
    }
    return this.modules[key] ?? null;
  }
}
