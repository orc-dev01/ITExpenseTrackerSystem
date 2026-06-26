import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardApiService, DashboardRecentRequest, RequestDashboardSummary } from '../dashboard-api.service';

@Component({
  selector: 'app-request-dashboard-page',
  imports: [RouterLink],
  templateUrl: './request-dashboard-page.html',
  styleUrl: './request-dashboard-page.css'
})
export class RequestDashboardPage {
  private readonly dashboardApi = inject(DashboardApiService);

  readonly summary = signal<RequestDashboardSummary | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly statusOrder = [
    'Draft',
    'Returned',
    'PendingEndorsement',
    'PendingApproval',
    'Approved',
    'Rejected',
    'Closed',
    'Cancelled'
  ] as const;

  constructor() {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardApi.requestSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
      },
      error: (error) => {
        this.errorMessage.set(error?.error?.message ?? 'Could not load dashboard counts from backend.');
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  displayStatus(request: DashboardRecentRequest): string {
    return request.status === 'Approved' && request.disbursementStatus
      ? `Approved / ${this.financeStatusLabel(request.disbursementStatus)}`
      : request.status;
  }

  private financeStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pending Finance',
      InProcess: 'In Process',
      Processed: 'Processed',
      OnHold: 'On Hold'
    };
    return labels[status] ?? status;
  }
}
