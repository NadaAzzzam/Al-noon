import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type { ApiSuccess, StoreData, ContentPage } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private cached: StoreData | null = null;

  getStore(force = false): Observable<StoreData> {
    if (this.cached && !force) {
      return new Observable((sub) => {
        sub.next(this.cached!);
        sub.complete();
      });
    }
    return this.http
      .get<ApiSuccess<StoreData>>('store')
      .pipe(
        tap((res) => {
          if (res.success && res.data) this.cached = res.data;
        })
      )
      .pipe(
        (o) =>
          new Observable<StoreData>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data) sub.next(r.data);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  getPage(slug: string): Observable<ContentPage> {
    return this.http
      .get<ApiSuccess<{ page: ContentPage }>>(`store/page/${encodeURIComponent(slug)}`)
      .pipe(
        (o) =>
          new Observable<ContentPage>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data?.page) sub.next(r.data.page);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }
}
