import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';
import { AccountingQueuePage } from './accounting-queue/accounting-queue-page';

export const DISBURSEMENT_ROUTES: Routes = [
  {
    path: 'accounting',
    component: AccountingQueuePage,
    data: { roles: ['FinanceViewer', 'Admin'] }
  },
  {
    path: 'purchasing',
    component: FeaturePage,
    data: {
      title: 'Purchasing Queue',
      subtitle: 'Phase 2 queue for procurement acquisition processing.',
      phase: 'Phase 2',
      comingSoon: true,
      comingSoonMessage: 'Purchasing fulfillment is reserved for the next phase. The current release keeps procurement requests out of the purchasing queue.',
      mockKey: 'disbursementPurchasing',
      primaryAction: 'Create PO',
      roles: ['FinanceViewer', 'Admin'],
      capabilities: ['Approved procurement requests will route to Purchasing.', 'Purchasing will track acquisition status and expected delivery.', 'Phase 3 will expand this into purchase order and delivery records.', 'Requesters will later see fulfillment status.'],
      endpoints: [ApiEndpoints.disbursement.purchasingQueue, ApiEndpoints.disbursement.updateStatus(':id')]
    }
  },
  { path: '', pathMatch: 'full', redirectTo: 'accounting' }
];
