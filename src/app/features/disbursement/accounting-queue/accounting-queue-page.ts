import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DisbursementStatus } from '@core/models/domain.model';
import { LocalExpenseRequest, RequestStoreService } from '@features/requests/request-store.service';
import { DisbursementApiService } from '../disbursement-api.service';

@Component({
  selector: 'app-accounting-queue-page',
  imports: [RouterLink],
  templateUrl: './accounting-queue-page.html',
  styleUrl: './accounting-queue-page.css'
})
export class AccountingQueuePage {
  private readonly disbursementApi = inject(DisbursementApiService);
  private readonly requestStore = inject(RequestStoreService);

  readonly requests = signal<LocalExpenseRequest[]>([]);
  readonly loading = signal(false);
  readonly processingIds = signal<string[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly totalAmount = computed(() => this.requests().reduce((sum, request) => sum + request.totalAmount, 0));
  readonly urgentCount = computed(() => this.requests().filter((request) => request.urgent).length);
  readonly readyToCloseCount = computed(() => this.requests().filter((request) => this.financeStatus(request) === 'Processed').length);

  constructor() {
    this.loadQueue();
  }

  loadQueue(): void {
    this.loading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.disbursementApi.accountingQueue().subscribe({
      next: (requests) => this.requests.set(requests),
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not load Finance queue.'),
      complete: () => this.loading.set(false)
    });
  }

  updateFinanceStatus(request: LocalExpenseRequest, status: DisbursementStatus): void {
    if (this.isProcessing(request.id)) {
      return;
    }

    this.processingIds.update((ids) => [...ids, request.id]);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.disbursementApi.updateStatus(request.id, status).subscribe({
      next: (updatedRequest) => {
        this.requests.update((items) => items.map((item) => (item.id === request.id ? this.mergeRequestUpdate(item, updatedRequest, status) : item)));
        this.requestStore.refreshFromBackend();
        this.successMessage.set(`${request.requestNumber} finance status is now ${this.statusLabel(status)}.`);
      },
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not update Finance status.'),
      complete: () => this.processingIds.update((ids) => ids.filter((id) => id !== request.id))
    });
  }

  closeRequest(request: LocalExpenseRequest): void {
    if (this.isProcessing(request.id) || this.financeStatus(request) !== 'Processed') {
      return;
    }

    this.processingIds.update((ids) => [...ids, request.id]);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.disbursementApi.closeRequest(request.id).subscribe({
      next: () => {
        this.requests.update((items) => items.filter((item) => item.id !== request.id));
        this.requestStore.refreshFromBackend();
        this.successMessage.set(`${request.requestNumber} was closed and removed from the Finance queue.`);
      },
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not close this request.'),
      complete: () => this.processingIds.update((ids) => ids.filter((id) => id !== request.id))
    });
  }

  financeStatus(request: LocalExpenseRequest): DisbursementStatus {
    return request.disbursementStatus ?? 'Pending';
  }

  statusLabel(status: DisbursementStatus): string {
    const labels: Record<DisbursementStatus, string> = {
      Pending: 'Pending',
      InProcess: 'In Process',
      Processed: 'Processed',
      OnHold: 'On Hold'
    };
    return labels[status];
  }

  statusBadgeClass(status: DisbursementStatus): string {
    const classes: Record<DisbursementStatus, string> = {
      Pending: 'text-bg-secondary',
      InProcess: 'text-bg-info',
      Processed: 'text-bg-success',
      OnHold: 'text-bg-warning'
    };
    return classes[status];
  }

  isProcessing(id: string): boolean {
    return this.processingIds().includes(id);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  }

  formatDate(value: string | undefined): string {
    return value ? new Date(value).toLocaleString() : 'Not yet submitted';
  }

  private mergeRequestUpdate(
    current: LocalExpenseRequest,
    updated: Partial<LocalExpenseRequest>,
    requestedFinanceStatus: DisbursementStatus,
  ): LocalExpenseRequest {
    const partialBackendResponse = !updated.requestNumber || updated.totalAmount === undefined;

    return {
      ...current,
      ...updated,
      status: partialBackendResponse ? current.status : updated.status ?? current.status,
      disbursementStatus: updated.disbursementStatus ?? requestedFinanceStatus,
      totalAmount: updated.totalAmount ?? current.totalAmount,
      lineItems: updated.lineItems ?? current.lineItems
    };
  }
}
