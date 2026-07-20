# IT Expense System - Current Working PRD for QA

## 1. Purpose

This document defines the functionality that is currently working and ready for QA testing in the IT Expense system. It also lists modules that are visible in the application but are not yet active, so QA can avoid logging bugs for planned/future work.

## 2. Product Summary

IT Expense is an internal web application hosted on the company/server PC and accessed through the server IP address.

Example test URL:

```text
http://192.168.1.221:5000
```

The application currently supports authentication, role-based navigation, request creation, request visibility by role, basic request workflow actions, notifications, attachments, dashboard counts, and finance processing for approved expense requests.

## 3. Current Working Scope

QA should test only the following working areas:

- Login and logout
- Role-based menu visibility
- Request dashboard
- Request list
- New request form
- Draft request save/edit/delete
- Submit request
- Request detail page
- Request search and status filter
- Request workflow actions from the main Requests list/detail pages
- Return/reject remarks modal
- Workflow history/audit trail on request detail
- File attachments on draft/returned requests
- Notifications
- Finance queue for approved expense requests
- Account information page, if visible

## 4. Not In Current Scope

The following modules are visible but should be treated as future work or placeholder screens:

- Workflow > Endorsements
- Workflow > Approvals
- Reports > Spend Reports
- Reports > Finance Exports
- Admin > Approval Matrix
- Budgets
- Procurement
- Reimbursements
- Purchase workflow
- Budget validation
- Editable approval matrix
- Full report generation
- GL export
- Email notification sending

If these pages show "Coming Soon", disabled buttons, reserved API hooks, or planned scope text, that is expected.

## 5. User Roles

The system uses these roles:

| Role | Current Purpose |
| --- | --- |
| Requester | Creates, saves, edits, submits, and views own requests. |
| Endorser | Views and acts on requests with `PendingEndorsement` status. |
| Approver | Views and acts on requests with `PendingApproval` status. |
| FinanceViewer | Views approved/closed requests and processes finance status. |
| Admin | Can view all requests and access admin-only navigation. |

Important QA note:

Admin-only users can view all requests, but action buttons on the Requests screen depend on workflow roles. For a single QA superuser that can test everything, assign all roles:

```text
Requester, Endorser, Approver, FinanceViewer, Admin
```

## 6. Recommended QA Accounts

Use real users created in SQL. Recommended minimum accounts:

| Account Type | Required Roles |
| --- | --- |
| Requester account | `Requester` |
| Endorser account | `Endorser` |
| Approver account | `Approver` |
| Finance account | `FinanceViewer` |
| Admin account | `Admin` |
| Full QA account | `Requester, Endorser, Approver, FinanceViewer, Admin` |

QA should record the exact email used for each role before testing.

## 7. Request Status Flow

The current working workflow is:

```text
Draft
-> PendingEndorsement
-> PendingApproval
-> Approved / Pending Finance
-> Approved / In Process
-> Approved / Processed
-> Closed
```

Alternative paths:

```text
PendingEndorsement -> Returned -> PendingEndorsement
PendingApproval -> Returned -> PendingEndorsement
PendingEndorsement -> Rejected
PendingApproval -> Rejected
Draft -> Deleted
```

## 8. Working Screens and Expected Behavior

### 8.1 Login

Path:

```text
/auth/login
```

Expected:

- User can log in with a valid active email and password.
- Invalid credentials show an error.
- After login, user is redirected into the application.
- Navigation items depend on the logged-in user's roles.

### 8.2 Dashboard

Path:

```text
/dashboard
```

Expected:

- Shows backend-powered request counts based on the current user's visible requests.
- Shows total visible requests, pending action, urgent count, total amount, status counts, and recent visible requests.
- Refresh button reloads backend data.
- Recent request links open request detail.

### 8.3 Request List

Path:

```text
/requests
```

Expected:

- Requester sees only own requests.
- Endorser sees requests in `PendingEndorsement`.
- Approver sees requests in `PendingApproval`.
- FinanceViewer sees `Approved` and `Closed` requests.
- Admin sees all requests.
- Search filters by request number, title, requester, department, status, amount, and related fields.
- Status filter limits rows by selected status.
- Clear button resets filters.
- Clicking a row opens the request detail page.

### 8.4 New Request

Path:

```text
/requests/new
```

Expected:

- Available for Requester and Admin.
- Required fields:
  - Title
  - Justification
  - Department
  - Cost Center
  - Request Type
  - At least one line item
  - Line item category
  - Vendor
  - Description
  - Quantity
  - Unit amount
- Optional fields:
  - Project
  - Seller link
  - Urgent flag
- Grand total updates based on line item quantity and unit amount.
- Add Line Item creates another line item panel.
- Remove deletes a line item, except the last remaining item.

### 8.5 Save Draft

Expected:

- Clicking Save Draft creates a request with status `Draft`.
- Draft request appears in the Requester's request list.
- Draft can be edited.
- Draft can be deleted.
- Draft can be submitted later.

### 8.6 Submit Request

Expected:

- Clicking Submit Request creates/submits the request.
- Status becomes `PendingEndorsement`.
- Request number is generated in the format:

```text
EXP-YYYY-000001
```

- The request becomes visible to Endorser users.
- The action is written to workflow history.
- Endorser users may receive an in-app notification.

### 8.7 Request Detail

Path:

```text
/requests/:id
```

Expected:

- Shows request header, status, requester, department, cost center, type, finance status, amount, project, created/submitted/updated dates.
- Shows line items with category, description, vendor, quantity, unit amount, line total, and seller link.
- Shows workflow history.
- Shows available actions based on current user's role and request status.

### 8.8 Attachments

Expected:

- Attachments are grouped by line item.
- Requester/Admin can upload attachments while request is `Draft` or `Returned`.
- File size limit is 5 MB.
- Uploaded files appear under the line item.
- View opens/downloads the file in a browser tab when supported.
- Download saves the file.
- Attachments are visible based on role and workflow status:
  - Requester can view own request attachments.
  - Admin can view attachments.
  - Endorser can view while status is `PendingEndorsement`.
  - Approver can view while status is `PendingApproval`.
  - FinanceViewer can view when status is `Approved` or `Closed`.

## 9. Workflow Testing Through Requests Screen

The dedicated Workflow > Endorsements and Workflow > Approvals pages are marked Coming Soon. QA should test workflow actions from:

```text
/requests
/requests/:id
```

### 9.1 Endorse Request

Precondition:

- Request status is `PendingEndorsement`.
- Tester is logged in as Endorser, or a user with Endorser role.

Steps:

1. Open Requests.
2. Find the submitted request.
3. Click Endorse from list or detail page.

Expected:

- Status changes to `PendingApproval`.
- Request disappears from Endorser visible list.
- Request appears for Approver users.
- Workflow history records `Endorsed`.
- Approver users may receive a notification.

### 9.2 Return Request From Endorsement

Precondition:

- Request status is `PendingEndorsement`.
- Tester is Endorser.

Steps:

1. Click Return.
2. Enter required remarks.
3. Confirm.

Expected:

- Status changes to `Returned`.
- Remarks are shown on request detail.
- Requester can edit and resubmit.
- Workflow history records `Returned`.

### 9.3 Reject Request From Endorsement

Precondition:

- Request status is `PendingEndorsement`.
- Tester is Endorser.

Expected:

- Reject requires remarks.
- Status changes to `Rejected`.
- Requester can view the rejected request and remarks.
- Request should not continue to Approver or Finance.

### 9.4 Approve Request

Precondition:

- Request status is `PendingApproval`.
- Tester is Approver.

Steps:

1. Open Requests.
2. Click Approve.

Expected:

- Status changes to `Approved`.
- Finance status becomes `Pending`.
- Request appears in Finance Queue for FinanceViewer users.
- Workflow history records `Approved`.
- Requester and FinanceViewer users may receive notifications.

### 9.5 Return Request From Approval

Precondition:

- Request status is `PendingApproval`.
- Tester is Approver.

Expected:

- Return requires remarks.
- Status changes to `Returned`.
- Requester can edit and resubmit.
- Workflow history records `Returned`.

### 9.6 Reject Request From Approval

Precondition:

- Request status is `PendingApproval`.
- Tester is Approver.

Expected:

- Reject requires remarks.
- Status changes to `Rejected`.
- Requester can view the rejected request and remarks.

## 10. Finance Queue

Path:

```text
/disbursement/accounting
```

Role:

```text
FinanceViewer or Admin
```

Expected:

- Shows approved expense requests waiting for finance processing.
- Summary cards show waiting finance, ready to close, urgent count, and total amount.
- Finance can change finance status:
  - Pending
  - In Process
  - Processed
  - On Hold
- Start Processing changes status to `InProcess`.
- Mark Processed changes status to `Processed`.
- On Hold changes status to `OnHold`.
- Close Request is enabled only when finance status is `Processed`.
- Closing a request changes request status to `Closed` and removes it from the finance queue.

## 11. Notifications

Path:

```text
/notifications
```

Expected:

- Shows unread count, total count, and latest notification type.
- Notification list includes subject, message, type, unread badge, and date.
- View Request opens the related request.
- Mark Read marks one notification as read.
- Mark All Read clears unread notifications.
- Refresh reloads notifications from backend.

Notification events currently expected:

- Request submitted/resubmitted notifies Endorser role.
- Request returned notifies requester.
- Request approved notifies requester and FinanceViewer role.
- Finance status updated notifies requester.
- Request closed notifies requester.

## 12. Audit Trail

Paths:

```text
/workflow/audit
/requests/:id
```

Expected:

- Request detail shows workflow history for the selected request.
- Audit records include action, actor, actor role, timestamp, and remarks when applicable.
- Audit visibility follows request visibility rules.

## 13. Access Rules To Verify

QA should verify that users cannot access pages outside their role.

Expected examples:

- Requester can access New Request.
- Endorser without Requester role should not see New Request.
- Approver should not create requests unless also Requester/Admin.
- FinanceViewer should access Finance Queue.
- Admin should access admin navigation.
- Users without a required role should be redirected or blocked by the app.

## 14. Validation Rules To Verify

QA should verify:

- Empty title cannot submit.
- Empty justification cannot submit.
- Empty vendor cannot submit.
- Empty description cannot submit.
- Quantity must be at least 1.
- Unit amount must be at least 1.
- Return/reject require remarks.
- Attachment over 5 MB is rejected.

## 15. Out Of Scope / Future Work Details

These are planned but not ready for QA validation:

| Module | Current Expected State |
| --- | --- |
| Workflow > Endorsements | Coming Soon screen. Do not test queue data/actions here. |
| Workflow > Approvals | Coming Soon screen. Do not test queue data/actions here. |
| Reports > Spend Reports | Coming Soon screen. Previous sample values are not real reports. |
| Reports > Finance Exports | Coming Soon screen. CSV/GL export is not active. |
| Admin > Approval Matrix | Coming Soon screen. Rules are seeded in SQL and not editable in UI. |
| Budgets | Future phase. |
| Procurement | Future phase. |
| Reimbursements | Future phase. |
| Purchase request workflow | Future phase. |
| Budget checking | Future phase. |
| Email sending | Future phase. |

## 16. Smoke Test Script

QA can use this as a quick end-to-end pass:

1. Login as Requester.
2. Create a new expense request with one line item.
3. Save as Draft.
4. Open the draft and upload one small attachment.
5. Edit the draft.
6. Submit the request.
7. Confirm status is `PendingEndorsement`.
8. Login as Endorser.
9. Open Requests and endorse the request.
10. Confirm status becomes `PendingApproval`.
11. Login as Approver.
12. Open Requests and approve the request.
13. Confirm status becomes `Approved / Pending Finance`.
14. Login as FinanceViewer.
15. Open Finance Queue.
16. Mark the request `In Process`.
17. Mark the request `Processed`.
18. Close the request.
19. Confirm status becomes `Closed`.
20. Login as Requester and confirm the request history and notifications are visible.

## 17. Known Notes

- Use the main Requests screen for workflow actions during this release.
- A single user with all roles is useful for QA, but role-specific accounts should still be tested.
- If testing local frontend against server backend, only run `npm.cmd start` locally and keep the server backend running.
- The server-hosted production-like app is accessed from the server IP and port `5000`.
