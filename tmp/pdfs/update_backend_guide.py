from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "it-expense-from-scratch-guide.pdf"


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            alignment=TA_CENTER,
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#163B73"),
            spaceAfter=18,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSub",
            parent=styles["BodyText"],
            alignment=TA_CENTER,
            fontSize=12,
            leading=17,
            textColor=colors.HexColor("#39465E"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading1"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#163B73"),
            spaceBefore=8,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subsection",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#244D8F"),
            spaceBefore=6,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodySmall",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CodeBlock",
            parent=styles["Code"],
            fontName="Courier",
            fontSize=8,
            leading=10,
            backColor=colors.HexColor("#F3F6FA"),
            borderColor=colors.HexColor("#D8E0EA"),
            borderWidth=0.4,
            borderPadding=5,
            spaceBefore=3,
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Callout",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#27384F"),
            backColor=colors.HexColor("#EEF5FF"),
            borderColor=colors.HexColor("#BFD7FF"),
            borderWidth=0.5,
            borderPadding=6,
            spaceBefore=4,
            spaceAfter=8,
        )
    )
    return styles


def p(text, style="BodySmall"):
    return Paragraph(text, STYLES[style])


def code(text):
    safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe.replace("\n", "<br/>"), STYLES["CodeBlock"])


def bullet(items):
    story = []
    for item in items:
        story.append(p(f"- {item}"))
    return story


def section(title):
    return [Spacer(1, 0.05 * inch), p(title, "Section")]


def subsection(title):
    return [p(title, "Subsection")]


def simple_table(headers, rows, widths=None):
    data = [[p(str(h), "BodySmall") for h in headers]]
    for row in rows:
        data.append([p(str(cell), "BodySmall") for cell in row])
    table = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#163B73")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CCD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFD")]),
            ]
        )
    )
    return table


def page_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawString(0.6 * inch, 0.42 * inch, "IT Expense System - Beginner From-Scratch Build Tutorial")
    canvas.drawRightString(7.9 * inch, 0.42 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_story():
    story = []
    story.append(Spacer(1, 1.0 * inch))
    story.append(p("IT Expense System", "CoverTitle"))
    story.append(p("Beginner From-Scratch Build Tutorial", "CoverTitle"))
    story.append(
        p(
            "Updated after backend connection: Angular frontend, Bootstrap styling, Node.js Express API, dummy data store, real request workflow, validation, attachments, dashboard counts, notifications, and future SQL Server integration.",
            "CoverSub",
        )
    )
    story.append(Spacer(1, 0.25 * inch))
    story.append(p("<b>Updated:</b> June 24, 2026", "CoverSub"))
    story.append(Spacer(1, 0.35 * inch))
    story.append(
        p(
            "<b>Beginner promise:</b> This guide explains what to build, why each folder exists, where each file belongs, how components connect to services and routes, how backend endpoints work, and how the current dummy store can later become SQL Server.",
            "Callout",
        )
    )
    story.append(PageBreak())

    story.extend(section("1. The Big Mental Model"))
    story.append(
        p(
            "The app has three layers. The Angular frontend is what the user sees. The Express backend is the API Angular calls. The dummy store is a temporary in-memory database replacement. Later, SQL Server will replace the dummy store while the frontend and route names can mostly stay the same."
        )
    )
    story.append(code("User clicks button\n-> Angular component handles click\n-> Component calls feature service or store\n-> ApiService sends HTTP request\n-> Express middleware checks token and role\n-> Express route validates status and fields\n-> dummy-store.js reads or changes data\n-> JSON returns to Angular\n-> Component updates the UI"))
    story.append(
        simple_table(
            ["Piece", "Beginner explanation"],
            [
                ["Component", "A screen or part of a screen, such as RequestListPage or NotificationsPage."],
                ["Template HTML", "The markup where forms, buttons, tables, Bootstrap classes, and Angular control flow live."],
                ["Service", "Reusable TypeScript logic. Example: ApiService knows the backend base URL."],
                ["Store", "Frontend store holds request state and calls RequestApiService. Backend dummy store holds temporary server data."],
                ["Route", "Frontend routes show screens. Backend routes expose HTTP endpoints."],
                ["Middleware", "Backend code that runs before endpoints, usually auth and role checks."],
                ["Validator", "Backend code that rejects bad request data before it reaches the store."],
            ],
            [1.45 * inch, 5.6 * inch],
        )
    )

    story.extend(section("2. Current Project Structure"))
    story.append(p("Use this structure when rebuilding from scratch. It keeps responsibilities separate and makes the SQL Server change safer later."))
    story.append(
        simple_table(
            ["Folder or file", "Purpose"],
            [
                ["src/app/core/api", "ApiService and ApiEndpoints. All frontend backend paths are centralized here."],
                ["src/app/core/auth", "Login session, token interceptor, auth guard, role guard."],
                ["src/app/features/requests", "Request list, detail, form, remarks modal, request API service, and request store."],
                ["src/app/features/dashboard", "Backend-powered request dashboard counts and approval report."],
                ["src/app/features/notifications", "Backend-powered notification list, unread count, mark read, mark all read."],
                ["src/app/shared/layout", "Main sidebar layout and navigation."],
                ["backend/server.js", "Express app entry point. Mounts all backend route files."],
                ["backend/routes", "Express route files grouped by module."],
                ["backend/middleware", "Backend auth and role middleware."],
                ["backend/validators", "Backend validation before saving requests."],
                ["backend/store/dummy-store.js", "Temporary in-memory data layer. Later becomes SQL Server repositories."],
                ["backend/uploads", "Temporary local file storage for uploaded attachments."],
            ],
            [2.15 * inch, 4.9 * inch],
        )
    )

    story.extend(section("3. Start From Zero"))
    steps = [
        ("Create Angular app", "Angular CLI creates the frontend structure, TypeScript setup, routing, and build config.", "ng new it-expense --routing --style=css\ncd it-expense"),
        ("Install dependencies", "Bootstrap styles the UI. Express is the API server. CORS allows Angular to call Express.", "npm.cmd install bootstrap express cors"),
        ("Create backend folder", "Keep backend code separate from Angular so it can grow into a real API.", "mkdir backend\nmkdir backend\\routes backend\\middleware backend\\store backend\\validators backend\\data"),
        ("Add scripts", "Scripts make startup repeatable for beginners.", "\"start\": \"ng serve\",\n\"start:api\": \"node backend/server.js\",\n\"dev:api\": \"node --watch backend/server.js\""),
    ]
    for title, why, cmd in steps:
        story.append(KeepTogether(subsection(title) + [p(f"<b>Why:</b> {why}"), code(cmd)]))

    story.extend(section("4. Configure Bootstrap And Custom Styles"))
    story.append(p("Bootstrap gives you ready-made form controls, alerts, buttons, cards, badges, tables, grids, and responsive spacing. Your custom app style belongs in global theme files for tokens and component CSS files for screen-specific polish."))
    story.append(code("/* angular.json styles */\nnode_modules/bootstrap/dist/css/bootstrap.min.css\nsrc/theme.css\nsrc/styles.css"))
    story.extend(
        bullet(
            [
                "Use Bootstrap classes for layout and common components.",
                "Use src/theme.css for app colors, CSS variables, and reusable visual decisions.",
                "Use each component CSS file only for styles that belong to that component.",
                "Do not put all screen-specific CSS into one global file.",
            ]
        )
    )

    story.extend(section("5. Build Authentication First"))
    story.append(p("Authentication is the first backend connection because every protected request needs a token. In this app, the backend returns a simple dummy token. Angular stores it in localStorage and an interceptor adds it to API requests."))
    story.append(
        simple_table(
            ["File", "Role"],
            [
                ["backend/routes/auth.routes.js", "POST /api/auth/login checks email and password against dummy users."],
                ["backend/middleware/auth.middleware.js", "Reads Bearer token, finds the user, attaches req.user."],
                ["src/app/core/auth/auth.service.ts", "Calls login endpoint and stores session."],
                ["src/app/core/auth/auth-token.interceptor.ts", "Adds Authorization header to backend calls."],
                ["src/app/core/auth/auth.guard.ts", "Blocks routes when not logged in."],
                ["src/app/core/auth/role.guard.ts", "Blocks routes when the logged-in user lacks the required role."],
            ],
            [2.45 * inch, 4.6 * inch],
        )
    )
    story.append(code("Frontend login flow\nLoginPage.submit()\n-> AuthService.login()\n-> ApiService.post('/auth/login')\n-> Express auth route\n-> session saved\n-> interceptor adds token to future requests"))

    story.extend(section("6. Build The Express Backend"))
    story.append(p("The backend is intentionally modular. server.js should stay small. Each feature gets a route file. Middleware handles auth and role checks before the route handler does business work."))
    story.append(code("backend/server.js\napp.use('/api/auth', authRoutes)\napp.use('/api/expense-requests', requestRoutes)\napp.use('/api/workflow', workflowRoutes)\napp.use('/api/reports', reportRoutes)\napp.use('/api', miscRoutes)"))
    story.extend(
        bullet(
            [
                "Use express.json() so JSON request bodies are available as req.body.",
                "Use cors() so Angular can call the backend during local development.",
                "Use one fallback 404 handler for unknown API routes.",
                "Use one error handler for unexpected backend errors.",
            ]
        )
    )

    story.extend(section("7. Request Backend Routes"))
    story.append(p("Requests are the heart of the system. Angular calls these routes through RequestApiService. The backend checks token, role, status, and validation before changing data."))
    story.append(
        simple_table(
            ["Endpoint", "What it does"],
            [
                ["GET /api/expense-requests", "List requests visible to the current role."],
                ["POST /api/expense-requests/drafts", "Create a draft request."],
                ["POST /api/expense-requests/submit", "Submit a new request or submit/resubmit an existing draft/returned request."],
                ["PATCH /api/expense-requests/:id/draft", "Edit a draft or returned request."],
                ["DELETE /api/expense-requests/:id/draft", "Delete a draft request."],
                ["GET /api/expense-requests/:id", "Read request detail only if visible to current role."],
                ["POST /api/expense-requests/:id/cancel", "Cancel a draft, returned, or pending endorsement request by owner/admin."],
            ],
            [2.75 * inch, 4.3 * inch],
        )
    )

    story.extend(section("8. RequestStoreService And RequestApiService"))
    story.append(p("The frontend was simplified into two responsibilities. RequestApiService only knows backend endpoints. RequestStoreService owns UI state, visible requests, local fallback, loading/error/success messages, and workflow methods."))
    story.append(
        simple_table(
            ["Service", "Responsibility"],
            [
                ["RequestApiService", "Thin backend API wrapper: list, create, update, submit, workflow actions, attachments."],
                ["RequestStoreService", "State layer: signals, cached request list, loading/error/success messages, action guards."],
                ["ApiService", "Generic HTTP wrapper with base URL and query/download helpers."],
            ],
            [2.1 * inch, 4.95 * inch],
        )
    )
    story.append(code("Component\n-> store.submit(id)\n-> RequestStoreService.runRequestAction()\n-> RequestApiService.submit(id)\n-> ApiService.post('/expense-requests/submit')"))

    story.extend(section("9. Workflow Status Rules"))
    story.append(p("The frontend hides invalid buttons, but the backend must be the final authority. A user can fake an HTTP call, so Express must reject wrong-role and wrong-status actions."))
    story.append(
        simple_table(
            ["Action", "Allowed backend rule"],
            [
                ["Submit", "Draft or Returned -> PendingEndorsement by original Requester/Admin."],
                ["Endorse", "PendingEndorsement -> PendingApproval by Endorser/Admin."],
                ["Return", "PendingEndorsement by Endorser or PendingApproval by Approver. Remarks required."],
                ["Reject", "PendingEndorsement by Endorser or PendingApproval by Approver. Remarks required."],
                ["Approve", "PendingApproval -> Approved by Approver/Admin."],
                ["Close", "Approved -> Closed by Finance/Admin."],
                ["Terminal statuses", "Rejected, Cancelled, and Closed cannot move forward."],
            ],
            [2.15 * inch, 4.95 * inch],
        )
    )

    story.extend(section("10. Backend Validation"))
    story.append(p("Frontend validation helps users, but backend validation protects the system. The backend now validates request fields before saving or updating data."))
    story.extend(
        bullet(
            [
                "Title, justification, department, cost center, request type, and line items are required.",
                "Department, cost center, and category must exist in the dummy reference lists.",
                "Request type must be Expense, Purchase, or Reimbursement.",
                "Line item quantity and unit amount must be positive.",
                "Seller links must be valid http or https URLs.",
                "The backend returns 400 with an errors array. The frontend shows those messages on the form.",
            ]
        )
    )
    story.append(code("backend/validators/request.validator.js\nvalidateRequestCommand(req.body, store.state)\nif (!validation.valid) return res.status(400).json({ message, errors })"))

    story.extend(section("11. Attachments Upload, View, And Download"))
    story.append(p("The placeholder was replaced with a simple real file flow. Angular reads the selected file as Base64, sends it to Express, and Express writes the file under backend/uploads. Metadata stays in dummy-store.js for now."))
    story.append(
        simple_table(
            ["Route", "Purpose"],
            [
                ["GET /expense-requests/:requestId/line-items/:lineItemId/attachments", "List files for a line item."],
                ["POST /expense-requests/:requestId/line-items/:lineItemId/attachments", "Upload one file for a draft/returned request line item."],
                ["GET /files/:fileId/download", "Stream file bytes to the browser for View or Download."],
            ],
            [3.4 * inch, 3.7 * inch],
        )
    )
    story.extend(
        bullet(
            [
                "Requester/Admin can upload while request is Draft or Returned.",
                "Visible roles can view/download files for requests they are allowed to see.",
                "Current max file size is 5 MB.",
                "When SQL Server is added, store metadata in SQL Server and keep file bytes in disk, cloud storage, or FILESTREAM depending on company policy.",
            ]
        )
    )

    story.extend(section("12. Dashboard Counts From Backend"))
    story.append(p("The dashboard is no longer a mock placeholder. It calls GET /api/reports/request-dashboard and displays counts based on the logged-in user's visible requests."))
    story.append(
        simple_table(
            ["Count", "Meaning"],
            [
                ["Total Visible", "How many requests this role can currently see."],
                ["Pending Action", "PendingEndorsement and PendingApproval visible to this role."],
                ["Urgent", "Visible requests marked urgent."],
                ["Total Amount", "Sum of visible request amounts."],
                ["Status Counts", "Breakdown by Draft, Returned, PendingEndorsement, PendingApproval, Approved, Rejected, Closed, Cancelled."],
                ["Recent Visible Requests", "Latest visible requests sorted by updatedAt."],
            ],
            [2.1 * inch, 4.95 * inch],
        )
    )

    story.extend(section("13. Notifications"))
    story.append(p("Notifications are generated by backend workflow events and shown on the Notifications page. They are stored in memory for now."))
    story.append(
        simple_table(
            ["Event", "Who gets notified"],
            [
                ["Request Submitted or Resubmitted", "Endorsers."],
                ["Request Returned", "Original Requester."],
                ["Request Approved", "Original Requester and Finance users."],
            ],
            [2.4 * inch, 4.65 * inch],
        )
    )
    story.append(code("GET /api/notifications\nGET /api/notifications/unread-count\nPATCH /api/notifications/:id/read\nPATCH /api/notifications/read-all"))

    story.extend(section("14. Loading, Error, And Success Messages"))
    story.append(p("Backend calls are asynchronous. The UI should tell users what is happening, prevent duplicate clicks, and show errors clearly. RequestStoreService owns this behavior for request actions."))
    story.extend(
        bullet(
            [
                "loadingMessage appears while backend calls run.",
                "successMessage confirms the exact workflow result.",
                "errorMessage shows backend validation and permission errors.",
                "pendingOperationKeys prevents duplicate backend actions.",
                "Angular untracked() prevents refresh effects from re-triggering loading forever.",
            ]
        )
    )

    story.extend(section("15. Manual Test Checklist"))
    tests = [
        ["Login", "Use requester@test.com, endorser@test.com, approver@test.com, finance@test.com, admin@test.com. Password is password123."],
        ["Create draft", "Requester creates request and saves as draft. Draft appears in request list."],
        ["Edit draft", "Requester opens draft detail, edits, adds/removes line items, uploads attachment."],
        ["Submit", "Requester submits. Endorser receives notification and sees request in queue."],
        ["Return", "Endorser returns with remarks. Requester sees returned request, remarks, and notification."],
        ["Resubmit", "Requester edits returned request and submits again."],
        ["Endorse", "Endorser endorses. Approver sees request."],
        ["Approve", "Approver approves. Requester and Finance receive notification."],
        ["Close", "Finance closes approved request."],
        ["Dashboard", "Each role sees backend counts for visible requests."],
    ]
    story.append(simple_table(["Area", "What to test"], tests, [1.55 * inch, 5.5 * inch]))

    story.extend(section("16. Troubleshooting"))
    story.append(
        simple_table(
            ["Problem", "Likely fix"],
            [
                ["Route not found", "Restart backend. Express loads route files only when server starts."],
                ["Frontend shows old UI", "Refresh Angular browser tab or restart npm start."],
                ["401 Authentication is required", "Login again. Token may be missing from localStorage."],
                ["403 Permission error", "You are using the wrong role for that action."],
                ["409 Status error", "The request is not in the correct workflow status for that action."],
                ["Upload button missing", "Only requester/admin can upload while request is Draft or Returned."],
                ["Uploaded file lost after restart", "Metadata is still in memory. SQL Server persistence is Phase 2."],
            ],
            [2.05 * inch, 5.05 * inch],
        )
    )

    story.extend(section("17. SQL Server Migration Plan"))
    story.append(p("Do not connect SQL Server by rewriting the whole app. Replace the backend store gradually with repositories. Keep route names and frontend services stable."))
    story.append(code("backend\n  db\n    sql-server.js\n  repositories\n    users.repository.js\n    requests.repository.js\n    workflow.repository.js\n    attachments.repository.js\n    notifications.repository.js\n  routes\n    requests.routes.js"))
    story.extend(
        bullet(
            [
                "Create SQL tables for Users, Requests, LineItems, Attachments, AuditLogs, Notifications.",
                "Move dummy-store functions into repository files one module at a time.",
                "Keep validation in backend/validators before repository calls.",
                "Keep middleware auth and role checks before route handlers.",
                "Add transactions for workflow actions so status, audit log, and notification save together.",
                "Use parameterized SQL queries. Never build SQL with string concatenation from user input.",
            ]
        )
    )

    story.extend(section("18. Suggested Learning Resources"))
    story.append(p("Use these after reading the guide. Start with Angular and Express, then Bootstrap styling, then SQL Server connectivity."))
    story.append(
        simple_table(
            ["Topic", "Resource"],
            [
                ["Angular basics", "https://angular.dev/tutorials"],
                ["Express install and routing", "https://expressjs.com/en/starter/installing/"],
                ["Bootstrap components and customization", "https://getbootstrap.com/docs/5.3/getting-started/introduction/"],
                ["Node.js driver for SQL Server", "https://learn.microsoft.com/en-us/sql/connect/node-js/node-js-driver-for-sql-server?view=sql-server-ver17"],
            ],
            [2.2 * inch, 4.85 * inch],
        )
    )

    story.extend(section("19. Beginner Build Order Summary"))
    story.extend(
        bullet(
            [
                "1. Generate Angular app.",
                "2. Install Bootstrap, Express, and CORS.",
                "3. Add frontend core folders: api, auth, models, mock.",
                "4. Add shared layout and navigation.",
                "5. Build login and route guards.",
                "6. Add backend server, auth route, middleware, and dummy data.",
                "7. Build request list, form, detail, and workflow actions.",
                "8. Connect requests to backend through RequestApiService.",
                "9. Add loading, error, success messages, and duplicate-click protection.",
                "10. Add audit trail, remarks, editable drafts, returned resubmission.",
                "11. Add attachments, backend validation, strict workflow rules.",
                "12. Add dashboard counts and notifications.",
                "13. Replace dummy-store with SQL Server repositories when ready.",
            ]
        )
    )

    return story


STYLES = make_styles()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.65 * inch,
        title="IT Expense System Beginner From-Scratch Build Tutorial",
        author="OpenAI Codex",
    )
    doc.build(build_story(), onFirstPage=page_header_footer, onLaterPages=page_header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
