import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestType } from '@core/models/domain.model';
import { LocalExpenseLineItem, RequestStoreService } from '../request-store.service';

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
  private readonly store = inject(RequestStoreService);
  private readonly draftId = this.route.snapshot.paramMap.get('id');
  readonly isEditMode = Boolean(this.draftId);

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
    this.loadDraftForEdit();
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const command = this.buildCommand();
    if (this.isEditMode && this.draftId) {
      const updated = this.store.updateDraft(this.draftId, command);
      if (updated && submit) {
        this.store.submit(updated.id);
      }
    } else {
      this.store.create(command, submit);
    }

    void this.router.navigate(['/requests']);
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

  private loadDraftForEdit(): void {
    if (!this.draftId) {
      return;
    }

    const draft = this.store.requests().find((request) => request.id === this.draftId && request.status === 'Draft');
    if (!draft) {
      void this.router.navigate(['/requests']);
      return;
    }

    this.form.patchValue({
      title: draft.title,
      justification: draft.justification,
      department: draft.department,
      costCenter: draft.costCenter,
      project: draft.project ?? '',
      requestType: draft.requestType,
      urgent: draft.urgent
    });

    this.lineItems.clear();
    for (const item of draft.lineItems) {
      this.lineItems.push(this.createLineItemGroup(item));
    }
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
