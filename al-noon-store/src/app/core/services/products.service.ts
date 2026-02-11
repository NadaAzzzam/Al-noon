import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Product,
  ProductApiShape,
  ProductFilterOption,
  ProductsQuery,
  ProductsListResponse,
  ProductApiResponse,
  SchemaPaginatedProductsResponse,
  SchemaProductResponse,
  SchemaRelatedProductsResponse,
} from '../types/api.types';
import { normalizeProductFromApi } from '../utils/product-normalizer';

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
      .get<SchemaPaginatedProductsResponse | (ApiSuccess<(ProductApiShape & { _id?: string })[]> & { pagination?: ProductsListResponse['pagination']; appliedFilters?: ProductsListResponse['appliedFilters'] })>(
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
                    : (r.data as { products?: (ProductApiShape & { _id?: string })[] })?.products ?? [];
                  const list = raw.map((p) => normalizeProductFromApi(p));
                  sub.next({
                    data: list,
                    pagination: r.pagination ?? { total: 0, page: 1, limit: 12, totalPages: 0 },
                    ...(r.appliedFilters != null ? { appliedFilters: r.appliedFilters } : {}),
                  });
                }
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  /** GET /api/products/:id – optional color query for color-specific images. */
  getProduct(id: string, options?: { color?: string }): Observable<Product> {
    let params = new HttpParams();
    if (options?.color?.trim()) params = params.set('color', options.color.trim());
    return this.http.get<SchemaProductResponse | ProductApiResponse | ApiSuccess<ProductApiShape & { _id?: string }>>(`products/${id}`, { params }).pipe(
      (o) =>
        new Observable<Product>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error('Product not found');
                return;
              }
              const data = r.data as { product?: ProductApiShape & { _id?: string } } | (ProductApiShape & { _id?: string });
              const raw =
                data && typeof data === 'object' && 'product' in data
                  ? (data as { product?: ProductApiShape & { _id?: string } }).product
                  : (data as ProductApiShape & { _id?: string });
              if (raw) sub.next(normalizeProductFromApi(raw));
              else sub.error('Product not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getRelated(id: string): Observable<Product[]> {
    return this.http.get<SchemaRelatedProductsResponse | ApiSuccess<(ProductApiShape & { _id?: string })[]>>(`products/${id}/related`).pipe(
      (o) =>
        new Observable<Product[]>((sub) => {
          o.subscribe({
            next: (r) => {
              const raw = r.success && r.data && Array.isArray(r.data) ? r.data : [];
              sub.next(raw.map((p) => normalizeProductFromApi(p)));
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
