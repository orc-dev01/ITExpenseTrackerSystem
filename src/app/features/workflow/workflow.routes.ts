import { Routes } from '@angular/router';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { FeaturePage } from '@shared/pages/feature-page/feature-page';
import { AuditTrailPage } from './audit-trail/audit-trail-page';

export const WORKFLOW_ROUTES: Routes = [
  {
    path: 'endorsements',
    component: FeaturePage,
    data: {
      title: 'Endorsement Queue',
      subtitle: 'Department manager queue for endorse, return, and reject actions.',
      phase: 'Coming Soon',
      comingSoon: true,
      comingSoonMessage: 'The dedicated endorsement queue is not active yet. For now, use the Requests screen to view submitted requests while workflow actions are being completed.',
      mockKey: 'endorsements',
      primaryAction: 'Open Oldest Urgent',
      roles: ['Endorser', 'Admin'],
      capabilities: ['Endorser reviews requests from assigned departments.', 'Endorse routes to Approver.', 'Return sends request back to Draft with mandatory remarks.', 'Reject terminates the request with mandatory remarks.'],
      endpoints: [ApiEndpoints.workflow.endorsements, ApiEndpoints.workflow.endorse(':id'), ApiEndpoints.workflow.return(':id'), ApiEndpoints.workflow.reject(':id')]
    }
  },
  {
    path: 'approvals',
    component: FeaturePage,
    data: {
      title: 'Approval Queue',
      subtitle: 'Approver queue for final approval, sequential secondary approval, return, and rejection.',
      phase: 'Coming Soon',
      comingSoon: true,
      comingSoonMessage: 'The dedicated approval queue is not active yet. Approval routing and queue actions are still being completed.',
      mockKey: 'approvals',
      primaryAction: 'Review Next Request',
      roles: ['Approver', 'Admin'],
      capabilities: ['Approver sees full request details, files, seller links, and endorsement history.', 'Approve routes expense to Finance queue or procurement to Purchasing queue.', 'Requests above threshold can require secondary approval.', 'Budget warnings appear before final action in Phase 2.'],
      endpoints: [ApiEndpoints.workflow.approvals, ApiEndpoints.workflow.approve(':id'), ApiEndpoints.workflow.return(':id'), ApiEndpoints.workflow.reject(':id')]
    }
  },
  {
    path: 'audit',
    component: AuditTrailPage,
    data: {
      roles: ['Approver', 'FinanceViewer', 'Admin']
    }
  },
  { path: '', pathMatch: 'full', redirectTo: 'endorsements' }
];
