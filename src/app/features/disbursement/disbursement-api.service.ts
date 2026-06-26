import { Injectable, inject } from '@angular/core';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { ApiService } from '@core/api/api.service';
import type { DisbursementStatus } from '@core/models/domain.model';
import type { LocalExpenseRequest } from '@features/requests/request-store.service';

@Injectable({ providedIn: 'root' })
export class DisbursementApiService {
  private readonly api = inject(ApiService);

  accountingQueue() {
    return this.api.get<LocalExpenseRequest[]>(ApiEndpoints.disbursement.accountingQueue);
  }

  closeRequest(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.close(id), {
      remarks: 'Closed after Finance processing.'
    });
  }

  updateStatus(id: string, status: DisbursementStatus) {
    return this.api.patch<LocalExpenseRequest>(ApiEndpoints.disbursement.updateStatus(id), { status });
  }
}
