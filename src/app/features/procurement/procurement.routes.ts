import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const PROCUREMENT_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Purchase Requests', subtitle: 'Phase 3 purchase workflow and marketplace quotation comparison.', phase: 'Phase 3', mockKey: 'procurement', primaryAction: 'New Purchase Request', capabilities: ['Employees submit purchase requests with seller links.', 'Multiple links can be compared side by side.', 'Approved requests generate purchasing records.', 'Delivery and receiving are tracked until closed.'], endpoints: [ApiEndpoints.procurement.purchaseRequests, ApiEndpoints.procurement.quotationComparison(':lineItemId'), ApiEndpoints.procurement.delivery(':id')] } }
];
