import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const DISBURSEMENT_ROUTES: Routes = [
  { path: 'accounting', component: FeaturePage, data: { title: 'Accounting Queue', subtitle: 'Phase 2 queue for approved expense disbursement.', phase: 'Phase 2', mockKey: 'disbursementAccounting', primaryAction: 'Update Status', roles: ['FinanceViewer', 'Admin'], capabilities: ['Approved expense requests route to Accounting.', 'Finance updates Pending, In Process, Completed, or On Hold.', 'Completed disbursements can close the request.', 'GL export uses completed or approved records depending on Finance rules.'], endpoints: [ApiEndpoints.disbursement.accountingQueue, ApiEndpoints.disbursement.updateStatus(':id')] } },
  { path: 'purchasing', component: FeaturePage, data: { title: 'Purchasing Queue', subtitle: 'Phase 2 queue for procurement acquisition processing.', phase: 'Phase 2', mockKey: 'disbursementPurchasing', primaryAction: 'Create PO', roles: ['FinanceViewer', 'Admin'], capabilities: ['Approved procurement requests route to Purchasing.', 'Purchasing tracks acquisition status and expected delivery.', 'Phase 3 expands this into purchase order and delivery records.', 'Requesters can later see fulfillment status.'], endpoints: [ApiEndpoints.disbursement.purchasingQueue, ApiEndpoints.disbursement.updateStatus(':id')] } },
  { path: '', pathMatch: 'full', redirectTo: 'accounting' }
];
