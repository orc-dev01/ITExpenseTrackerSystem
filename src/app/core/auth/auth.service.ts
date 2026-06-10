import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { delay, of, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { findMockAccount } from '@core/mock/mock-auth-accounts';
import { ApiEndpoints } from '../api/api-endpoints';
import { ApiService } from '../api/api.service';
import { AuthSession, LoginCommand, SESSION_STORAGE_KEY } from './session.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly sessionState = signal<AuthSession | null>(this.loadSession());

  readonly session = this.sessionState.asReadonly();
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly roles = computed(() => this.sessionState()?.user.roles ?? []);
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.accessToken));

  login(command: LoginCommand) {
    if (environment.mockAuth) {
      const account = findMockAccount(command.email, command.password);
      if (!account) {
        return throwError(() => new Error('Invalid mock account credentials.'));
      }

      return of(this.createMockSession(account.user)).pipe(
        delay(250),
        tap((session) => this.storeSession(session))
      );
    }

    return this.api.post<AuthSession>(ApiEndpoints.auth.login, command).pipe(
      tap((session) => this.storeSession(session))
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.sessionState.set(null);
    void this.router.navigate(['/auth/login']);
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    if (requiredRoles.length === 0) {
      return true;
    }
    return this.roles().some((role) => requiredRoles.includes(role));
  }

  private createMockSession(user: AuthSession['user']): AuthSession {
    return {
      accessToken: `dev-mock-access-token-${user.id}`,
      refreshToken: `dev-mock-refresh-token-${user.id}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      user
    };
  }

  private storeSession(session: AuthSession): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.sessionState.set(session);
  }

  private loadSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}
