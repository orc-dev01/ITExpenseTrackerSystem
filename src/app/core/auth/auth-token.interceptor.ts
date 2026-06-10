import { HttpInterceptorFn } from '@angular/common/http';
import { AuthSession, SESSION_STORAGE_KEY } from './session.model';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return next(request);
  }

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken) {
      return next(request);
    }

    return next(request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } }));
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return next(request);
  }
};
