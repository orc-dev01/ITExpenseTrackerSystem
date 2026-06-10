import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { MainLayout } from './shared/layout/main-layout/main-layout';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    canActivateChild: [roleGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES) },
      { path: 'requests', loadChildren: () => import('./features/requests/requests.routes').then((m) => m.REQUEST_ROUTES) },
      { path: 'workflow', loadChildren: () => import('./features/workflow/workflow.routes').then((m) => m.WORKFLOW_ROUTES) },
      { path: 'maintenance', loadChildren: () => import('./features/maintenance/maintenance.routes').then((m) => m.MAINTENANCE_ROUTES) },
      { path: 'reports', loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORT_ROUTES) },
      { path: 'budgets', loadChildren: () => import('./features/budgets/budgets.routes').then((m) => m.BUDGET_ROUTES) },
      { path: 'disbursement', loadChildren: () => import('./features/disbursement/disbursement.routes').then((m) => m.DISBURSEMENT_ROUTES) },
      { path: 'procurement', loadChildren: () => import('./features/procurement/procurement.routes').then((m) => m.PROCUREMENT_ROUTES) },
      { path: 'reimbursements', loadChildren: () => import('./features/reimbursements/reimbursements.routes').then((m) => m.REIMBURSEMENT_ROUTES) },
      { path: 'notifications', loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATION_ROUTES) },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
      { path: 'account-info', loadChildren: () => import('./features/account-info/account-info.routes').then((m) => m.ACCOUNT_INFO_ROUTES) },
      { path: 'utilities', loadChildren: () => import('./features/utilities/utilities.routes').then((m) => m.UTILITY_ROUTES) }
    ]
  },
  { path: '**', redirectTo: '' }
];
