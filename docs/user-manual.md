# IT Expense User Manual

This manual explains how employees, approvers, finance users, and administrators use the IT Expense system.

The system is used to create IT expense requests, route them for endorsement and approval, track finance processing, review audit history, and view request notifications.

## 1. User Roles

Your available menu items and actions depend on your assigned role.

| Role | Main Purpose |
| --- | --- |
| Requester | Creates expense requests, saves drafts, submits requests, edits returned requests, and uploads attachments. |
| Endorser | Reviews submitted requests and can endorse, return, or reject them. |
| Approver | Reviews endorsed requests and can approve, return, or reject them. |
| Finance Viewer | Processes approved expense requests and closes completed requests. |
| Admin | Has broad access to setup, monitoring, and workflow screens. |

Some users may have more than one role.

## 2. Login And Logout

1. Open the IT Expense application URL provided by IT.
2. Enter your email address.
3. Enter your password.
4. Click `Sign in`.

After login, your name and email appear at the top of the screen.

To logout, click `Logout` in the top-right header.

If login fails, check that the email and password are correct. If the account is still not working, contact the system administrator.

## 3. Main Navigation

The left sidebar contains the modules available to your role.

Common menu items:

- `Dashboard` - shows request counts, pending actions, urgent requests, and recent visible requests.
- `Requests` - main screen for viewing requests and performing most workflow actions.
- `New Request` - creates a new request. Visible to Requester and Admin roles.
- `Notifications` - shows submitted, returned, and approved request alerts.
- `Account` - shows current user profile and role information.

Role-based menu items:

- `Approval Report` - report page for Approver and Admin users.
- `Endorsements` - planned dedicated endorsement queue. In the current release, use `Requests` for endorsement actions.
- `Approvals` - planned dedicated approval queue. In the current release, use `Requests` for approval actions.
- `Audit Trail` - workflow history for Approver, Finance Viewer, and Admin users.
- `Disbursement` - finance queue for Finance Viewer and Admin users.
- `Maintenance` - setup screens for Admin users.
- `Admin` - approval matrix and reference data screens for Admin users.
- `Utilities` - operational monitoring screens for Admin users.

Some modules are marked `Coming Soon`. These screens are placeholders for future phases and may not allow data entry yet.

## 4. Request Statuses

| Status | Meaning |
| --- | --- |
| Draft | The requester saved the request but has not submitted it. |
| PendingEndorsement | The request was submitted and is waiting for an endorser. |
| PendingApproval | The request was endorsed and is waiting for an approver. |
| Approved | The request was approved and is ready for finance processing. |
| Returned | The request was sent back to the requester for changes. |
| Rejected | The request was rejected and will not continue. |
| Cancelled | The request was cancelled. |
| Closed | Finance completed processing and closed the request. |

For approved expense requests, a finance status may also appear:

| Finance Status | Meaning |
| --- | --- |
| Pending Finance | Approved request is waiting for finance action. |
| In Process | Finance has started processing the request. |
| On Hold | Finance paused the request for follow-up. |
| Processed | Finance completed processing and the request can be closed. |

## 5. Dashboard

Open `Dashboard` to see a quick summary of your visible requests.

The dashboard shows:

- Total visible requests.
- Requests pending your action.
- Urgent requests.
- Total amount.
- Counts by status.
- Recent visible requests.

Click `Refresh` to reload dashboard counts.

Click `View Requests` or a request number to open the request list or request detail page.

## 6. Viewing And Searching Requests

Open `Requests` to view requests available to your role.

The request list shows:

- Request number.
- Title and justification.
- Requester.
- Department.
- Status.
- Amount.
- Urgent flag.
- Available actions.

Use `Search requests` to search by request number, title, requester, or department.

Use the `Status` filter to show only one status.

Click `Clear` to remove filters.

Click a request row or request number to open the request detail page.

## 7. Creating A New Request

Requester and Admin users can create requests.

1. Open `New Request`.
2. Fill in the request header:
   - `Title`
   - `Justification`
   - `Department`
   - `Cost Center`
   - `Project`, if applicable
   - `Type`
   - `Mark as urgent`, if needed
3. Add line item details:
   - `Category`
   - `Vendor`
   - `Description`
   - `Quantity`
   - `Unit Amount`
   - `Seller Link`, if available
4. Click `Add Line Item` if the request has multiple items.
5. Review the `Grand Total`.
6. Click `Save Draft` to save without submitting, or click `Submit Request` to send it to workflow.

Required fields must be completed before saving or submitting.

## 8. Editing Draft Or Returned Requests

Requester users can edit requests only when the request is `Draft` or `Returned`.

1. Open `Requests`.
2. Open the draft or returned request.
3. Click `edit`.
4. Update the request details or line items.
5. If the request was returned, review the return remarks before resubmitting.
6. Click `Save Changes` or `Submit Request`.

After resubmission, the request goes back to the workflow.

## 9. Attachments

Attachments are managed from the request detail page.

Requester users can upload files while a request is `Draft` or `Returned`.

1. Open the request detail page.
2. Go to the `Attachments` section.
3. Find the correct line item.
4. Click `Upload File`.
5. Select the file to upload.

File limit:

```text
5 MB per file
```

Users who can view attachments:

- Admin users.
- The requester who owns the request.
- Endorsers while the request is pending endorsement.
- Approvers while the request is pending approval.
- Finance users after the request is approved or closed.

Use `View` to preview an attachment and `Download` to save a copy.

## 10. Endorsing Requests

Endorser users review requests with status `PendingEndorsement`.

In the current release, endorsement actions are performed from `Requests`, not from the dedicated `Endorsements` queue.

1. Open `Requests`.
2. Open a request with status `PendingEndorsement`.
3. Review the header, justification, line items, seller links, attachments, and workflow history.
4. Choose an action:
   - `endorse` sends the request to approval.
   - `return` sends the request back to the requester for changes.
   - `reject` stops the request.
5. If returning or rejecting, enter clear remarks.

Returned and rejected actions should always explain what the requester needs to correct or why the request cannot proceed.

## 11. Approving Requests

Approver users review requests with status `PendingApproval`.

In the current release, approval actions are performed from `Requests`, not from the dedicated `Approvals` queue.

1. Open `Requests`.
2. Open a request with status `PendingApproval`.
3. Review the details, amount, line items, seller links, attachments, and workflow history.
4. Choose an action:
   - `approve` approves the request and sends it to finance processing.
   - `return` sends the request back to the requester for corrections.
   - `reject` stops the request.
5. If returning or rejecting, enter clear remarks.

Approved expense requests appear in the finance queue.

## 12. Finance Processing

Finance Viewer and Admin users can process approved expense requests.

1. Open `Disbursement`.
2. Review the `Finance Queue`.
3. Click `Refresh Queue` if needed.
4. For each approved request, use one of these actions:
   - `View` opens request details.
   - `Start Processing` changes finance status to `In Process`.
   - `Mark Processed` changes finance status to `Processed`.
   - `On Hold` changes finance status to `On Hold`.
   - `Close Request` closes a request after it is processed.

`Close Request` is available only after the finance status is `Processed`.

## 13. Audit Trail

Approver, Finance Viewer, and Admin users can open `Audit Trail`.

The audit trail shows:

- Date and time.
- Request number.
- Actor.
- Actor role.
- Action.
- Remarks.

Use the search field to search by request number, actor, role, action, or remarks.

Use the action filter to show a specific action type.

Open a request number to view the related request detail page.

## 14. Notifications

Open `Notifications` to see request updates.

Notifications may appear for:

- Submitted requests.
- Returned requests.
- Approved requests.

The notification page shows unread count, total notifications, and the latest notification type.

Actions:

- `Refresh` reloads notifications.
- `Mark All Read` marks every notification as read.
- `View Request` opens the related request and marks the notification as read.
- `Mark Read` marks a single notification as read.

## 15. Approval Report

Approver and Admin users can open `Approval Report`.

The report page allows:

- Filtering by department.
- Filtering by request status.
- Grouping by requester.
- Selecting visible columns.
- Exporting CSV.
- Printing or saving as PDF from the browser.

Use `Export CSV` for spreadsheet review.

Use `Print / Save PDF` to open the browser print dialog and save a PDF copy.

## 16. Maintenance And Admin Screens

Admin users can open `Maintenance` and `Admin`.

Maintenance screens include:

- Departments.
- Cost Centers.
- Expense Categories.
- Users.
- Projects.

Admin screens include:

- Approval Matrix.
- Reference Data.

Current limitation: some setup screens are display or placeholder screens. Approval matrix rules are currently seeded through SQL and may not be editable from the UI yet.

## 17. Future Or Placeholder Modules

These modules are visible for planning but are not fully active in the current working release:

- Dedicated `Endorsements` queue.
- Dedicated `Approvals` queue.
- `Reports` spend reports and finance exports.
- `Budgets`.
- `Procurement`.
- `Reimbursements`.
- Some `Admin` setup actions.

If a screen says `Coming soon`, do not use it for real data entry. Use the active `Requests`, `Disbursement`, `Audit Trail`, `Notifications`, and `Approval Report` screens instead.

## 18. Recommended End-To-End Workflow

1. Requester creates a request.
2. Requester saves it as draft or submits it.
3. Submitted request becomes `PendingEndorsement`.
4. Endorser endorses, returns, or rejects it.
5. Endorsed request becomes `PendingApproval`.
6. Approver approves, returns, or rejects it.
7. Approved expense request appears in `Disbursement`.
8. Finance starts processing.
9. Finance marks the request as processed.
10. Finance closes the request.
11. Users review history in `Audit Trail` and updates in `Notifications`.

## 19. Good Data Entry Practices

- Use a clear title that identifies the item or purpose.
- Write a justification that explains why the expense is needed.
- Select the correct department and cost center.
- Use one line item per product or service type.
- Enter quantity and unit amount carefully.
- Include seller links when available.
- Upload supporting documents before submitting.
- Use urgent only when the request really requires priority handling.
- For return or reject remarks, explain the reason clearly.

## 20. Troubleshooting

Problem: I cannot see a menu item.

Check: your role may not have access. Contact Admin if your access is incorrect.

Problem: I cannot submit a request.

Check: required fields must be completed. Each line item needs category, vendor, description, quantity, and unit amount.

Problem: I cannot edit a request.

Check: only `Draft` and `Returned` requests can be edited by the requester.

Problem: I cannot upload an attachment.

Check: attachments can be uploaded only while the request is `Draft` or `Returned`, and the file must be 5 MB or smaller.

Problem: I cannot approve or endorse.

Check: the request may not be in the correct status, or your account may not have the required role.

Problem: Finance cannot close the request.

Check: the finance status must be `Processed` before closing.

Problem: The page shows old information.

Check: click `Refresh` where available, then reload the browser page if needed.

## 21. Quick Reference

| Task | Menu |
| --- | --- |
| View summary | Dashboard |
| Create request | New Request |
| Search requests | Requests |
| Endorse or approve | Requests |
| Upload files | Request detail page |
| Process finance queue | Disbursement |
| Review workflow logs | Audit Trail |
| Read alerts | Notifications |
| Export approval report | Approval Report |
| Manage setup data | Maintenance or Admin |
