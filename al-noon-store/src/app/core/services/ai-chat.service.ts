import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, ApiError, AiSettings, AiChatRequest, AiChatResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<AiSettings> {
    return this.http.get<ApiSuccess<AiSettings>>('ai/settings').pipe(
      (o) =>
        new Observable<AiSettings>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.next({ enabled: false, greeting: { en: '', ar: '' }, suggestedQuestions: [] });
            },
            error: () => sub.next({ enabled: false, greeting: { en: '', ar: '' }, suggestedQuestions: [] }),
            complete: () => sub.complete(),
          });
        })
    );
  }

  chat(body: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<ApiSuccess<AiChatResponse> | ApiError>('ai/chat', body).pipe(
      (o) =>
        new Observable<AiChatResponse>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.error((r as ApiError).message ?? (r as ApiError).code);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
