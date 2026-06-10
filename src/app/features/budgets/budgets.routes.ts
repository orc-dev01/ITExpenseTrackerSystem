import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const BUDGET_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Budgets', subtitle: 'Phase 2 budget upload, available balance checks, and threshold alerts.', phase: 'Phase 2', mockKey: 'budgets', primaryAction: 'Upload Budget', roles: ['FinanceViewer', 'Admin'], capabilities: ['Finance/Admin uploads approved budget by department, category, cost center, and period.', 'Approvals decrement available budget.', 'Requests that breach budget are flagged before approval.', 'Threshold alerts notify approvers and Finance.'], endpoints: [ApiEndpoints.budgets.list, ApiEndpoints.budgets.upload, ApiEndpoints.budgets.availability, ApiEndpoints.budgets.thresholdAlerts] } }
];
