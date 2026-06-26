import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification, NotificationApiService } from './notification-api.service';

@Component({
  selector: 'app-notifications-page',
  imports: [RouterLink],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css'
})
export class NotificationsPage {
  private readonly notificationApi = inject(NotificationApiService);

  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly unreadCount = computed(() => this.notifications().filter((notification) => notification.unread).length);

  constructor() {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.notificationApi.list().subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not load notifications.'),
      complete: () => this.loading.set(false)
    });
  }

  markRead(notification: AppNotification): void {
    if (!notification.unread) {
      return;
    }

    this.notificationApi.markRead(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      },
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not mark notification as read.')
    });
  }

  markAllRead(): void {
    this.notificationApi.markAllRead().subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: (error) => this.errorMessage.set(error?.error?.message ?? 'Could not mark notifications as read.')
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  typeLabel(type: AppNotification['type']): string {
    const labels: Record<AppNotification['type'], string> = {
      RequestSubmitted: 'Submitted',
      RequestReturned: 'Returned',
      RequestApproved: 'Approved',
      RequestFinanceStatusUpdated: 'Finance Updated',
      RequestClosed: 'Closed'
    };
    return labels[type];
  }
}
