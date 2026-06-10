import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequestType } from '@core/models/domain.model';
import { RequestStoreService } from '../request-store.service';

@Component({
  selector: 'app-request-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './request-form-page.html',
  styleUrl: './request-form-page.css'
})
export class RequestFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly store = inject(RequestStoreService);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    justification: ['', Validators.required],
    department: ['IT Operations', Validators.required],
    costCenter: ['CC-IT-001', Validators.required],
    project: [''],
    requestType: ['Expense', Validators.required],
    urgent: [false],
    category: ['Hardware', Validators.required],
    description: ['', Validators.required],
    vendor: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitAmount: [0, [Validators.required, Validators.min(1)]],
    sellerLink: ['']
  });

  get total(): number {
    return this.form.controls.quantity.value * this.form.controls.unitAmount.value;
  }

  saveDraft(): void {
    this.create(false);
  }

  submit(): void {
    this.create(true);
  }

  private create(submit: boolean): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.create(
      {
        title: value.title,
        justification: value.justification,
        department: value.department,
        costCenter: value.costCenter,
        project: value.project || undefined,
        requestType: value.requestType as RequestType,
        urgent: value.urgent,
        lineItem: {
          category: value.category,
          description: value.description,
          vendor: value.vendor,
          quantity: value.quantity,
          unitAmount: value.unitAmount,
          sellerLink: value.sellerLink || undefined
        }
      },
      submit
    );

    void this.router.navigate(['/requests']);
  }
}
