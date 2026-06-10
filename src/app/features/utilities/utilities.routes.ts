import { Routes } from '@angular/router';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const UTILITY_ROUTES: Routes = [
  { path: 'monitoring', component: FeaturePage, data: { title: 'Monitoring', subtitle: 'Operational checks and future system health views.', mockKey: 'utilities', roles: ['Admin'], capabilities: ['Checks backend health once an API exists.', 'Tracks notification and export jobs.', 'Verifies file storage availability and access controls.'], endpoints: ['/health', '/jobs/notifications', '/storage/check'] } },
  { path: '', pathMatch: 'full', redirectTo: 'monitoring' }
];
