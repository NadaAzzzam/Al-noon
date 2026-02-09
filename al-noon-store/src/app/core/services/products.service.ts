import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Product,
  ProductsQuery,
  ProductsListResponse,
} from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  getProducts(query: ProductsQuery = {}): Observable<ProductsListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '')
        params = params.set(k, String(v));
    });
    return this.http
      .get<ApiSuccess<Product[]> & { pagination?: ProductsListResponse['pagination'] }>(
        'products',
        { params }
      )
      .pipe(
        (o) =>
          new Observable<ProductsListResponse>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data)
                  sub.next({
                    data: r.data,
                    pagination: r.pagination ?? { total: 0, page: 1, limit: 12, totalPages: 0 },
                  });
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<ApiSuccess<Product>>(`products/${id}`).pipe(
      (o) =>
        new Observable<Product>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.error('Product not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getRelated(id: string): Observable<Product[]> {
    return this.http.get<ApiSuccess<Product[]>>(`products/${id}/related`).pipe(
      (o) =>
        new Observable<Product[]>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.next([]);
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
