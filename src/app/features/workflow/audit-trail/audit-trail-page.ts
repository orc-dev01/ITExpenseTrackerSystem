import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RequestStoreService } from '@features/requests/request-store.service';

type AuditActionFilter =
  | 'All'
  | 'Submitted'
  | 'Saved Draft'
  | 'Updated Draft'
  | 'Endorsed'
  | 'Approved'
  | 'Returned'
  | 'Rejected'
  | 'Cancelled'
  | 'Closed';

@Component({
  selector: 'app-audit-trail-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './audit-trail-page.html',
  styleUrl: './audit-trail-page.css'
})
export class AuditTrailPage {
  private readonly store = inject(RequestStoreService);

  readonly searchTerm = signal('');
  readonly actionFilter = signal<AuditActionFilter>('All');
  readonly actionOptions: AuditActionFilter[] = ['All', 'Submitted', 'Saved Draft', 'Updated Draft', 'Endorsed', 'Approved', 'Returned', 'Rejected', 'Cancelled', 'Closed'];

  readonly logs = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const action = this.actionFilter();

    return this.store.auditLogs().filter((log) => {
      const actionMatches = action === 'All' || log.action === action;
      const searchTarget = `${log.requestNumber} ${log.actorName} ${log.actorRole} ${log.action} ${log.remarks ?? ''}`.toLowerCase();
      return actionMatches && (!search || searchTarget.includes(search));
    });
  });

  readonly totalLogs = computed(() => this.store.auditLogs().length);
  readonly returnedRejectedCount = computed(() => this.store.auditLogs().filter((log) => log.action === 'Returned' || log.action === 'Rejected').length);
  readonly latestAction = computed(() => {
    const logs = this.store.auditLogs();
    return logs.length > 0 ? logs[0].action : 'None';
  });
  readonly latestActionDate = computed(() => {
    const logs = this.store.auditLogs();
    return logs.length > 0 ? this.formatDate(logs[0].createdAt) : 'No activity yet';
  });

  setSearch(value: string): void {
    this.searchTerm.set(value);
  }

  setAction(value: string): void {
    this.actionFilter.set(value as AuditActionFilter);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }
}
