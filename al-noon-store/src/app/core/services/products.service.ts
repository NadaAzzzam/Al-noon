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
  ProductsListAppliedFilters,
  ProductApiResponse,
  SchemaPaginatedProductsResponse,
  SchemaProductResponse,
  SchemaRelatedProductsResponse,
} from '../types/api.types';
import { normalizeProductFromApi } from '../utils/product-normalizer';
import * as productAvailability from '../utils/product-availability';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  /**
   * GET /api/products – build query params to match API exactly.
   * Params: page, limit, category, slug, search, status, newArrival, availability, sort, minPrice, maxPrice, color, minRating.
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
    set('slug', typeof query.slug === 'string' ? query.slug.trim() : query.slug);
    set('search', typeof query.search === 'string' ? query.search.trim() : query.search);
    set('status', query.status);
    if (query.newArrival === true) params = params.set('newArrival', 'true');
    else if (query.newArrival === false) params = params.set('newArrival', 'false');
    set('availability', query.availability && query.availability !== 'all' ? query.availability : undefined);
    set('sort', query.sort);
    set('minPrice', query.minPrice);
    set('maxPrice', query.maxPrice);
    set('color', query.color);
    set('tags', typeof query.tags === 'string' ? query.tags.trim() : undefined);
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
                    ...(r.appliedFilters != null ? { appliedFilters: r.appliedFilters as ProductsListAppliedFilters } : {}),
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
              const data = r.data as
                | {
                    product?: ProductApiShape & { _id?: string };
                    availability?: unknown;
                    effectivePrice?: number;
                    inStock?: boolean;
                    formattedDetails?: unknown;
                    slug?: string;
                    seoTitle?: { en?: string; ar?: string };
                    seoDescription?: { en?: string; ar?: string };
                    canonicalUrl?: string;
                  }
                | (ProductApiShape & { _id?: string });
              let raw: (ProductApiShape & { _id?: string }) | undefined;
              if (data && typeof data === 'object' && 'product' in data) {
                const wrapped = data as {
                  product?: ProductApiShape & { _id?: string };
                  availability?: unknown;
                  effectivePrice?: number;
                  inStock?: boolean;
                  formattedDetails?: unknown;
                  slug?: string;
                  seoTitle?: { en?: string; ar?: string };
                  seoDescription?: { en?: string; ar?: string };
                  canonicalUrl?: string;
                };
                raw = wrapped.product;
                const hasSiblings =
                  wrapped.availability != null ||
                  wrapped.effectivePrice != null ||
                  wrapped.inStock != null ||
                  wrapped.formattedDetails != null ||
                  wrapped.slug != null ||
                  wrapped.seoTitle != null ||
                  wrapped.seoDescription != null ||
                  wrapped.canonicalUrl != null;
                if (raw && hasSiblings) {
                  raw = {
                    ...raw,
                    ...(wrapped.availability != null ? { availability: wrapped.availability } : {}),
                    ...(wrapped.effectivePrice != null ? { effectivePrice: wrapped.effectivePrice } : {}),
                    ...(wrapped.inStock != null ? { inStock: wrapped.inStock } : {}),
                    ...(wrapped.formattedDetails != null ? { formattedDetails: wrapped.formattedDetails } : {}),
                    ...(wrapped.slug != null ? { slug: wrapped.slug } : {}),
                    ...(wrapped.seoTitle != null ? { seoTitle: wrapped.seoTitle } : {}),
                    ...(wrapped.seoDescription != null ? { seoDescription: wrapped.seoDescription } : {}),
                    ...(wrapped.canonicalUrl != null ? { canonicalUrl: wrapped.canonicalUrl } : {}),
                  };
                }
              } else {
                raw = data as ProductApiShape & { _id?: string };
              }
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

  // ─── Availability helpers (delegate to product-availability utils) ───

  /** Get available sizes for the given color (from variants or all sizes). */
  getAvailableSizesForColor(product: Product | null, color: string | null): string[] {
    return productAvailability.getAvailableSizesForColor(product, color);
  }

  /** Get available colors for the given size (from variants or all colors). */
  getAvailableColorsForSize(product: Product | null, size: string | null): string[] {
    return productAvailability.getAvailableColorsForSize(product, size);
  }

  /** Check if color+size combination is available (in stock). */
  isVariantAvailable(product: Product | null, color: string | null, size: string | null): boolean {
    return productAvailability.isVariantAvailable(product, color, size);
  }

  /** Get stock count for the selected variant (color+size). */
  getVariantStock(product: Product | null, color: string | null, size: string | null): number {
    return productAvailability.getVariantStock(product, color, size);
  }
}
