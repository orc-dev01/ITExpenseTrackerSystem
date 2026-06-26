import { Injectable, inject } from '@angular/core';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { ApiService } from '@core/api/api.service';

export interface AppNotification {
  id: string;
  userId: string;
  requestId: string;
  requestNumber: string;
  type: 'RequestSubmitted' | 'RequestReturned' | 'RequestApproved' | 'RequestFinanceStatusUpdated' | 'RequestClosed';
  subject: string;
  message: string;
  unread: boolean;
  createdAt: string;
  readAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<AppNotification[]>(ApiEndpoints.notifications.list);
  }

  unreadCount() {
    return this.api.get<{ count: number }>(ApiEndpoints.notifications.unreadCount);
  }

  markRead(id: string) {
    return this.api.patch<AppNotification>(ApiEndpoints.notifications.markRead(id), {});
  }

  markAllRead() {
    return this.api.patch<AppNotification[]>(ApiEndpoints.notifications.markAllRead, {});
  }
}
