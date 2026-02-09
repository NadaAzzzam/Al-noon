import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import type { ApiSuccess, ApiError } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private readonly http = inject(HttpClient);

  subscribe(email: string): Observable<{ message?: string }> {
    return this.http.post<ApiSuccess<unknown> | ApiError>('newsletter/subscribe', { email }).pipe(
      (o) =>
        new Observable<{ message?: string }>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success) sub.next({ message: (r as ApiSuccess<unknown>).message });
              else {
                const err = r as ApiError;
                if (err.code === 'CONFLICT' || (err as { status?: number }).status === 409)
                  sub.error({ alreadySubscribed: true, message: err.message });
                else sub.error(err);
              }
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        }),
      catchError((e) => {
        if (e.status === 409 || e?.error?.code === 'CONFLICT' || e?.alreadySubscribed)
          return throwError(() => ({ alreadySubscribed: true, message: e?.message ?? 'Already subscribed' }));
        return throwError(() => e);
      })
    );
  }
}
