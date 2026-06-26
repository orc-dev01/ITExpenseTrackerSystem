import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const REIMBURSEMENT_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Reimbursements', subtitle: 'Phase 3 employee reimbursement submission and payment tracking.', phase: 'Phase 3', comingSoon: true, comingSoonMessage: 'Employee reimbursement capture and payment tracking are planned for Phase 3 and are not part of the current working release.', mockKey: 'reimbursements', primaryAction: 'New Reimbursement', capabilities: ['Employees will enter vendor, receipt date, category, and amount.', 'Receipts will attach to reimbursement line items.', 'Workflow will follow the same endorsement and approval chain.', 'Finance will track payment status through confirmation.'], endpoints: [ApiEndpoints.reimbursements.list, ApiEndpoints.reimbursements.submit, ApiEndpoints.reimbursements.updatePaymentStatus(':id')] } }
];
