import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "@core/auth/auth.service";
import { UserRole } from "@core/models/domain.model";

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
  readonly requests = this.store.visibleRequests;
  readonly pendingRemarks = signal<PendingRemarks | null>(null);

  canCreate(): boolean {
    return this.hasRole("Requester") || this.hasRole("Admin");
  }

  actionsFor(request: LocalExpenseRequest): string[] {
    return this.store.canAct(request.status, this.roles());
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
}
