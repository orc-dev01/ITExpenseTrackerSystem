import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const REPORT_ROUTES: Routes = [
  { path: 'spend', component: FeaturePage, data: { title: 'Spend Reports', subtitle: 'Filter expense spend by category, department, requester, status, and date range.', mockKey: 'reports', primaryAction: 'Run Report', roles: ['Approver', 'FinanceViewer', 'Admin'], capabilities: ['Filters by category, department, cost center, project, requester, status, and date range.', 'Shows spend totals and request counts.', 'Provides period-end summary for Finance.', 'Budget vs actual report is enabled in Phase 2.'], endpoints: [ApiEndpoints.reports.spendDashboard, ApiEndpoints.reports.expenseSummary] } },
  { path: 'exports', component: FeaturePage, data: { title: 'Finance Exports', subtitle: 'CSV and future GL export hooks for approved requests.', mockKey: 'reports', primaryAction: 'Export CSV', roles: ['FinanceViewer', 'Admin'], capabilities: ['Exports approved requests to CSV.', 'Phase 2 adds GL account code export.', 'Export criteria should match report filters.', 'Backend should stream files for large periods.'], endpoints: [ApiEndpoints.reports.exportApprovedCsv, ApiEndpoints.reports.glExport] } },
  { path: '', pathMatch: 'full', redirectTo: 'spend' }
];
