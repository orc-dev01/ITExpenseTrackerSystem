import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const REIMBURSEMENT_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Reimbursements', subtitle: 'Phase 3 employee reimbursement submission and payment tracking.', phase: 'Phase 3', mockKey: 'reimbursements', primaryAction: 'New Reimbursement', capabilities: ['Employee enters vendor, receipt date, category, and amount.', 'Receipts attach to reimbursement line items.', 'Workflow follows the same endorsement and approval chain.', 'Finance tracks payment status through confirmation.'], endpoints: [ApiEndpoints.reimbursements.list, ApiEndpoints.reimbursements.submit, ApiEndpoints.reimbursements.updatePaymentStatus(':id')] } }
];
