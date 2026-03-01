import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ContactBody, SchemaMessageDataResponse } from '../types/api.types';

/** POST /api/store/contact – Submit Contact Us form (public). Body: { name, email, phone?, comment }. */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  /** POST /api/store/contact – application/json body per API spec. */
  send(body: ContactBody): Observable<{ message?: string }> {
    return this.http
      .post<SchemaMessageDataResponse>('store/contact', body, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        (o) =>
          new Observable<{ message?: string }>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success) sub.next({ message: r.message ?? undefined });
                else sub.error(r);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }
}
