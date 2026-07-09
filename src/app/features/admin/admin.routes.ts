import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

const roles = ['Admin'];

export const ADMIN_ROUTES: Routes = [
  { path: 'approval-matrix', component: FeaturePage, data: { title: 'Approval Matrix', subtitle: 'Configurable endorser and approver routing by amount, department, and category.', phase: 'Coming Soon', comingSoon: true, comingSoonMessage: 'Approval matrix maintenance is not active yet. Rules are currently seeded in SQL and cannot be edited from this screen.', mockKey: 'approvalMatrix', primaryAction: 'Add Rule', roles, capabilities: ['Admin configures endorser and approver assignments.', 'Rules can vary by department, amount range, and category.', 'High-value requests can require secondary approval.', 'Emergency route can bypass endorsement with audit note.'], endpoints: [ApiEndpoints.admin.approvalMatrix] } },
  { path: 'reference-data', component: FeaturePage, data: { title: 'Reference Data', subtitle: 'Central admin area for categories, CoA, and setup tables.', mockKey: 'referenceData', primaryAction: 'Add Account', roles, capabilities: ['Maintains Chart of Accounts for Phase 2 exports.', 'Supports reference CRUD without redeployment.', 'Keeps inactive records available for historical reports.'], endpoints: [ApiEndpoints.admin.coaAccounts, ApiEndpoints.admin.categories] } },
  { path: '', pathMatch: 'full', redirectTo: 'approval-matrix' }
];
