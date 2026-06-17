const now = new Date().toISOString();

const users = [
  {
    id: 'usr-requester-001',
    email: 'requester@test.com',
    password: 'password123',
    fullName: 'Mia Santos',
    departmentId: 'it-operations',
    roles: ['Requester']
  },
  {
    id: 'usr-endorser-001',
    email: 'endorser@test.com',
    password: 'password123',
    fullName: 'Noel Tan',
    departmentId: 'it-operations',
    roles: ['Endorser']
  },
  {
    id: 'usr-approver-001',
    email: 'approver@test.com',
    password: 'password123',
    fullName: 'Ramon Cruz',
    departmentId: 'it',
    roles: ['Approver']
  },
  {
    id: 'usr-finance-001',
    email: 'finance@test.com',
    password: 'password123',
    fullName: 'Paula Dizon',
    departmentId: 'finance',
    roles: ['FinanceViewer']
  },
  {
    id: 'usr-admin-001',
    email: 'admin@test.com',
    password: 'password123',
    fullName: 'Demo Admin',
    departmentId: 'it',
    roles: ['Admin']
  },
  {
    id: 'usr-super-001',
    email: 'super@test.com',
    password: 'password123',
    fullName: 'Super Tester',
    departmentId: 'it',
    roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin']
  }
];

const departments = [
  { id: 'it-operations', code: 'ITOPS', name: 'IT Operations', manager: 'Noel Tan', costCenterId: 'cc-it-001', active: true },
  { id: 'cybersecurity', code: 'CYBER', name: 'Cybersecurity', manager: 'Rina Chua', costCenterId: 'cc-it-002', active: true },
  { id: 'infrastructure', code: 'INFRA', name: 'Infrastructure', manager: 'Marco Uy', costCenterId: 'cc-it-003', active: true }
];

const costCenters = [
  { id: 'cc-it-001', code: 'CC-IT-001', departmentId: 'it-operations', description: 'Service Desk and end-user support', active: true },
  { id: 'cc-it-002', code: 'CC-IT-002', departmentId: 'cybersecurity', description: 'Security tools and compliance', active: true },
  { id: 'cc-it-003', code: 'CC-IT-003', departmentId: 'infrastructure', description: 'Network, server, and cloud operations', active: true }
];

const categories = [
  { id: 'hardware', code: 'HW', name: 'Hardware', glAccount: '6100', active: true },
  { id: 'software', code: 'SW', name: 'Software', glAccount: '6200', active: true },
  { id: 'cloud-services', code: 'CLOUD', name: 'Cloud Services', glAccount: '6300', active: true }
];

const projects = [
  { id: 'q3-refresh', code: 'Q3-REFRESH', name: 'Q3 Device Refresh', departmentId: 'it-operations', status: 'Active' },
  { id: 'sec-2026', code: 'SEC-2026', name: 'Security Hardening 2026', departmentId: 'cybersecurity', status: 'Active' }
];

const requests = [
  {
    id: 'req-000041',
    requestNumber: 'EXP-2026-000041',
    title: 'Laptop refresh for Service Desk',
    justification: 'Replace aging devices used by frontline IT support.',
    requesterId: 'usr-requester-001',
    requesterName: 'Mia Santos',
    department: 'IT Operations',
    departmentId: 'it-operations',
    costCenter: 'CC-IT-001',
    costCenterId: 'cc-it-001',
    projectId: 'q3-refresh',
    requestType: 'Expense',
    status: 'PendingApproval',
    urgent: true,
    totalAmount: 184000,
    createdAt: now,
    submittedAt: now,
    updatedAt: now,
    lineItems: [
      {
        id: 'li-000041-1',
        category: 'Hardware',
        categoryId: 'hardware',
        description: 'Business laptop i7/16GB/512GB',
        vendor: 'Preferred Supplier A',
        quantity: 4,
        unitAmount: 46000,
        lineTotal: 184000,
        sellerLink: 'https://example.com/laptop'
      }
    ]
  },
  {
    id: 'req-000044',
    requestNumber: 'EXP-2026-000044',
    title: 'Incident response tool renewal',
    justification: 'Annual renewal for cybersecurity operations.',
    requesterId: 'usr-seed-002',
    requesterName: 'Lara Reyes',
    department: 'Cybersecurity',
    departmentId: 'cybersecurity',
    costCenter: 'CC-IT-002',
    costCenterId: 'cc-it-002',
    requestType: 'Expense',
    status: 'PendingEndorsement',
    urgent: true,
    totalAmount: 74000,
    createdAt: now,
    submittedAt: now,
    updatedAt: now,
    lineItems: [
      {
        id: 'li-000044-1',
        category: 'Software',
        categoryId: 'software',
        description: 'Incident response platform subscription',
        vendor: 'Security Vendor',
        quantity: 1,
        unitAmount: 74000,
        lineTotal: 74000,
        sellerLink: 'https://example.com/security-tool'
      }
    ]
  },
  {
    id: 'req-000039',
    requestNumber: 'EXP-2026-000039',
    title: 'Replacement docking stations',
    justification: 'Replacement units for hybrid workstations.',
    requesterId: 'usr-seed-003',
    requesterName: 'Ana Lim',
    department: 'IT Operations',
    departmentId: 'it-operations',
    costCenter: 'CC-IT-001',
    costCenterId: 'cc-it-001',
    requestType: 'Expense',
    status: 'Approved',
    urgent: false,
    totalAmount: 42000,
    createdAt: now,
    submittedAt: now,
    updatedAt: now,
    lineItems: [
      {
        id: 'li-000039-1',
        category: 'Hardware',
        categoryId: 'hardware',
        description: 'USB-C docking stations',
        vendor: 'Preferred Supplier B',
        quantity: 6,
        unitAmount: 7000,
        lineTotal: 42000,
        sellerLink: 'https://example.com/docking-station'
      }
    ]
  }
];

const auditLogs = [
  {
    id: 'audit-000041-1',
    requestId: 'req-000041',
    requestNumber: 'EXP-2026-000041',
    actorId: 'usr-requester-001',
    actorName: 'Mia Santos',
    actorRole: 'Requester',
    action: 'Submitted',
    remarks: 'For Q3 refresh.',
    createdAt: now
  },
  {
    id: 'audit-000041-2',
    requestId: 'req-000041',
    requestNumber: 'EXP-2026-000041',
    actorId: 'usr-endorser-001',
    actorName: 'Noel Tan',
    actorRole: 'Endorser',
    action: 'Endorsed',
    remarks: 'Validated business need.',
    createdAt: now
  }
];

module.exports = {
  users,
  departments,
  costCenters,
  categories,
  projects,
  requests,
  auditLogs
};
