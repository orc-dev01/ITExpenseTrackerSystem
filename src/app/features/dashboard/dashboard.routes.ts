import { Routes } from '@angular/router';
import { ApprovalReportPage } from './approval-report/approval-report-page';
import { RequestDashboardPage } from './request-dashboard/request-dashboard-page';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: RequestDashboardPage
  },
  {
    path: 'approval-report',
    component: ApprovalReportPage,
    data: { roles: ['Approver', 'Admin'] }
  }
];
