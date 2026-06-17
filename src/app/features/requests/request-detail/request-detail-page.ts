import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { RemarksAction, RequestRemarksModal } from '../request-remarks-modal/request-remarks-modal';
import { LocalExpenseRequest, RequestStoreService } from '../request-store.service';

interface PendingRemarks {
  action: RemarksAction;
  request: LocalExpenseRequest;
}

@Component({
  selector: 'app-request-detail-page',
  imports: [RouterLink, RequestRemarksModal],
  templateUrl: './request-detail-page.html',
  styleUrl: './request-detail-page.css'
})
export class RequestDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly store = inject(RequestStoreService);

  readonly user = this.auth.user;
  readonly roles = this.auth.roles;
  readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly pendingRemarks = signal<PendingRemarks | null>(null);

  readonly request = computed(() => this.store.requests().find((request) => request.id === this.requestId || request.requestNumber === this.requestId) ?? null);

  readonly auditLogs = computed(() => {
    const request = this.request();
    if (!request) {
      return [];
    }

    return this.store.auditLogs().filter((log) => log.requestId === request.id || log.requestNumber === request.requestNumber);
  });

  readonly actions = computed(() => {
    const request = this.request();
    return request ? this.store.canAct(request.status, this.roles()).filter((action) => action !== 'reset') : [];
  });

  runAction(action: string, request: LocalExpenseRequest): void {
    if (action === 'return' || action === 'reject') {
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  }

  formatDate(value: string | undefined): string {
    return value ? new Date(value).toLocaleString() : 'Not yet submitted';
  }

  goBack(): void {
    void this.router.navigate(['/requests']);
  }

  private executeAction(action: string, request: LocalExpenseRequest, remarks?: string): void {
    if (action === 'edit') {
      void this.router.navigate(['/requests', request.id, 'edit']);
    }
    if (action === 'submit') this.store.submit(request.id);
    if (action === 'delete' && confirm('Delete this draft request?')) {
      this.store.deleteDraft(request.id);
      void this.router.navigate(['/requests']);
    }
    if (action === 'cancel') this.store.cancel(request.id);
    if (action === 'endorse') this.store.endorse(request.id);
    if (action === 'return') this.store.returnRequest(request.id, remarks);
    if (action === 'reject') this.store.reject(request.id, remarks);
    if (action === 'approve') this.store.approve(request.id);
    if (action === 'close') this.store.close(request.id);
  }
}
