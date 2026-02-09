import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, Category } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiSuccess<Category[]>>('categories').pipe(
      (o) =>
        new Observable<Category[]>((sub) => {
          o.subscribe({
            next: (r) => {
              const raw = r.success && r.data != null ? r.data : null;
              const list = Array.isArray(raw) ? raw : (raw && Array.isArray((raw as { categories?: Category[] }).categories) ? (raw as { categories: Category[] }).categories : []);
              sub.next(list);
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
