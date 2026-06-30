import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { AuthService } from "@core/auth/auth.service";
import { untracked } from "@angular/core";
import { environment } from "@environments/environment";
import { finalize, Observable } from "rxjs";
import {
  ExpenseRequestStatus,
  DisbursementStatus,
  RequestType,
  UserRole,
} from "@core/models/domain.model";
import { RequestApiService } from "./request-api.service";

const REQUEST_STORAGE_KEY = "IT_EXPENSE_REQUESTS";
const AUDIT_STORAGE_KEY = "IT_EXPENSE_AUDIT_LOG";

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
  disbursementStatus?: DisbursementStatus;
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

export interface LocalAttachment {
  id: string;
  requestId: string;
  lineItemId: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedById: string;
  uploadedByName: string;
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
  lineItems: Omit<LocalExpenseLineItem, "id" | "lineTotal">[];
}

type RequestActionName =
  | "submit"
  | "endorse"
  | "approve"
  | "return"
  | "reject"
  | "close"
  | "cancel";

@Injectable({ providedIn: "root" })
export class RequestStoreService {
  private readonly auth = inject(AuthService);
  private readonly requestApi = inject(RequestApiService);
  private readonly pendingOperationKeys = signal<string[]>([]);
  private messageTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly requestState = signal<LocalExpenseRequest[]>(
    this.loadRequests(),
  );
  private readonly auditState = signal<LocalAuditLog[]>(this.loadAuditLogs());

  readonly requests = this.requestState.asReadonly();
  readonly auditLogs = this.auditState.asReadonly();
  readonly loadingMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isBusy = computed(() => this.pendingOperationKeys().length > 0);
  readonly visibleRequests = computed(() =>
    this.filterForCurrentUser(this.requestState()),
  );

  constructor() {
    effect(() => {
      if (this.auth.user() && this.usesBackend()) {
        untracked(() => this.refreshFromBackend());
      }
    });
  }

  refreshFromBackend(): void {
    if (!this.usesBackend()) {
      return;
    }

    const key = "refresh-requests";
    if (!this.beginOperation(key, "Loading requests from backend...")) {
      return;
    }
    this.requestApi
      .list()
      .pipe(finalize(() => this.endOperation(key)))
      .subscribe({
        next: (requests) => {
          this.requestState.set(requests);
          this.persist();
          this.refreshAuditLogsFromBackend();
        },
        error: (error) => {
          this.requestState.set(this.loadRequests());
          this.showError(this.errorText(error, "Could not load backend requests. Showing cached requests."));
        },
      });
  }

  create(
    command: CreateRequestCommand,
    submit: boolean,
    onSuccess?: (request: LocalExpenseRequest) => void,
  ): LocalExpenseRequest | null {
    if (this.usesBackend()) {
      const key = submit ? "create-submit" : "create-draft";
      if (!this.beginOperation(key, submit ? "Submitting request..." : "Saving draft...")) {
        return null;
      }
      this.requestApi
        .create(command, submit)
        .pipe(finalize(() => this.endOperation(key)))
        .subscribe({
          next: (request) => {
            this.upsertRequest(request);
            this.refreshAuditLogsFromBackend();
            this.showSuccess(
              submit
                ? this.actionSuccessMessage("submit", request)
                : `${this.requestLabel(request)} was saved as a draft.`,
            );
            onSuccess?.(request);
          },
          error: (error) => {
            this.showError(this.errorText(error, submit ? "Request submit failed." : "Draft save failed."));
          }
        });
      return null;
    }

    const request = this.createLocal(command, submit);
    onSuccess?.(request);
    return request;
  }

  private createLocal(
    command: CreateRequestCommand,
    submit: boolean,
  ): LocalExpenseRequest {
    const user = this.auth.user();
    if (!user) {
      throw new Error("No current user.");
    }

    const lineItems = command.lineItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      lineTotal: item.quantity * item.unitAmount,
    }));
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const now = new Date().toISOString();
    const request: LocalExpenseRequest = {
      id: crypto.randomUUID(),
      requestNumber: submit ? this.nextRequestNumber() : "DRAFT",
      title: command.title,
      justification: command.justification,
      requesterId: user.id,
      requesterName: user.fullName,
      department: command.department,
      costCenter: command.costCenter,
      project: command.project,
      requestType: command.requestType,
      status: submit ? "PendingEndorsement" : "Draft",
      urgent: command.urgent,
      totalAmount,
      lineItems,
      createdAt: now,
      submittedAt: submit ? now : undefined,
      updatedAt: now,
    };

    this.saveRequests([request, ...this.requestState()]);
    this.addLog(request, submit ? "Submitted" : "Saved Draft");
    this.showSuccess(
      submit
        ? this.actionSuccessMessage("submit", request)
        : `${this.requestLabel(request)} was saved as a draft.`,
    );
    return request;
  }

  updateEditableRequest(
    id: string,
    command: CreateRequestCommand,
  ): LocalExpenseRequest | null {
    if (this.usesBackend()) {
      const key = this.actionKey("save", id);
      if (!this.beginOperation(key, "Saving request changes...")) {
        return this.requestState().find((request) => request.id === id) ?? null;
      }
      this.requestApi
        .updateEditable(id, command)
        .pipe(finalize(() => this.endOperation(key)))
        .subscribe({
          next: (request) => {
            this.upsertRequest(request);
            this.refreshAuditLogsFromBackend();
            this.showSuccess(`${this.requestLabel(request)} was updated successfully.`);
          },
          error: (error) => {
            this.showError(this.errorText(error, "Request update failed."));
          }
        });
      return this.requestState().find((request) => request.id === id) ?? null;
    }

    return this.updateEditableRequestLocal(id, command);
  }

  saveEditableRequest(
    id: string,
    command: CreateRequestCommand,
    submit: boolean,
    onSuccess?: (request: LocalExpenseRequest) => void,
  ): void {
    if (!this.usesBackend()) {
      const updated = this.updateEditableRequestLocal(id, command);
      if (updated && submit) {
        this.submit(updated.id);
        onSuccess?.(updated);
      } else if (updated) {
        onSuccess?.(updated);
      }
      return;
    }
    const key = this.actionKey(submit ? "resubmit" : "save", id);
    if (!this.beginOperation(key, submit ? "Saving and submitting request..." : "Saving request changes...")) {
      return;
    }

    this.requestApi
      .saveEditable(id, command, submit)
      .pipe(finalize(() => this.endOperation(key)))
      .subscribe({
        next: (request) => {
          this.upsertRequest(request);
          this.refreshAuditLogsFromBackend();
          this.showSuccess(
            submit
              ? this.actionSuccessMessage("submit", request)
              : `${this.requestLabel(request)} was updated successfully.`,
          );
          onSuccess?.(request);
        },
        error: (error) => {
          this.showError(this.errorText(error, submit ? "Request submit failed." : "Request update failed."));
        },
      });
  }

  private updateEditableRequestLocal(
    id: string,
    command: CreateRequestCommand,
  ): LocalExpenseRequest | null {
    const existing = this.requestState().find((request) => request.id === id);
    if (!existing || !this.isRequesterEditable(existing.status)) {
      return null;
    }

    const lineItems = command.lineItems.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
      lineTotal: item.quantity * item.unitAmount,
    }));
    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const updated: LocalExpenseRequest = {
      ...existing,
      title: command.title,
      justification: command.justification,
      department: command.department,
      costCenter: command.costCenter,
      project: command.project,
      requestType: command.requestType,
      urgent: command.urgent,
      totalAmount,
      lineItems,
      updatedAt: new Date().toISOString(),
    };

    this.saveRequests(
      this.requestState().map((request) =>
        request.id === id ? updated : request,
      ),
    );
    this.addLog(
      updated,
      existing.status === "Returned"
        ? "Updated Returned Request"
        : "Updated Draft",
    );
    return updated;
  }

  updateDraft(
    id: string,
    command: CreateRequestCommand,
  ): LocalExpenseRequest | null {
    return this.updateEditableRequest(id, command);
  }

  isRequestPending(id: string): boolean {
    return this.pendingOperationKeys().some((key) => key.endsWith(`:${id}`));
  }

  clearMessages(): void {
    this.clearMessageTimer();
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  submit(id: string): void {
    if (this.usesBackend()) {
      this.runRequestAction("submit", id, this.requestApi.submit(id));
      return;
    }

    this.submitLocal(id);
  }

  deleteDraft(id: string): void {
    if (this.usesBackend()) {
      const key = this.actionKey("delete", id);
      if (!this.beginOperation(key, "Deleting draft...")) {
        return;
      }
      this.requestApi
        .deleteDraft(id)
        .pipe(finalize(() => this.endOperation(key)))
        .subscribe({
          next: () => {
            const deletedRequest = this.requestState().find((request) => request.id === id);
            this.removeRequest(id);
            this.refreshAuditLogsFromBackend();
            this.showSuccess(
              `${deletedRequest ? this.requestLabel(deletedRequest) : "Draft"} was deleted successfully.`,
            );
          },
          error: (error) => {
            this.showError(this.errorText(error, "Draft delete failed."));
          },
        });
      return;
    }

    this.deleteDraftLocal(id);
  }

  private deleteDraftLocal(id: string): void {
    const request = this.requestState().find((item) => item.id === id);
    if (!request || request.status !== "Draft") {
      return;
    }

    this.requestState.set(this.requestState().filter((item) => item.id !== id));
    this.auditState.set(
      this.auditState().filter((log) => log.requestId !== id),
    );
    this.persist();
    this.showSuccess(`${this.requestLabel(request)} was deleted successfully.`);
  }

  cancel(id: string): void {
    if (this.usesBackend()) {
      this.runRequestAction("cancel", id, this.requestApi.cancel(id));
      return;
    }

    this.transition(id, "Cancelled", "Cancelled");
  }

  endorse(id: string): void {
    if (this.usesBackend()) {
      this.runRequestAction("endorse", id, this.requestApi.endorse(id));
      return;
    }

    this.transition(id, "PendingApproval", "Endorsed");
  }

  returnRequest(id: string, remarks = "Needs revision."): void {
    if (this.usesBackend()) {
      this.runRequestAction("return", id, this.requestApi.returnRequest(id, remarks));
      return;
    }

    this.transition(id, "Returned", "Returned", remarks);
  }

  reject(id: string, remarks = "Rejected during review."): void {
    if (this.usesBackend()) {
      this.runRequestAction("reject", id, this.requestApi.reject(id, remarks));
      return;
    }

    this.transition(id, "Rejected", "Rejected", remarks);
  }

  approve(id: string): void {
    if (this.usesBackend()) {
      this.runRequestAction("approve", id, this.requestApi.approve(id));
      return;
    }

    this.transition(id, "Approved", "Approved");
  }

  close(id: string): void {
    if (this.usesBackend()) {
      this.runRequestAction("close", id, this.requestApi.close(id));
      return;
    }

    this.transition(id, "Closed", "Closed", "Closed after Finance processing.");
  }

  resetMockData(): void {
    if (this.usesBackend()) {
      localStorage.removeItem(REQUEST_STORAGE_KEY);
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      this.requestState.set([]);
      this.auditState.set([]);
      this.refreshFromBackend();
      return;
    }

    localStorage.removeItem(REQUEST_STORAGE_KEY);
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    const requests = this.seedRequests();
    this.requestState.set(requests);
    this.auditState.set(this.seedAuditLogs(requests));
    this.persist();
  }

  canAct(
    status: ExpenseRequestStatus,
    roles: UserRole[],
    disbursementStatus?: DisbursementStatus,
  ): string[] {
    const actions: string[] = [];
    if (roles.includes("Requester") && status === "Draft") {
      actions.push("edit", "submit", "delete");
    }
    if (roles.includes("Requester") && status === "Returned") {
      actions.push("edit", "submit");
    }
    if (roles.includes("Endorser") && status === "PendingEndorsement") {
      actions.push("endorse", "return", "reject");
    }
    if (roles.includes("Approver") && status === "PendingApproval") {
      actions.push("approve", "return", "reject");
    }
    if (
      roles.includes("FinanceViewer") &&
      status === "Approved" &&
      disbursementStatus === "Processed"
    ) {
      actions.push("close");
    }
    return actions;
  }

  private transition(
    id: string,
    status: ExpenseRequestStatus,
    action: string,
    remarks?: string,
  ): void {
    let changedRequest: LocalExpenseRequest | null = null;
    const updated = this.requestState().map((request) => {
      if (request.id !== id) {
        return request;
      }
      const next = {
        ...request,
        status,
        disbursementStatus:
          status === "Approved" && request.requestType === "Expense"
            ? "Pending"
            : status === "Closed" && request.requestType === "Expense"
              ? "Processed"
            : request.disbursementStatus,
        remarks,
        requestNumber:
          request.requestNumber === "DRAFT" && status === "PendingEndorsement"
            ? this.nextRequestNumber()
            : request.requestNumber,
        submittedAt:
          status === "PendingEndorsement"
            ? new Date().toISOString()
            : request.submittedAt,
        updatedAt: new Date().toISOString(),
      };
      this.addLog(next, action, remarks, false);
      changedRequest = next;
      return next;
    });
    this.saveRequests(updated);
    this.saveAuditLogs(this.auditState());
    if (changedRequest) {
      this.showSuccess(this.localTransitionSuccessMessage(action, changedRequest));
    }
  }

  private addLog(
    request: LocalExpenseRequest,
    action: string,
    remarks?: string,
    persist = true,
  ): void {
    const user = this.auth.user();
    const log: LocalAuditLog = {
      id: crypto.randomUUID(),
      requestId: request.id,
      requestNumber: request.requestNumber,
      actorName: user?.fullName ?? "System",
      actorRole: user?.roles.join(", ") ?? "System",
      action,
      remarks,
      createdAt: new Date().toISOString(),
    };
    this.auditState.update((logs) => [log, ...logs]);
    if (persist) {
      this.saveAuditLogs(this.auditState());
    }
  }

  private filterForCurrentUser(
    requests: LocalExpenseRequest[],
  ): LocalExpenseRequest[] {
    const user = this.auth.user();
    const roles = user?.roles ?? [];
    if (!user) {
      return [];
    }
    if (roles.includes("Admin")) {
      return requests;
    }
    if (roles.includes("Requester")) {
      return requests.filter((request) => request.requesterId === user.id);
    }
    if (roles.includes("Endorser")) {
      return requests.filter(
        (request) => request.status === "PendingEndorsement",
      );
    }
    if (roles.includes("Approver")) {
      return requests.filter((request) => request.status === "PendingApproval");
    }
    if (roles.includes("FinanceViewer")) {
      return requests.filter(
        (request) =>
          request.status === "Approved" || request.status === "Closed",
      );
    }
    return [];
  }

  private nextRequestNumber(): string {
    const year = new Date().getFullYear();
    const submittedCount =
      this.requestState().filter((request) =>
        request.requestNumber.startsWith(`EXP-${year}-`),
      ).length + 1;
    return `EXP-${year}-${String(submittedCount).padStart(6, "0")}`;
  }

  private isRequesterEditable(status: ExpenseRequestStatus): boolean {
    return status === "Draft" || status === "Returned";
  }

  private usesBackend(): boolean {
    return !environment.mockAuth;
  }

  private refreshAuditLogsFromBackend(): void {
    this.requestApi
      .auditTrail()
      .subscribe({
        next: (logs) => {
          this.auditState.set(logs);
          this.persist();
        },
        error: () => undefined,
      });
  }

  private runRequestAction(
    action: RequestActionName,
    requestId: string,
    request$: Observable<LocalExpenseRequest>,
  ): void {
    const key = this.actionKey(action, requestId);
    if (!this.beginOperation(key, `${this.actionLabel(action)}...`)) {
      return;
    }
    request$
      .pipe(finalize(() => this.endOperation(key)))
      .subscribe({
        next: (request) => {
          this.upsertRequest(request);
          this.refreshAuditLogsFromBackend();
          this.showSuccess(this.actionSuccessMessage(action, request));
        },
        error: (error) => {
          this.showError(this.errorText(error, `${this.actionLabel(action)} failed.`));
        },
      });
  }

  private beginOperation(key: string, message: string): boolean {
    if (this.pendingOperationKeys().includes(key)) {
      return false;
    }

    this.pendingOperationKeys.update((keys) => [...keys, key]);
    this.loadingMessage.set(message);
    this.clearMessages();
    return true;
  }

  private endOperation(key: string): void {
    this.pendingOperationKeys.update((keys) => keys.filter((item) => item !== key));
    if (this.pendingOperationKeys().length === 0) {
      this.loadingMessage.set(null);
    }
  }

  private actionKey(action: string, requestId: string): string {
    return `${action}:${requestId}`;
  }

  private actionLabel(action: string): string {
    const labels: Record<string, string> = {
      submit: "Submit",
      endorse: "Endorse",
      approve: "Approve",
      return: "Return",
      reject: "Reject",
      close: "Close",
      cancel: "Cancel",
      action: "Action"
    };
    return labels[action] ?? "Action";
  }

  private actionSuccessMessage(
    action: RequestActionName,
    request: LocalExpenseRequest,
  ): string {
    const label = this.requestLabel(request);
    const messages: Record<RequestActionName, string> = {
      submit: `${label} was submitted and sent to the Endorser.`,
      endorse: `${label} was endorsed and sent to the Approver.`,
      approve: `${label} was approved and sent to Finance.`,
      return: `${label} was returned to the Requester with your remarks.`,
      reject: `${label} was rejected. The Requester can view your remarks.`,
      close: `${label} was closed by Finance.`,
      cancel: `${label} was cancelled.`,
    };
    return messages[action];
  }

  private localTransitionSuccessMessage(
    action: string,
    request: LocalExpenseRequest,
  ): string {
    const actionMessages: Record<string, string> = {
      Submitted: this.actionSuccessMessage("submit", request),
      Resubmitted: this.actionSuccessMessage("submit", request),
      Endorsed: this.actionSuccessMessage("endorse", request),
      Approved: this.actionSuccessMessage("approve", request),
      Returned: this.actionSuccessMessage("return", request),
      Rejected: this.actionSuccessMessage("reject", request),
      Closed: this.actionSuccessMessage("close", request),
      Cancelled: this.actionSuccessMessage("cancel", request),
    };
    return actionMessages[action] ?? `${this.requestLabel(request)} was updated successfully.`;
  }

  private requestLabel(request: LocalExpenseRequest): string {
    return request.requestNumber === "DRAFT"
      ? `Draft "${request.title}"`
      : request.requestNumber;
  }

  private errorText(error: unknown, fallback: string): string {
    const candidate = error as { error?: { message?: string; errors?: string[] }; message?: string };
    if (candidate?.error?.errors?.length) {
      return `${candidate.error.message ?? fallback} ${candidate.error.errors.join(" ")}`;
    }

    return candidate?.error?.message ?? candidate?.message ?? fallback;
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set(null);
    this.scheduleMessageClear();
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set(null);
    this.scheduleMessageClear();
  }

  private scheduleMessageClear(): void {
    this.clearMessageTimer();
    this.messageTimer = setTimeout(() => this.clearMessages(), 3500);
  }

  private clearMessageTimer(): void {
    if (!this.messageTimer) {
      return;
    }

    clearTimeout(this.messageTimer);
    this.messageTimer = null;
  }

  private submitLocal(id: string): void {
    const request = this.requestState().find((item) => item.id === id);
    this.transition(
      id,
      "PendingEndorsement",
      request?.status === "Returned" ? "Resubmitted" : "Submitted",
    );
  }

  private upsertRequest(request: LocalExpenseRequest): void {
    const exists = this.requestState().some((item) => item.id === request.id);
    const requests = exists
      ? this.requestState().map((item) =>
          item.id === request.id ? request : item,
        )
      : [request, ...this.requestState()];
    this.requestState.set(requests);
    this.persist();
  }

  private removeRequest(id: string): void {
    this.requestState.set(
      this.requestState().filter((request) => request.id !== id),
    );
    this.auditState.set(
      this.auditState().filter((log) => log.requestId !== id),
    );
    this.persist();
  }

  private loadRequests(): LocalExpenseRequest[] {
    const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
    if (!raw) {
      if (this.usesBackend()) {
        return [];
      }
      const seed = this.seedRequests();
      localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      return JSON.parse(raw) as LocalExpenseRequest[];
    } catch {
      if (this.usesBackend()) {
        return [];
      }
      return this.seedRequests();
    }
  }

  private loadAuditLogs(): LocalAuditLog[] {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      if (this.usesBackend()) {
        return [];
      }
      const seed = this.seedAuditLogs(this.requestState());
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    try {
      const logs = JSON.parse(raw) as LocalAuditLog[];
      if (logs.length > 0) {
        return logs;
      }
      if (this.usesBackend()) {
        return [];
      }
      const seed = this.seedAuditLogs(this.requestState());
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    } catch {
      if (this.usesBackend()) {
        return [];
      }
      const seed = this.seedAuditLogs(this.requestState());
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(seed));
      return seed;
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
    localStorage.setItem(
      REQUEST_STORAGE_KEY,
      JSON.stringify(this.requestState()),
    );
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.auditState()));
  }

  private seedRequests(): LocalExpenseRequest[] {
    const now = new Date().toISOString();
    return [
      this.seedRequest(
        "EXP-2026-000041",
        "Laptop refresh for Service Desk",
        "Mia Santos",
        "usr-requester-001",
        "IT Operations",
        "Hardware",
        184000,
        "PendingApproval",
        true,
        now,
      ),
      this.seedRequest(
        "EXP-2026-000044",
        "Incident response tool renewal",
        "Lara Reyes",
        "usr-seed-002",
        "Cybersecurity",
        "Software",
        74000,
        "PendingEndorsement",
        true,
        now,
      ),
      this.seedRequest(
        "EXP-2026-000039",
        "Replacement docking stations",
        "Ana Lim",
        "usr-seed-003",
        "IT Operations",
        "Hardware",
        42000,
        "Approved",
        false,
        now,
      ),
      this.seedRequest(
        "DRAFT",
        "USB security keys",
        "Mia Santos",
        "usr-requester-001",
        "Cybersecurity",
        "Hardware",
        18000,
        "Draft",
        false,
        now,
      ),
    ];
  }

  private seedAuditLogs(requests: LocalExpenseRequest[]): LocalAuditLog[] {
    const logs: LocalAuditLog[] = [];
    for (const request of requests) {
      if (request.status !== "Draft") {
        logs.push(
          this.seedLog(
            request,
            "Submitted",
            request.requesterName,
            "Requester",
            "Seeded request submitted for workflow testing.",
          ),
        );
      }
      if (
        request.status === "PendingApproval" ||
        request.status === "Approved" ||
        request.status === "Closed"
      ) {
        logs.push(
          this.seedLog(
            request,
            "Endorsed",
            "Noel Tan",
            "Endorser",
            "Validated request details.",
          ),
        );
      }
      if (request.status === "Approved" || request.status === "Closed") {
        logs.push(
          this.seedLog(
            request,
            "Approved",
            "Ramon Cruz",
            "Approver",
            "Approved for processing.",
          ),
        );
      }
      if (request.status === "Closed") {
        logs.push(
          this.seedLog(
            request,
            "Closed",
            "Paula Dizon",
            "FinanceViewer",
            "Closed after Finance processing.",
          ),
        );
      }
      if (request.status === "Draft") {
        logs.push(
          this.seedLog(
            request,
            "Saved Draft",
            request.requesterName,
            "Requester",
          ),
        );
      }
    }
    return logs.sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  private seedLog(
    request: LocalExpenseRequest,
    action: string,
    actorName: string,
    actorRole: string,
    remarks?: string,
  ): LocalAuditLog {
    return {
      id: crypto.randomUUID(),
      requestId: request.id,
      requestNumber: request.requestNumber,
      actorName,
      actorRole,
      action,
      remarks,
      createdAt: request.updatedAt,
    };
  }

  private seedRequest(
    requestNumber: string,
    title: string,
    requesterName: string,
    requesterId: string,
    department: string,
    category: string,
    amount: number,
    status: ExpenseRequestStatus,
    urgent: boolean,
    now: string,
  ): LocalExpenseRequest {
    return {
      id: crypto.randomUUID(),
      requestNumber,
      title,
      justification: "Seeded request for frontend workflow testing.",
      requesterId,
      requesterName,
      department,
      costCenter: "CC-IT-001",
      requestType: "Expense",
      status,
      disbursementStatus:
        status === "Approved"
          ? "Pending"
          : status === "Closed"
            ? "Processed"
            : undefined,
      urgent,
      totalAmount: amount,
      lineItems: [
        {
          id: crypto.randomUUID(),
          category,
          description: title,
          vendor: "Preferred Supplier",
          quantity: 1,
          unitAmount: amount,
          lineTotal: amount,
          sellerLink: "https://example.com/item",
        },
      ],
      createdAt: now,
      submittedAt: status === "Draft" ? undefined : now,
      updatedAt: now,
    };
  }
}
