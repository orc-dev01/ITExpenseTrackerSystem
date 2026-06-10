import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { ExpenseRequestStatus } from '@core/models/domain.model';
import { LocalExpenseRequest, RequestStoreService } from '@features/requests/request-store.service';

interface ReportColumn {
  key: string;
  label: string;
  value: (request: LocalExpenseRequest) => string;
}

interface RequestGroup {
  requesterName: string;
  requests: LocalExpenseRequest[];
  subtotal: number;
}

@Component({
  selector: 'app-approval-report-page',
  imports: [FormsModule],
  templateUrl: './approval-report-page.html',
  styleUrl: './approval-report-page.css'
})
export class ApprovalReportPage {
  private readonly store = inject(RequestStoreService);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly departmentFilter = signal('All');
  readonly statusFilter = signal<ExpenseRequestStatus | 'All'>('All');
  readonly groupByRequester = signal(false);
  readonly generatedAt = new Date().toLocaleString();
  readonly selectedColumnKeys = signal<string[]>(['requestNumber', 'title', 'requesterName', 'department', 'status', 'urgent', 'totalAmount']);

  readonly statuses: Array<ExpenseRequestStatus | 'All'> = ['All', 'PendingEndorsement', 'PendingApproval', 'Approved', 'Closed', 'Returned', 'Rejected', 'Cancelled', 'Draft'];

  readonly columns: ReportColumn[] = [
    { key: 'requestNumber', label: 'Request No', value: (request) => request.requestNumber },
    { key: 'title', label: 'Title', value: (request) => request.title },
    { key: 'requesterName', label: 'Requester', value: (request) => request.requesterName },
    { key: 'department', label: 'Department', value: (request) => request.department },
    { key: 'costCenter', label: 'Cost Center', value: (request) => request.costCenter },
    { key: 'requestType', label: 'Type', value: (request) => request.requestType },
    { key: 'status', label: 'Status', value: (request) => request.status },
    { key: 'urgent', label: 'Urgent', value: (request) => (request.urgent ? 'Yes' : 'No') },
    { key: 'totalAmount', label: 'Amount', value: (request) => this.formatCurrency(request.totalAmount) },
    { key: 'createdAt', label: 'Created', value: (request) => this.formatDate(request.createdAt) },
    { key: 'updatedAt', label: 'Updated', value: (request) => this.formatDate(request.updatedAt) },
    { key: 'remarks', label: 'Remarks', value: (request) => request.remarks ?? '' }
  ];

  readonly selectedColumns = computed(() => this.columns.filter((column) => this.selectedColumnKeys().includes(column.key)));

  readonly departments = computed(() => {
    const values = new Set(this.store.requests().map((request) => request.department));
    return ['All', ...Array.from(values).sort()];
  });

  readonly filteredRequests = computed(() => {
    return this.store.requests().filter((request) => {
      const departmentMatch = this.departmentFilter() === 'All' || request.department === this.departmentFilter();
      const statusMatch = this.statusFilter() === 'All' || request.status === this.statusFilter();
      return departmentMatch && statusMatch;
    });
  });

  readonly groupedRequests = computed<RequestGroup[]>(() => {
    const groups = new Map<string, LocalExpenseRequest[]>();
    for (const request of this.filteredRequests()) {
      const existing = groups.get(request.requesterName) ?? [];
      existing.push(request);
      groups.set(request.requesterName, existing);
    }

    return Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([requesterName, requests]) => ({
        requesterName,
        requests,
        subtotal: requests.reduce((sum, request) => sum + request.totalAmount, 0)
      }));
  });

  readonly totalAmount = computed(() => this.filteredRequests().reduce((sum, request) => sum + request.totalAmount, 0));
  readonly approvedAmount = computed(() => this.filteredRequests().filter((request) => request.status === 'Approved' || request.status === 'Closed').reduce((sum, request) => sum + request.totalAmount, 0));
  readonly pendingAmount = computed(() => this.filteredRequests().filter((request) => request.status === 'PendingEndorsement' || request.status === 'PendingApproval').reduce((sum, request) => sum + request.totalAmount, 0));

  setDepartment(value: string): void {
    this.departmentFilter.set(value);
  }

  setStatus(value: string): void {
    this.statusFilter.set(value as ExpenseRequestStatus | 'All');
  }

  setGroupByRequester(value: boolean): void {
    this.groupByRequester.set(value);
  }

  isColumnSelected(key: string): boolean {
    return this.selectedColumnKeys().includes(key);
  }

  toggleColumn(key: string, checked: boolean): void {
    const current = this.selectedColumnKeys();
    if (checked) {
      this.selectedColumnKeys.set([...new Set([...current, key])]);
      return;
    }

    if (current.length === 1) {
      return;
    }
    this.selectedColumnKeys.set(current.filter((columnKey) => columnKey !== key));
  }

  printPdf(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildPrintDocument());
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  }

  exportCsv(): void {
    const header = this.selectedColumns().map((column) => column.label);
    const rows = this.groupByRequester()
      ? this.groupedRequests().flatMap((group) => [
          [`Requester: ${group.requesterName}`, ...Array(Math.max(header.length - 2, 0)).fill(''), `Subtotal: ${this.formatCurrency(group.subtotal)}`],
          ...group.requests.map((request) => this.selectedColumns().map((column) => column.value(request)))
        ])
      : this.filteredRequests().map((request) => this.selectedColumns().map((column) => column.value(request)));

    const csv = [
      header,
      ...rows,
      ['Grand Total', ...Array(Math.max(header.length - 2, 0)).fill(''), this.formatCurrency(this.totalAmount())]
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'approval-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  }

  formatDate(value: string | undefined): string {
    return value ? new Date(value).toLocaleString() : '';
  }

  trackRequest(_index: number, request: LocalExpenseRequest): string {
    return request.id;
  }

  private buildPrintDocument(): string {
    const headerCells = this.selectedColumns().map((column) => `<th>${this.escapeHtml(column.label)}</th>`).join('');
    const rows = this.groupByRequester() ? this.buildGroupedPrintRows() : this.buildFlatPrintRows();
    const emptyRow = `<tr><td colspan="${this.selectedColumns().length}">No records match the selected filters.</td></tr>`;

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>IT Expense Approval Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #17202a; margin: 24px; }
    header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #17202a; padding-bottom: 12px; margin-bottom: 16px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    p, span { color: #667085; }
    .meta { display: grid; gap: 4px; text-align: right; font-size: 12px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .summary article { border: 1px solid #d9dee7; border-radius: 6px; padding: 10px; }
    .summary strong { display: block; margin-top: 6px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #d9dee7; text-align: left; }
    th { background: #eef2f6; text-transform: uppercase; font-size: 11px; }
    .group-row td { background: #f6f7f9; font-weight: 700; }
    .subtotal-row td, .grand-total-row td { font-weight: 700; border-top: 2px solid #17202a; }
    @page { margin: 16mm; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>IT Expense Approval Report</h1>
      <p>Prepared for ${this.escapeHtml(this.user()?.fullName ?? 'Approver')}</p>
    </div>
    <div class="meta">
      <span>Department: ${this.escapeHtml(this.departmentFilter())}</span>
      <span>Status: ${this.escapeHtml(this.statusFilter())}</span>
      <span>Grouped by requester: ${this.groupByRequester() ? 'Yes' : 'No'}</span>
      <span>Generated: ${this.escapeHtml(this.generatedAt)}</span>
    </div>
  </header>

  <section class="summary">
    <article><span>Total Requests</span><strong>${this.filteredRequests().length}</strong></article>
    <article><span>Total Amount</span><strong>${this.escapeHtml(this.formatCurrency(this.totalAmount()))}</strong></article>
    <article><span>Approved/Closed</span><strong>${this.escapeHtml(this.formatCurrency(this.approvedAmount()))}</strong></article>
    <article><span>Pending</span><strong>${this.escapeHtml(this.formatCurrency(this.pendingAmount()))}</strong></article>
  </section>

  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${rows || emptyRow}${this.buildGrandTotalRow()}</tbody>
  </table>
</body>
</html>`;
  }

  private buildFlatPrintRows(): string {
    return this.filteredRequests()
      .map((request) => `<tr>${this.selectedColumns().map((column) => `<td>${this.escapeHtml(column.value(request))}</td>`).join('')}</tr>`)
      .join('');
  }

  private buildGroupedPrintRows(): string {
    return this.groupedRequests()
      .map((group) => `
        <tr class="group-row"><td colspan="${this.selectedColumns().length}">Requester: ${this.escapeHtml(group.requesterName)}</td></tr>
        ${group.requests.map((request) => `<tr>${this.selectedColumns().map((column) => `<td>${this.escapeHtml(column.value(request))}</td>`).join('')}</tr>`).join('')}
        <tr class="subtotal-row"><td colspan="${Math.max(this.selectedColumns().length - 1, 1)}">Subtotal for ${this.escapeHtml(group.requesterName)}</td><td>${this.escapeHtml(this.formatCurrency(group.subtotal))}</td></tr>`)
      .join('');
  }

  private buildGrandTotalRow(): string {
    return `<tr class="grand-total-row"><td colspan="${Math.max(this.selectedColumns().length - 1, 1)}">Grand Total</td><td>${this.escapeHtml(this.formatCurrency(this.totalAmount()))}</td></tr>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);
  }
}
