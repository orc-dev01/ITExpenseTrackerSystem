import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

const roles = ['Admin'];

export const MAINTENANCE_ROUTES: Routes = [
  { path: 'departments', component: FeaturePage, data: { title: 'Departments', subtitle: 'Department and active flag setup.', mockKey: 'departments', primaryAction: 'Add Department', roles, capabilities: ['Defines requester department ownership.', 'Supports department-based endorsement routing.', 'Links managers and cost centers for reporting.'], endpoints: [ApiEndpoints.admin.departments] } },
  { path: 'cost-centers', component: FeaturePage, data: { title: 'Cost Centers', subtitle: 'Cost center setup for request tagging and budget mapping.', mockKey: 'costCenters', primaryAction: 'Add Cost Center', roles, capabilities: ['Maps expense requests to Finance cost centers.', 'Used by budget upload and actual spend reports.', 'Can be filtered in dashboard and exports.'], endpoints: [ApiEndpoints.admin.costCenters] } },
  { path: 'categories', component: FeaturePage, data: { title: 'Expense Categories', subtitle: 'IT expense categories and future GL account mapping.', mockKey: 'categories', primaryAction: 'Add Category', roles, capabilities: ['Defines line item classification.', 'Drives approval matrix and reporting.', 'Phase 2 maps categories to Chart of Accounts.'], endpoints: [ApiEndpoints.admin.categories] } },
  { path: 'users', component: FeaturePage, data: { title: 'Users', subtitle: 'User, role, department, and manager assignment.', mockKey: 'users', primaryAction: 'Add User', roles, capabilities: ['Assigns Requester, Endorser, Approver, Finance Viewer, and Admin roles.', 'Connects users to departments and managers.', 'Controls queue visibility in the frontend and backend.'], endpoints: [ApiEndpoints.admin.users] } },
  { path: 'projects', component: FeaturePage, data: { title: 'Projects', subtitle: 'Optional project tagging for requests and reports.', mockKey: 'projects', primaryAction: 'Add Project', roles, capabilities: ['Adds optional project tracking to requests.', 'Supports project-level spend reports.', 'Can be disabled or closed without deleting historical usage.'], endpoints: [ApiEndpoints.admin.projects] } },
  { path: '', pathMatch: 'full', redirectTo: 'departments' }
];
