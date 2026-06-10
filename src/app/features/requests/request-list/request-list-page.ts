import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UserRole } from '@core/models/domain.model';
import { LocalExpenseRequest, RequestStoreService } from '../request-store.service';

@Component({
  selector: 'app-request-list-page',
  imports: [RouterLink],
  templateUrl: './request-list-page.html',
  styleUrl: './request-list-page.css'
})
export class RequestListPage {
  private readonly auth = inject(AuthService);
  readonly store = inject(RequestStoreService);
  readonly user = this.auth.user;
  readonly roles = this.auth.roles;
  readonly requests = this.store.visibleRequests;

  canCreate(): boolean {
    return this.hasRole('Requester') || this.hasRole('Admin');
  }

  actionsFor(request: LocalExpenseRequest): string[] {
    return this.store.canAct(request.status, this.roles());
  }

  runAction(action: string, request: LocalExpenseRequest): void {
    if (action === 'submit') this.store.submit(request.id);
    if (action === 'cancel') this.store.cancel(request.id);
    if (action === 'endorse') this.store.endorse(request.id);
    if (action === 'return') this.store.returnRequest(request.id);
    if (action === 'reject') this.store.reject(request.id);
    if (action === 'approve') this.store.approve(request.id);
    if (action === 'close') this.store.close(request.id);
  }

  reset(): void {
    this.store.resetMockData();
  }

  private hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }
}
