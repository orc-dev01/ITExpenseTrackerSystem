import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const BUDGET_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Budgets', subtitle: 'Phase 2 budget upload, available balance checks, and threshold alerts.', phase: 'Phase 2', comingSoon: true, comingSoonMessage: 'Budget upload, balance checks, and threshold alerts are planned for the next phase and are not active in the current release.', mockKey: 'budgets', primaryAction: 'Upload Budget', roles: ['FinanceViewer', 'Admin'], capabilities: ['Finance/Admin will upload approved budgets by department, category, cost center, and period.', 'Approvals will decrement available budget.', 'Requests that breach budget will be flagged before approval.', 'Threshold alerts will notify approvers and Finance.'], endpoints: [ApiEndpoints.budgets.list, ApiEndpoints.budgets.upload, ApiEndpoints.budgets.availability, ApiEndpoints.budgets.thresholdAlerts] } }
];
