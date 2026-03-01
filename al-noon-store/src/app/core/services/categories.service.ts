import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Category, CategoryStatus, SchemaCategoriesResponse } from '../types/api.types';

/** API may return _id; normalize to id for FE. */
function normalizeCategory(c: Category & { _id?: string }): Category {
  const id = String(c.id ?? c._id ?? '');
  return { ...c, id };
}

/** Params for GET /categories (OpenAPI: status = visible | hidden | PUBLISHED; PUBLISHED = alias for visible) */
export interface GetCategoriesParams {
  status?: CategoryStatus;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  getCategories(params?: GetCategoriesParams): Observable<Category[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<SchemaCategoriesResponse>('categories', { params: httpParams }).pipe(
      (o) =>
        new Observable<Category[]>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.next([]);
                return;
              }
              const raw = r.data as { categories?: (Category & { _id?: string })[] } | (Category & { _id?: string })[] | null;
              const list = Array.isArray(raw) ? raw : (raw?.categories ?? []);
              sub.next(list.map(normalizeCategory));
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
