import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, Category, CategoriesApiResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<CategoriesApiResponse | ApiSuccess<Category[]>>('categories').pipe(
      (o) =>
        new Observable<Category[]>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.next([]);
                return;
              }
              const raw = r.data as { categories?: Category[] } | Category[] | null;
              const list = Array.isArray(raw) ? raw : (raw?.categories ?? []);
              sub.next(list);
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
