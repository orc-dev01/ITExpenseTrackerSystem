import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';
import { ApprovalReportPage } from './approval-report/approval-report-page';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: FeaturePage,
    data: {
      title: 'Spend Dashboard',
      subtitle: 'Filterable overview of IT spend by category, department, project, status, and period.',
      mockKey: 'dashboard',
      primaryAction: 'Export Snapshot',
      capabilities: ['Requester sees own activity and request status.', 'Approver and Finance see spend totals and pending action counts.', 'Urgent requests and budget warnings surface early.', 'Chart placeholders use tabular data until a chart library is approved.'],
      endpoints: [ApiEndpoints.reports.spendDashboard, ApiEndpoints.notifications.unreadCount]
    }
  },
  {
    path: 'approval-report',
    component: ApprovalReportPage,
    data: { roles: ['Approver', 'Admin'] }
  }
];
