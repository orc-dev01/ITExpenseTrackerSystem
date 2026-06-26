import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExpenseRequestStatus, RequestType } from '@core/models/domain.model';
import { LocalExpenseLineItem, LocalExpenseRequest, RequestStoreService } from '../request-store.service';

@Component({
  selector: 'app-request-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './request-form-page.html',
  styleUrl: './request-form-page.css'
})
export class RequestFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(RequestStoreService);
  private readonly editableRequestId = this.route.snapshot.paramMap.get('id');
  readonly editableRequest = this.findEditableRequest();
  readonly isEditMode = Boolean(this.editableRequestId);
  readonly validationMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    justification: ['', Validators.required],
    department: ['IT Operations', Validators.required],
    costCenter: ['CC-IT-001', Validators.required],
    project: [''],
    requestType: ['Expense', Validators.required],
    urgent: [false],
    lineItems: this.fb.array([this.createLineItemGroup()])
  });

  constructor() {
    this.loadEditableRequest();
  }

  get lineItems() {
    return this.form.controls.lineItems;
  }

  get total(): number {
    return this.lineItems.controls.reduce((sum, itemGroup) => {
      const item = itemGroup.getRawValue();
      return sum + item.quantity * item.unitAmount;
    }, 0);
  }

  get pageTitle(): string {
    if (!this.isEditMode) {
      return 'New Expense Request';
    }
    return this.editableRequest?.status === 'Returned' ? 'Edit Returned Request' : 'Edit Draft Request';
  }

  get pageSubtitle(): string {
    if (!this.isEditMode) {
      return 'Creates a localStorage request that can move through endorsement, approval, and Finance processing.';
    }
    return this.editableRequest?.status === 'Returned'
      ? 'Review the return remarks, update the request, and resubmit it to endorsement.'
      : 'Update your saved draft before submitting it to workflow.';
  }

  get returnRemarks(): string | null {
    return this.editableRequest?.status === 'Returned' ? this.editableRequest.remarks ?? null : null;
  }

  addLineItem(): void {
    this.lineItems.push(this.createLineItemGroup());
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length === 1) {
      return;
    }
    this.lineItems.removeAt(index);
  }

  saveDraft(): void {
    this.save(false);
  }

  submit(): void {
    this.save(true);
  }

  private save(submit: boolean): void {
    this.validationMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.validationMessage.set('Please complete all required request fields before continuing.');
      return;
    }

    const command = this.buildCommand();
    if (this.isEditMode && this.editableRequestId) {
      this.store.saveEditableRequest(this.editableRequestId, command, submit, () => {
        void this.router.navigate(['/requests']);
      });
    } else {
      this.store.create(command, submit, () => {
        void this.router.navigate(['/requests']);
      });
    }
  }

  private buildCommand() {
    const value = this.form.getRawValue();
    return {
      title: value.title,
      justification: value.justification,
      department: value.department,
      costCenter: value.costCenter,
      project: value.project || undefined,
      requestType: value.requestType as RequestType,
      urgent: value.urgent,
      lineItems: value.lineItems.map((item) => ({
        category: item.category,
        description: item.description,
        vendor: item.vendor,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
        sellerLink: item.sellerLink || undefined
      }))
    };
  }

  private loadEditableRequest(): void {
    if (!this.editableRequestId) {
      return;
    }

    const request = this.editableRequest;
    if (!request) {
      void this.router.navigate(['/requests']);
      return;
    }

    this.form.patchValue({
      title: request.title,
      justification: request.justification,
      department: request.department,
      costCenter: request.costCenter,
      project: request.project ?? '',
      requestType: request.requestType,
      urgent: request.urgent
    });

    this.lineItems.clear();
    for (const item of request.lineItems) {
      this.lineItems.push(this.createLineItemGroup(item));
    }
  }

  private findEditableRequest(): LocalExpenseRequest | null {
    if (!this.editableRequestId) {
      return null;
    }

    return this.store.requests().find((request) => request.id === this.editableRequestId && this.isEditableStatus(request.status)) ?? null;
  }

  private isEditableStatus(status: ExpenseRequestStatus): boolean {
    return status === 'Draft' || status === 'Returned';
  }

  private createLineItemGroup(item?: LocalExpenseLineItem) {
    return this.fb.nonNullable.group({
      category: [item?.category ?? 'Hardware', Validators.required],
      description: [item?.description ?? '', Validators.required],
      vendor: [item?.vendor ?? '', Validators.required],
      quantity: [item?.quantity ?? 1, [Validators.required, Validators.min(1)]],
      unitAmount: [item?.unitAmount ?? 0, [Validators.required, Validators.min(1)]],
      sellerLink: [item?.sellerLink ?? '']
    });
  }
}
