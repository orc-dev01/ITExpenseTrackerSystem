import { Routes } from '@angular/router';
import { RequestDetailPage } from './request-detail/request-detail-page';
import { RequestFormPage } from './request-form/request-form-page';
import { RequestListPage } from './request-list/request-list-page';

export const REQUEST_ROUTES: Routes = [
  { path: '', component: RequestListPage, data: { roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin'] } },
  { path: 'new', component: RequestFormPage, data: { roles: ['Requester', 'Admin'] } },
  { path: ':id/edit', component: RequestFormPage, data: { roles: ['Requester', 'Admin'] } },
  { path: ':id', component: RequestDetailPage, data: { roles: ['Requester', 'Endorser', 'Approver', 'FinanceViewer', 'Admin'] } }
];
