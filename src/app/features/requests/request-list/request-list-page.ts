import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { ExpenseRequestStatus, UserRole } from "@core/models/domain.model";

import {
  RemarksAction,
  RequestRemarksModal,
} from "../request-remarks-modal/request-remarks-modal";
import {
  LocalExpenseRequest,
  RequestStoreService,
} from "../request-store.service";

interface PendingRemarks {
  action: RemarksAction;
  request: LocalExpenseRequest;
}

@Component({
  selector: "app-request-list-page",
  imports: [RouterLink, RequestRemarksModal],
  templateUrl: "./request-list-page.html",
  styleUrl: "./request-list-page.css",
})
export class RequestListPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly store = inject(RequestStoreService);
  readonly user = this.auth.user;
  readonly roles = this.auth.roles;
  readonly searchTerm = signal("");
  readonly statusFilter = signal<ExpenseRequestStatus | "All">("All");
  readonly statusOptions: ExpenseRequestStatus[] = [
    "Draft",
    "PendingEndorsement",
    "PendingApproval",
    "Approved",
    "Returned",
    "Rejected",
    "Closed",
    "Cancelled",
  ];
  readonly requests = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const status = this.statusFilter();

    return this.store.visibleRequests().filter((request) => {
      const matchesStatus = status === "All" || request.status === status;
      const matchesSearch =
        !search ||
        [
          request.requestNumber,
          request.title,
          request.justification,
          request.requesterName,
          request.department,
          request.costCenter,
          request.project,
          request.requestType,
          request.status,
          String(request.totalAmount),
        ]
          .some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(search),
          );

      return matchesStatus && matchesSearch;
    });
  });
  readonly hasActiveFilters = computed(
    () => this.searchTerm().trim().length > 0 || this.statusFilter() !== "All",
  );
  readonly pendingRemarks = signal<PendingRemarks | null>(null);

  constructor() {
    this.store.refreshFromBackend();
  }

  canCreate(): boolean {
    return this.hasRole("Requester") || this.hasRole("Admin");
  }

  actionsFor(request: LocalExpenseRequest): string[] {
    return this.store.canAct(request.status, this.roles(), request.disbursementStatus);
  }

  displayStatus(request: LocalExpenseRequest): string {
    return request.status === "Approved" && request.disbursementStatus
      ? `Approved / ${this.financeStatusLabel(request.disbursementStatus)}`
      : request.status;
  }

  runAction(action: string, request: LocalExpenseRequest): void {
    if (action === "return" || action === "reject") {
      this.pendingRemarks.set({ action, request });
      return;
    }

    this.executeAction(action, request);
  }

  confirmRemarks(remarks: string): void {
    const pending = this.pendingRemarks();
    if (!pending) {
      return;
    }

    this.executeAction(pending.action, pending.request, remarks);
    this.pendingRemarks.set(null);
  }

  cancelRemarks(): void {
    this.pendingRemarks.set(null);
  }

  reset(): void {
    this.store.resetMockData();
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  updateStatusFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value as ExpenseRequestStatus | "All");
  }

  clearFilters(): void {
    this.searchTerm.set("");
    this.statusFilter.set("All");
  }

  openRequest(request: LocalExpenseRequest): void {
    void this.router.navigate(["/requests", request.id]);
  }

  private executeAction(
    action: string,
    request: LocalExpenseRequest,
    remarks?: string,
  ): void {
    if (action === "edit") {
      void this.router.navigate(["/requests", request.id, "edit"]);
    }
    if (action === "submit") this.store.submit(request.id);
    if (action === "delete" && confirm("Delete this draft request?")) {
      this.store.deleteDraft(request.id);
    }
    if (action === "cancel") this.store.cancel(request.id);
    if (action === "endorse") this.store.endorse(request.id);
    if (action === "return") this.store.returnRequest(request.id, remarks);
    if (action === "reject") this.store.reject(request.id, remarks);
    if (action === "approve") this.store.approve(request.id);
    if (action === "close") this.store.close(request.id);
  }

  private hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }

  private financeStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: "Pending Finance",
      InProcess: "In Process",
      Processed: "Processed",
      OnHold: "On Hold",
    };
    return labels[status] ?? status;
  }
}
