import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { ApiError, SchemaMessageDataResponse, SchemaNewsletterConflictResponse } from '../types/api.types';

/** API may return { success: true, message? } or plain { message? } on success. */
function isSuccessResponse(r: unknown): r is { message?: string } {
  if (r && typeof r === 'object') {
    const o = r as Record<string, unknown>;
    if (o['success'] === false) return false;
    return o['success'] === true || !('success' in o);
  }
  return false;
}

function isConflictError(r: unknown): boolean {
  if (r && typeof r === 'object') {
    const o = r as Record<string, unknown>;
    return o['code'] === 'CONFLICT' || o['status'] === 409 || o['alreadySubscribed'] === true;
  }
  return false;
}

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly http = inject(HttpClient);

  /** POST to newsletter/subscribe. Backend must accept { email: string } and return 2xx on success or 409 for already subscribed. */
  subscribe(email: string): Observable<{ message?: string }> {
    return this.http
      .post<SchemaMessageDataResponse | SchemaNewsletterConflictResponse | ApiError>('newsletter/subscribe', { email })
      .pipe(
        (o) =>
          new Observable<{ message?: string }>((sub) => {
            o.subscribe({
              next: (r) => {
                if (isSuccessResponse(r)) {
                  sub.next({ message: r.message });
                  return;
                }
                const err = r as ApiError & { status?: number };
                if (isConflictError(err))
                  sub.error({ alreadySubscribed: true, message: err.message ?? 'Already subscribed' });
                else sub.error(err);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          }),
        catchError((e: { status?: number; error?: unknown; message?: string }) => {
          const body = e?.error;
          if (e?.status === 409 || isConflictError(body))
            return throwError(() => ({
              alreadySubscribed: true,
              message: (body && typeof body === 'object' && (body as { message?: string }).message) ?? e?.message ?? 'Already subscribed',
            }));
          return throwError(() => e);
        })
      );
  }
}
