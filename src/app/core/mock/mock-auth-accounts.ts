import { CurrentUser } from '@core/auth/session.model';

export interface MockAccount {
  label: string;
  password: string;
  user: CurrentUser;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    label: 'Requester',
    password: 'password123',
    user: {
      id: 'usr-requester-001',
      email: 'requester@test.com',
      fullName: 'Mia Santos',
      departmentId: 'it-operations',
      roles: ['Requester']
    }
  },
  {
    label: 'Endorser',
    password: 'password123',
    user: {
      id: 'usr-endorser-001',
      email: 'endorser@test.com',
      fullName: 'Noel Tan',
      departmentId: 'it-operations',
      roles: ['Endorser']
    }
  },
  {
    label: 'Approver',
    password: 'password123',
    user: {
      id: 'usr-approver-001',
      email: 'approver@test.com',
      fullName: 'Ramon Cruz',
      departmentId: 'it',
      roles: ['Approver']
    }
  },
  {
    label: 'Finance Viewer',
    password: 'password123',
    user: {
      id: 'usr-finance-001',
      email: 'finance@test.com',
      fullName: 'Paula Dizon',
      departmentId: 'finance',
      roles: ['FinanceViewer']
    }
  },
  {
    label: 'Admin',
    password: 'password123',
    user: {
      id: 'usr-admin-001',
      email: 'admin@test.com',
      fullName: 'Demo Admin',
      departmentId: 'it',
      roles: ['Admin']
    }
  },
  {
    label: 'All Roles',
    password: 'password123',
    user: {
      id: 'usr-super-001',
      email: 'super@test.com',
      fullName: 'Super Tester',
      departmentId: 'it',
      roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin']
    }
  }
];

export function findMockAccount(email: string, password: string): MockAccount | undefined {
  return MOCK_ACCOUNTS.find(
    (account) => account.user.email.toLowerCase() === email.toLowerCase() && account.password === password
  );
}
