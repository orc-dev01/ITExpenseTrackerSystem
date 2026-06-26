import { Injectable, inject } from '@angular/core';
import { ApiEndpoints } from '@core/api/api-endpoints';
import { ApiService } from '@core/api/api.service';
import { from, of, switchMap } from 'rxjs';
import type { CreateRequestCommand, LocalAttachment, LocalAuditLog, LocalExpenseRequest } from './request-store.service';

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<LocalExpenseRequest[]>(ApiEndpoints.requests.list);
  }

  auditTrail() {
    return this.api.get<LocalAuditLog[]>(ApiEndpoints.workflow.auditTrailAll);
  }

  auditTrailForRequest(id: string) {
    return this.api.get<LocalAuditLog[]>(ApiEndpoints.workflow.auditTrail(id));
  }

  create(command: CreateRequestCommand, submit: boolean) {
    return this.api.post<LocalExpenseRequest>(submit ? ApiEndpoints.requests.submit : ApiEndpoints.requests.createDraft, command);
  }

  updateEditable(id: string, command: CreateRequestCommand) {
    return this.api.patch<LocalExpenseRequest>(ApiEndpoints.requests.updateDraft(id), command);
  }

  saveEditable(id: string, command: CreateRequestCommand, submit: boolean) {
    return this.updateEditable(id, command).pipe(
      switchMap((request) => (submit ? this.submit(request.id) : of(request)))
    );
  }

  submit(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.requests.submit, { id });
  }

  deleteDraft(id: string) {
    return this.api.delete<void>(ApiEndpoints.requests.deleteDraft(id));
  }

  cancel(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.requests.cancel(id), {});
  }

  endorse(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.endorse(id), {});
  }

  returnRequest(id: string, remarks: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.return(id), { remarks });
  }

  reject(id: string, remarks: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.reject(id), { remarks });
  }

  approve(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.approve(id), {});
  }

  close(id: string) {
    return this.api.post<LocalExpenseRequest>(ApiEndpoints.workflow.close(id), { remarks: 'Closed after Finance processing.' });
  }

  listAttachments(requestId: string, lineItemId: string) {
    return this.api.get<LocalAttachment[]>(ApiEndpoints.requests.attachments(requestId, lineItemId));
  }

  uploadAttachment(requestId: string, lineItemId: string, file: File) {
    return from(this.readFileAsBase64(file)).pipe(
      switchMap((contentBase64) =>
        this.api.post<LocalAttachment>(ApiEndpoints.requests.attachments(requestId, lineItemId), {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          contentBase64
        })
      )
    );
  }

  downloadAttachment(fileId: string) {
    return this.api.download(ApiEndpoints.files.download(fileId));
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? '');
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
