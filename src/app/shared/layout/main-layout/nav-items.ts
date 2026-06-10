import { UserRole } from '@core/models/domain.model';

export interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Approval Report', path: '/dashboard/approval-report', roles: ['Approver', 'Admin'] },
  { label: 'Requests', path: '/requests', roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin'] },
  { label: 'New Request', path: '/requests/new', roles: ['Requester', 'Admin'] },
  { label: 'Endorsements', path: '/workflow/endorsements', roles: ['Endorser', 'Admin'] },
  { label: 'Approvals', path: '/workflow/approvals', roles: ['Approver', 'Admin'] },
  { label: 'Audit Trail', path: '/workflow/audit', roles: ['Approver', 'FinanceViewer', 'Admin'] },
  { label: 'Maintenance', path: '/maintenance/departments', roles: ['Admin'] },
  { label: 'Reports', path: '/reports/spend', roles: ['Approver', 'FinanceViewer', 'Admin'] },
  { label: 'Budgets', path: '/budgets', roles: ['FinanceViewer', 'Admin'] },
  { label: 'Disbursement', path: '/disbursement/accounting', roles: ['FinanceViewer', 'Admin'] },
  { label: 'Procurement', path: '/procurement', roles: ['Requester', 'Approver', 'FinanceViewer', 'Admin'] },
  { label: 'Reimbursements', path: '/reimbursements', roles: ['Requester', 'FinanceViewer', 'Admin'] },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Admin', path: '/admin/approval-matrix', roles: ['Admin'] },
  { label: 'Account', path: '/account-info' },
  { label: 'Utilities', path: '/utilities/monitoring', roles: ['Admin'] }
];

