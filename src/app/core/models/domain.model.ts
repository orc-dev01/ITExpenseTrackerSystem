export type UserRole = 'Requester' | 'Endorser' | 'Approver' | 'FinanceViewer' | 'Admin';

export type ExpenseRequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'PendingAssignment'
  | 'PendingEndorsement'
  | 'Endorsed'
  | 'PendingApproval'
  | 'Approved'
  | 'Returned'
  | 'Rejected'
  | 'Cancelled'
  | 'Closed';

export type RequestType = 'Expense' | 'Purchase' | 'Reimbursement';
export type LinkType = 'Lazada' | 'Shopee' | 'Ebay' | 'Amazon' | 'Other';
export type DisbursementStatus = 'Pending' | 'InProcess' | 'Processed' | 'OnHold';

export interface ExpenseRequest {
  id: string;
  requestNumber: string;
  title: string;
  justification: string;
  requesterId: string;
  departmentId: string;
  costCenterId: string;
  projectId?: string;
  requestType: RequestType;
  status: ExpenseRequestStatus;
  urgent: boolean;
  totalAmount: number;
  submittedAt?: string;
  createdAt: string;
}

export interface ExpenseLineItem {
  id: string;
  requestId: string;
  categoryId: string;
  description: string;
  vendor?: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
}

export interface WorkflowLogEntry {
  id: string;
  requestId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  remarks?: string;
  ipAddress?: string;
  createdAt: string;
}
