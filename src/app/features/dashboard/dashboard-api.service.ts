import { Injectable, inject } from '@angular/core';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { ApiService } from '@core/api/api.service';
import { DisbursementStatus, ExpenseRequestStatus } from '@core/models/domain.model';

export interface DashboardRecentRequest {
  id: string;
  requestNumber: string;
  title: string;
  requesterName: string;
  status: ExpenseRequestStatus;
  disbursementStatus?: DisbursementStatus;
  urgent: boolean;
  totalAmount: number;
  updatedAt: string;
}

export interface RequestDashboardSummary {
  total: number;
  open: number;
  pendingAction: number;
  urgent: number;
  approved: number;
  returned: number;
  rejected: number;
  closed: number;
  totalAmount: number;
  countsByStatus: Partial<Record<ExpenseRequestStatus, number>>;
  recentRequests: DashboardRecentRequest[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiService);

  requestSummary() {
    return this.api.get<RequestDashboardSummary>(ApiEndpoints.reports.requestDashboard);
  }
}
