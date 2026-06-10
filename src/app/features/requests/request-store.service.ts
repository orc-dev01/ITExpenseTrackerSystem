import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { ExpenseRequestStatus, RequestType, UserRole } from '@core/models/domain.model';

const REQUEST_STORAGE_KEY = 'IT_EXPENSE_REQUESTS';
const AUDIT_STORAGE_KEY = 'IT_EXPENSE_AUDIT_LOG';

export interface LocalExpenseLineItem {
  id: string;
  category: string;
  description: string;
  vendor: string;
  quantity: number;
  unitAmount: number;
  sellerLink?: string;
  lineTotal: number;
}

export interface LocalExpenseRequest {
  id: string;
  requestNumber: string;
  title: string;
  justification: string;
  requesterId: string;
  requesterName: string;
  department: string;
  costCenter: string;
  project?: string;
  requestType: RequestType;
  status: ExpenseRequestStatus;
  urgent: boolean;
  totalAmount: number;
  lineItems: LocalExpenseLineItem[];
  remarks?: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
}

export interface LocalAuditLog {
  id: string;
  requestId: string;
  requestNumber: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks?: string;
  createdAt: string;
}

export interface CreateRequestCommand {
  title: string;
  justification: string;
  department: string;
  costCenter: string;
  project?: string;
  requestType: RequestType;
  urgent: boolean;
  lineItem: Omit<LocalExpenseLineItem, 'id' | 'lineTotal'>;
}

@Injectable({ providedIn: 'root' })
export class RequestStoreService {
  private readonly auth = inject(AuthService);
  private readonly requestState = signal<LocalExpenseRequest[]>(this.loadRequests());
  private readonly auditState = signal<LocalAuditLog[]>(this.loadAuditLogs());

  readonly requests = this.requestState.asReadonly();
  readonly auditLogs = this.auditState.asReadonly();
  readonly visibleRequests = computed(() => this.filterForCurrentUser(this.requestState()));

  create(command: CreateRequestCommand, submit: boolean): LocalExpenseRequest {
    const user = this.auth.user();
    if (!user) {
      throw new Error('No current user.');
    }

    const lineTotal = command.lineItem.quantity * command.lineItem.unitAmount;
    const now = new Date().toISOString();
    const request: LocalExpenseRequest = {
      id: crypto.randomUUID(),
      requestNumber: submit ? this.nextRequestNumber() : 'DRAFT',
      title: command.title,
      justification: command.justification,
      requesterId: user.id,
      requesterName: user.fullName,
      department: command.department,
      costCenter: command.costCenter,
      project: command.project,
      requestType: command.requestType,
      status: submit ? 'PendingEndorsement' : 'Draft',
      urgent: command.urgent,
      totalAmount: lineTotal,
      lineItems: [{ ...command.lineItem, id: crypto.randomUUID(), lineTotal }],
      createdAt: now,
      submittedAt: submit ? now : undefined,
      updatedAt: now
    };

    this.saveRequests([request, ...this.requestState()]);
    this.addLog(request, submit ? 'Submitted' : 'Saved Draft');
    return request;
  }

  submit(id: string): void {
    this.transition(id, 'PendingEndorsement', 'Submitted');
  }

  cancel(id: string): void {
    this.transition(id, 'Cancelled', 'Cancelled');
  }

  endorse(id: string): void {
    this.transition(id, 'PendingApproval', 'Endorsed');
  }

  returnRequest(id: string): void {
    this.transition(id, 'Returned', 'Returned', 'Needs revision.');
  }

  reject(id: string): void {
    this.transition(id, 'Rejected', 'Rejected', 'Rejected during review.');
  }

  approve(id: string): void {
    this.transition(id, 'Approved', 'Approved');
  }

  close(id: string): void {
    this.transition(id, 'Closed', 'Closed', 'Marked processed by Finance.');
  }

  resetMockData(): void {
    localStorage.removeItem(REQUEST_STORAGE_KEY);
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    this.requestState.set(this.seedRequests());
    this.auditState.set([]);
    this.persist();
  }

  canAct(status: ExpenseRequestStatus, roles: UserRole[]): string[] {
    if (roles.includes('Admin')) {
      return ['reset'];
    }
    if (roles.includes('Requester') && status === 'Draft') {
      return ['submit', 'cancel'];
    }
    if (roles.includes('Endorser') && status === 'PendingEndorsement') {
      return ['endorse', 'return', 'reject'];
    }
    if (roles.includes('Approver') && status === 'PendingApproval') {
      return ['approve', 'return', 'reject'];
    }
    if (roles.includes('FinanceViewer') && status === 'Approved') {
      return ['close'];
    }
    return [];
  }

  private transition(id: string, status: ExpenseRequestStatus, action: string, remarks?: string): void {
    const updated = this.requestState().map((request) => {
      if (request.id !== id) {
        return request;
      }
      const next = {
        ...request,
        status,
        remarks,
        requestNumber: request.requestNumber === 'DRAFT' && status === 'PendingEndorsement' ? this.nextRequestNumber() : request.requestNumber,
        submittedAt: status === 'PendingEndorsement' ? new Date().toISOString() : request.submittedAt,
        updatedAt: new Date().toISOString()
      };
      this.addLog(next, action, remarks, false);
      return next;
    });
    this.saveRequests(updated);
    this.saveAuditLogs(this.auditState());
  }

  private addLog(request: LocalExpenseRequest, action: string, remarks?: string, persist = true): void {
    const user = this.auth.user();
    const log: LocalAuditLog = {
      id: crypto.randomUUID(),
      requestId: request.id,
      requestNumber: request.requestNumber,
      actorName: user?.fullName ?? 'System',
      actorRole: user?.roles.join(', ') ?? 'System',
      action,
      remarks,
      createdAt: new Date().toISOString()
    };
    this.auditState.update((logs) => [log, ...logs]);
    if (persist) {
      this.saveAuditLogs(this.auditState());
    }
  }

  private filterForCurrentUser(requests: LocalExpenseRequest[]): LocalExpenseRequest[] {
    const user = this.auth.user();
    const roles = user?.roles ?? [];
    if (!user) {
      return [];
    }
    if (roles.includes('Admin')) {
      return requests;
    }
    if (roles.includes('Requester')) {
      return requests.filter((request) => request.requesterId === user.id);
    }
    if (roles.includes('Endorser')) {
      return requests.filter((request) => request.status === 'PendingEndorsement');
    }
    if (roles.includes('Approver')) {
      return requests.filter((request) => request.status === 'PendingApproval');
    }
    if (roles.includes('FinanceViewer')) {
      return requests.filter((request) => request.status === 'Approved' || request.status === 'Closed');
    }
    return [];
  }

  private nextRequestNumber(): string {
    const year = new Date().getFullYear();
    const submittedCount = this.requestState().filter((request) => request.requestNumber.startsWith(`EXP-${year}-`)).length + 1;
    return `EXP-${year}-${String(submittedCount).padStart(6, '0')}`;
  }

  private loadRequests(): LocalExpenseRequest[] {
    const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
    if (!raw) {
      const seed = this.seedRequests();
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      return JSON.parse(raw) as LocalExpenseRequest[];
    } catch {
      return this.seedRequests();
    }
  }

  private loadAuditLogs(): LocalAuditLog[] {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    try {
      return JSON.parse(raw) as LocalAuditLog[];
    } catch {
      return [];
    }
  }

  private saveRequests(requests: LocalExpenseRequest[]): void {
    this.requestState.set(requests);
    this.persist();
  }

  private saveAuditLogs(logs: LocalAuditLog[]): void {
    this.auditState.set(logs);
    this.persist();
  }

  private persist(): void {
    localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(this.requestState()));
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditState()));
  }

  private seedRequests(): LocalExpenseRequest[] {
    const now = new Date().toISOString();
    return [
      this.seedRequest('EXP-2026-000041', 'Laptop refresh for Service Desk', 'Mia Santos', 'usr-requester-001', 'IT Operations', 'Hardware', 184000, 'PendingApproval', true, now),
      this.seedRequest('EXP-2026-000044', 'Incident response tool renewal', 'Lara Reyes', 'usr-seed-002', 'Cybersecurity', 'Software', 74000, 'PendingEndorsement', true, now),
      this.seedRequest('EXP-2026-000039', 'Replacement docking stations', 'Ana Lim', 'usr-seed-003', 'IT Operations', 'Hardware', 42000, 'Approved', false, now),
      this.seedRequest('DRAFT', 'USB security keys', 'Mia Santos', 'usr-requester-001', 'Cybersecurity', 'Hardware', 18000, 'Draft', false, now)
    ];
  }

  private seedRequest(requestNumber: string, title: string, requesterName: string, requesterId: string, department: string, category: string, amount: number, status: ExpenseRequestStatus, urgent: boolean, now: string): LocalExpenseRequest {
    return {
      id: crypto.randomUUID(),
      requestNumber,
      title,
      justification: 'Seeded request for frontend workflow testing.',
      requesterId,
      requesterName,
      department,
      costCenter: 'CC-IT-001',
      requestType: 'Expense',
      status,
      urgent,
      totalAmount: amount,
      lineItems: [{ id: crypto.randomUUID(), category, description: title, vendor: 'Preferred Supplier', quantity: 1, unitAmount: amount, lineTotal: amount, sellerLink: 'https://example.com/item' }],
      createdAt: now,
      submittedAt: status === 'Draft' ? undefined : now,
      updatedAt: now
    };
  }
}
