import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';

export const ACCOUNT_INFO_ROUTES: Routes = [
  { path: '', component: FeaturePage, data: { title: 'Account Info', subtitle: 'Current user profile, roles, department, and session details.', mockKey: 'account', capabilities: ['Displays authenticated user identity.', 'Shows assigned department and roles.', 'Useful for verifying role-based route behavior while testing.'], endpoints: [ApiEndpoints.auth.me] } }
];
