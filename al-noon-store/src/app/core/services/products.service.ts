import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Product,
  ProductsQuery,
  ProductsListResponse,
  ProductApiResponse,
} from '../types/api.types';

/** Ensure product has id (API may return _id) */
function normalizeProduct(p: Product & { _id?: string }): Product {
  const id = p.id ?? p._id ?? '';
  return { ...p, id: String(id) };
}

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
                if (r.success && r.data != null) {
                  const raw = Array.isArray(r.data)
                    ? r.data
                    : (r.data as { products?: (Product & { _id?: string })[] })?.products ?? [];
                  const list = raw.map(normalizeProduct);
                  sub.next({
                    data: list,
                    pagination: r.pagination ?? { total: 0, page: 1, limit: 12, totalPages: 0 },
                  });
                }
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<ProductApiResponse | ApiSuccess<Product & { _id?: string }>>(`products/${id}`).pipe(
      (o) =>
        new Observable<Product>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error('Product not found');
                return;
              }
              const data = r.data as { product?: Product & { _id?: string } } | (Product & { _id?: string });
              const raw =
                data && typeof data === 'object' && 'product' in data
                  ? (data as { product?: Product & { _id?: string } }).product
                  : (data as Product & { _id?: string });
              if (raw) sub.next(normalizeProduct(raw));
              else sub.error('Product not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getRelated(id: string): Observable<Product[]> {
    return this.http.get<ApiSuccess<(Product & { _id?: string })[]>>(`products/${id}/related`).pipe(
      (o) =>
        new Observable<Product[]>((sub) => {
          o.subscribe({
            next: (r) => {
              const raw = r.success && r.data && Array.isArray(r.data) ? r.data : [];
              sub.next(raw.map(normalizeProduct));
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
