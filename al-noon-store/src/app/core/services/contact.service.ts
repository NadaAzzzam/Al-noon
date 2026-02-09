import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, ContactBody } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(body: ContactBody): Observable<{ message?: string }> {
    return this.http
      .post<ApiSuccess<unknown>>('store/contact', body)
      .pipe(
        (o) =>
          new Observable<{ message?: string }>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success) sub.next({ message: r.message });
                else sub.error(r);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }
}
