import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { RequestApiService } from '../request-api.service';
import { RemarksAction, RequestRemarksModal } from '../request-remarks-modal/request-remarks-modal';
import { LocalAttachment, LocalAuditLog, LocalExpenseRequest, RequestStoreService } from '../request-store.service';

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
  private readonly requestApi = inject(RequestApiService);
  readonly store = inject(RequestStoreService);

  readonly user = this.auth.user;
  readonly roles = this.auth.roles;
  readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly pendingRemarks = signal<PendingRemarks | null>(null);
  readonly attachmentsByLineItem = signal<Record<string, LocalAttachment[]>>({});
  readonly attachmentLoading = signal<Record<string, boolean>>({});
  readonly attachmentUploading = signal<Record<string, boolean>>({});
  readonly attachmentMessage = signal<string | null>(null);
  readonly attachmentError = signal<string | null>(null);
  readonly backendAuditLogs = signal<LocalAuditLog[]>([]);
  readonly auditTrailLoading = signal(false);
  readonly auditTrailError = signal<string | null>(null);
  readonly auditTrailLoadedFor = signal<string | null>(null);

  readonly request = computed(() => this.store.requests().find((request) => request.id === this.requestId || request.requestNumber === this.requestId) ?? null);

  readonly auditLogs = computed(() => {
    const request = this.request();
    if (!request) {
      return [];
    }

    if (this.auditTrailLoadedFor() === this.auditTrailKey(request)) {
      return this.backendAuditLogs();
    }

    return this.store.auditLogs().filter((log) => log.requestId === request.id || log.requestNumber === request.requestNumber);
  });

  readonly actions = computed(() => {
    const request = this.request();
    return request ? this.store.canAct(request.status, this.roles(), request.disbursementStatus).filter((action) => action !== 'reset') : [];
  });

  constructor() {
    effect(() => {
      const request = this.request();
      if (request) {
        untracked(() => this.loadAuditTrail(request));
      }

      if (request && this.canViewAttachments(request)) {
        untracked(() => this.loadAttachments(request));
      } else {
        this.attachmentError.set(null);
        this.attachmentLoading.set({});
      }
    });
  }

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

  displayStatus(request: LocalExpenseRequest): string {
    return request.status === 'Approved' && request.disbursementStatus
      ? `Approved / ${this.financeStatusLabel(request.disbursementStatus)}`
      : request.status;
  }

  financeStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      Pending: 'Pending Finance',
      InProcess: 'In Process',
      Processed: 'Processed',
      OnHold: 'On Hold'
    };
    return status ? labels[status] ?? status : 'Not in Finance yet';
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  attachmentsFor(lineItemId: string): LocalAttachment[] {
    return this.attachmentsByLineItem()[lineItemId] ?? [];
  }

  isAttachmentLoading(lineItemId: string): boolean {
    return Boolean(this.attachmentLoading()[lineItemId]);
  }

  isAttachmentUploading(lineItemId: string): boolean {
    return Boolean(this.attachmentUploading()[lineItemId]);
  }

  canUploadAttachments(request: LocalExpenseRequest): boolean {
    const user = this.user();
    if (!user || !['Draft', 'Returned'].includes(request.status)) {
      return false;
    }

    return this.roles().includes('Admin') || (this.roles().includes('Requester') && request.requesterId === user.id);
  }

  canViewAttachments(request: LocalExpenseRequest): boolean {
    const user = this.user();
    const roles = this.roles();
    if (!user) {
      return false;
    }

    if (roles.includes('Admin')) {
      return true;
    }

    if (roles.includes('Requester') && request.requesterId === user.id) {
      return true;
    }

    if (roles.includes('Endorser') && request.status === 'PendingEndorsement') {
      return true;
    }

    if (roles.includes('Approver') && request.status === 'PendingApproval') {
      return true;
    }

    return roles.includes('FinanceViewer') && ['Approved', 'Closed'].includes(request.status);
  }

  uploadAttachment(event: Event, request: LocalExpenseRequest, lineItemId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.attachmentMessage.set(null);
      this.attachmentError.set('File must be no larger than 5 MB.');
      return;
    }

    this.setLineItemFlag(this.attachmentUploading, lineItemId, true);
    this.attachmentMessage.set(null);
    this.attachmentError.set(null);

    this.requestApi.uploadAttachment(request.id, lineItemId, file).subscribe({
      next: (attachment) => {
        this.attachmentsByLineItem.update((items) => ({
          ...items,
          [lineItemId]: [attachment, ...(items[lineItemId] ?? [])]
        }));
        this.attachmentMessage.set(`${attachment.fileName} was uploaded successfully.`);
      },
      error: (error) => {
        this.attachmentError.set(error?.error?.message ?? 'File upload failed.');
        this.setLineItemFlag(this.attachmentUploading, lineItemId, false);
      },
      complete: () => {
        this.setLineItemFlag(this.attachmentUploading, lineItemId, false);
      }
    });
  }

  downloadAttachment(attachment: LocalAttachment): void {
    this.attachmentMessage.set(null);
    this.attachmentError.set(null);

    this.requestApi.downloadAttachment(attachment.id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.attachmentError.set('Downloaded file was empty.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.downloadFileName(response.headers.get('content-disposition'), attachment.fileName);
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.attachmentError.set(error?.error?.message ?? 'File download failed.');
      }
    });
  }

  viewAttachment(attachment: LocalAttachment): void {
    this.attachmentMessage.set(null);
    this.attachmentError.set(null);

    this.requestApi.downloadAttachment(attachment.id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.attachmentError.set('File preview was empty.');
          return;
        }

        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error) => {
        this.attachmentError.set(error?.error?.message ?? 'File preview failed.');
      }
    });
  }

  goBack(): void {
    void this.router.navigate(['/requests']);
  }

  private loadAttachments(request: LocalExpenseRequest): void {
    for (const item of request.lineItems) {
      this.setLineItemFlag(this.attachmentLoading, item.id, true);
      this.requestApi.listAttachments(request.id, item.id).subscribe({
        next: (attachments) => {
          this.attachmentsByLineItem.update((items) => ({
            ...items,
            [item.id]: attachments
          }));
        },
        error: (error) => {
          if (this.canViewAttachments(this.request() ?? request)) {
            this.attachmentError.set(error?.error?.message ?? 'Could not load one or more attachment lists.');
          }
          this.setLineItemFlag(this.attachmentLoading, item.id, false);
        },
        complete: () => {
          this.setLineItemFlag(this.attachmentLoading, item.id, false);
        }
      });
    }
  }

  private loadAuditTrail(request: LocalExpenseRequest): void {
    const key = this.auditTrailKey(request);
    if (this.auditTrailLoadedFor() === key || this.auditTrailLoading()) {
      return;
    }

    this.auditTrailLoading.set(true);
    this.auditTrailError.set(null);

    this.requestApi.auditTrailForRequest(request.id).subscribe({
      next: (logs) => {
        this.backendAuditLogs.set(logs);
        this.auditTrailLoadedFor.set(key);
      },
      error: (error) => {
        this.auditTrailError.set(error?.error?.message ?? 'Could not load latest workflow history.');
      },
      complete: () => {
        this.auditTrailLoading.set(false);
      }
    });
  }

  private auditTrailKey(request: LocalExpenseRequest): string {
    return `${request.id}:${request.updatedAt}`;
  }

  private setLineItemFlag(
    state: typeof this.attachmentLoading,
    lineItemId: string,
    value: boolean,
  ): void {
    state.update((items) => ({
      ...items,
      [lineItemId]: value
    }));
  }

  private downloadFileName(disposition: string | null, fallback: string): string {
    const match = disposition?.match(/filename="?([^"]+)"?/i);
    return match?.[1] ?? fallback;
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
