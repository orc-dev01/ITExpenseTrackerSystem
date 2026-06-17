import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocalExpenseRequest } from '../request-store.service';

export type RemarksAction = 'return' | 'reject';

@Component({
  selector: 'app-request-remarks-modal',
  imports: [FormsModule],
  templateUrl: './request-remarks-modal.html',
  styleUrl: './request-remarks-modal.css'
})
export class RequestRemarksModal implements OnChanges {
  @Input() action: RemarksAction | null = null;
  @Input() request: LocalExpenseRequest | null = null;
  @Output() confirmed = new EventEmitter<string>();
  @Output() dismissed = new EventEmitter<void>();

  remarks = '';
  submitted = false;

  get isOpen(): boolean {
    return Boolean(this.action && this.request);
  }

  get title(): string {
    return this.action === 'reject' ? 'Reject Request' : 'Return Request';
  }

  get actionLabel(): string {
    return this.action === 'reject' ? 'Reject' : 'Return';
  }

  get helperText(): string {
    return this.action === 'reject'
      ? 'Explain why this request is being rejected. The requester will see this in the workflow history.'
      : 'Explain what the requester needs to revise before resubmitting.';
  }

  get hasError(): boolean {
    return this.submitted && this.remarks.trim().length === 0;
  }

  ngOnChanges(): void {
    this.remarks = '';
    this.submitted = false;
  }

  confirm(): void {
    this.submitted = true;
    const value = this.remarks.trim();
    if (!value) {
      return;
    }

    this.confirmed.emit(value);
  }

  close(): void {
    this.dismissed.emit();
  }
}
