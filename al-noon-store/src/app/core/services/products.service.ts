import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Product,
  ProductFilterOption,
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

  /**
   * GET /api/products – build query params to match API exactly.
   * Params: page, limit, category, search, status, newArrival, availability, sort, minPrice, maxPrice, color, minRating.
   */
  getProducts(query: ProductsQuery = {}): Observable<ProductsListResponse> {
    let params = new HttpParams();

    const set = (key: string, value: string | number | boolean | undefined | null) => {
      if (value === undefined || value === null || value === '') return;
      params = params.set(key, String(value));
    };

    set('page', query.page);
    set('limit', query.limit);
    set('category', query.category);
    set('search', query.search);
    set('status', query.status);
    if (query.newArrival === true) params = params.set('newArrival', 'true');
    else if (query.newArrival === false) params = params.set('newArrival', 'false');
    set('availability', query.availability && query.availability !== 'all' ? query.availability : undefined);
    set('sort', query.sort);
    set('minPrice', query.minPrice);
    set('maxPrice', query.maxPrice);
    set('color', query.color);
    set('minRating', query.minRating);

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

  /** GET /api/products/filters/availability – options for availability dropdown */
  getAvailabilityFilters(): Observable<ProductFilterOption[]> {
    return this.http.get<ApiSuccess<ProductFilterOption[]>>('products/filters/availability').pipe(
      (o) =>
        new Observable<ProductFilterOption[]>((sub) => {
          o.subscribe({
            next: (r) => sub.next(r.success && Array.isArray(r.data) ? r.data : []),
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }

  /** GET /api/products/filters/sort – options for sort dropdown */
  getSortFilters(): Observable<ProductFilterOption[]> {
    return this.http.get<ApiSuccess<ProductFilterOption[]>>('products/filters/sort').pipe(
      (o) =>
        new Observable<ProductFilterOption[]>((sub) => {
          o.subscribe({
            next: (r) => sub.next(r.success && Array.isArray(r.data) ? r.data : []),
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
