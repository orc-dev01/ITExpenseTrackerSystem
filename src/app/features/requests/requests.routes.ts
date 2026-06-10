import { Routes } from '@angular/router';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { RequestFormPage } from './request-form/request-form-page';
import { RequestListPage } from './request-list/request-list-page';

export const REQUEST_ROUTES: Routes = [
  { path: '', component: RequestListPage, data: { roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin'] } },
  { path: 'new', component: RequestFormPage, data: { roles: ['Requester', 'Admin'] } },
  {
    path: ':id',
    component: FeaturePage,
    data: {
      title: 'Expense Request Detail',
      subtitle: 'Detailed request screen placeholder. The list and creation workflow are localStorage-backed now.',
      mockKey: 'requests',
      primaryAction: 'Back to List',
      roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin'],
      capabilities: ['Detail page will show header, line items, attachments, seller links, and workflow history.', 'Action buttons should be shown based on current status and role.', 'File download will call authenticated backend endpoints later.'],
      endpoints: [ApiEndpoints.requests.detail(':id'), ApiEndpoints.workflow.auditTrail(':id'), ApiEndpoints.files.download(':fileId')]
    }
  }
];
