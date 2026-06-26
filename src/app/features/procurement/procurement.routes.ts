import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const PROCUREMENT_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Purchase Requests', subtitle: 'Phase 3 purchase workflow and marketplace quotation comparison.', phase: 'Phase 3', comingSoon: true, comingSoonMessage: 'Standalone purchase requests and quotation comparison are planned for Phase 3 and are intentionally skipped for now.', mockKey: 'procurement', primaryAction: 'New Purchase Request', capabilities: ['Employees will submit purchase requests with seller links.', 'Multiple links will be compared side by side.', 'Approved requests will generate purchasing records.', 'Delivery and receiving will be tracked until closed.'], endpoints: [ApiEndpoints.procurement.purchaseRequests, ApiEndpoints.procurement.quotationComparison(':lineItemId'), ApiEndpoints.procurement.delivery(':id')] } }
];
