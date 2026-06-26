import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  get<T>(endpoint: string, query?: QueryParams) {
    return this.http.get<T>(this.url(endpoint), { params: this.params(query) });
  }

  post<T>(endpoint: string, body: unknown, query?: QueryParams) {
    return this.http.post<T>(this.url(endpoint), body, { params: this.params(query) });
  }

  put<T>(endpoint: string, body: unknown, query?: QueryParams) {
    return this.http.put<T>(this.url(endpoint), body, { params: this.params(query) });
  }

  patch<T>(endpoint: string, body: unknown, query?: QueryParams) {
    return this.http.patch<T>(this.url(endpoint), body, { params: this.params(query) });
  }

  delete<T>(endpoint: string, query?: QueryParams) {
    return this.http.delete<T>(this.url(endpoint), { params: this.params(query) });
  }

  download(endpoint: string, query?: QueryParams) {
    return this.http.get(this.url(endpoint), {
      observe: 'response',
      params: this.params(query),
      responseType: 'blob'
    });
  }

  private url(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
  }

  private params(query?: QueryParams): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== null && value !== undefined) {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
