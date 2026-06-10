import { UserRole } from '../models/domain.model';

export const SESSION_STORAGE_KEY = 'IT_EXPENSE_SESSION';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user: CurrentUser;
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  departmentId?: string;
  roles: UserRole[];
}
