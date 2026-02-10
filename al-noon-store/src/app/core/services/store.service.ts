import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay } from 'rxjs';
import type {
  ApiSuccess,
  StoreData,
  StoreFeedback,
  ContentPage,
  StoreApiResponse,
  PageApiResponse,
  StoreSocialLink,
  StoreQuickLink,
  HomeCollection,
} from '../types/api.types';
import { normalizeProductFromApi } from '../utils/product-normalizer';

/** API may return socialLinks as object (e.g. { Facebook: url }) or array; ensure array. */
function normalizeSocialLinks(raw: unknown): StoreSocialLink[] {
  if (Array.isArray(raw)) return raw as StoreSocialLink[];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw).map(([platform, url]) => ({
      platform,
      url: typeof url === 'string' ? url : '',
    }));
  }
  return [];
}

/** Known content page slugs (backend GET /store/page/:slug). Contact is a separate route /contact. */
const PAGE_SLUG_MAP: Record<string, string> = {
  privacy: '/page/privacy',
  'shipping-policy': '/page/shipping-policy',
  shipping: '/page/shipping-policy',
  'return-policy': '/page/return-policy',
  about: '/page/about',
};

/** Normalize quickLink URL so internal page slugs match app routes (e.g. /privacy → /page/privacy). */
function normalizeQuickLinkUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const slug = path.split('/')[0]?.toLowerCase();
  if (slug && PAGE_SLUG_MAP[slug]) return PAGE_SLUG_MAP[slug];
  if (slug === 'contact') return '/contact';
  return trimmed.startsWith('/') || trimmed.startsWith('http') ? trimmed : `/${trimmed}`;
}

/** Ensure quickLinks is always an array; BE sends label, FE uses title. */
function normalizeQuickLinks(raw: unknown): StoreQuickLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((link: Record<string, unknown>) => {
    const title = (link['title'] ?? link['label']) as StoreQuickLink['title'];
    const rawUrl = (link['url'] ?? '') as string;
    const url = normalizeQuickLinkUrl(rawUrl);
    return { ...link, title: title ?? { en: '', ar: '' }, url } as StoreQuickLink;
  });
}

/** BE returns feedback with _id, message; FE uses id, comment. */
function normalizeFeedbacks(raw: unknown): StoreFeedback[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f: Record<string, unknown>) => ({
    id: String(f['_id'] ?? f['id'] ?? ''),
    product: f['product'] as StoreFeedback['product'],
    rating: typeof f['rating'] === 'number' ? f['rating'] : undefined,
    comment: (f['comment'] ?? f['message']) as string | undefined,
    message: f['message'] as string | undefined,
    customerName: f['customerName'] as string | undefined,
    image: f['image'] as string | undefined,
  }));
}

/** Map /products to /catalog so collection links match app routes. */
function normalizeCollectionUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/products') || trimmed.startsWith('products')) {
    const rest = trimmed.replace(/^\/?products\/?/, '').trim();
    if (rest.startsWith('?')) {
      return `/catalog${rest}`;
    }
    // Path segment like "abayas" or "/abayas" → catalog with category
    const pathPart = rest.split('?')[0] ?? '';
    const segment = pathPart.replace(/^\//, '').split('/')[0]?.trim();
    if (segment) {
      const params = new URLSearchParams(rest.includes('?') ? rest.split('?')[1] ?? '' : '');
      params.set('category', segment);
      return `/catalog?${params.toString()}`;
    }
    return '/catalog';
  }
  // Single segment (e.g. "capes" or "category-id") → treat as category slug for catalog
  if (!trimmed.startsWith('/') && !trimmed.startsWith('http') && !trimmed.includes('?') && !trimmed.includes('/')) {
    return `/catalog?category=${encodeURIComponent(trimmed)}`;
  }
  return trimmed.startsWith('/') || trimmed.startsWith('http') ? trimmed : `/${trimmed}`;
}

/** Get category slug/id from a collection item (API may send category, categoryId, slug, or category as object). */
function getCollectionCategorySlug(col: Record<string, unknown>): string | undefined {
  const cat = col['category'];
  if (cat != null && typeof cat === 'object' && !Array.isArray(cat)) {
    const id = (cat as Record<string, unknown>)['id'] ?? (cat as Record<string, unknown>)['slug'] ?? (cat as Record<string, unknown>)['_id'];
    if (id != null && typeof id === 'string') {
      const s = id.trim();
      return s || undefined;
    }
  }
  const raw = (col['categoryId'] ?? col['slug'] ?? (typeof cat === 'string' ? cat : undefined)) as string | undefined;
  if (raw != null && typeof raw === 'string') {
    const s = raw.trim();
    return s || undefined;
  }
  return undefined;
}

/** Ensure homeCollections is an array; normalize URLs and optional hoverImage/video. */
function normalizeHomeCollections(raw: unknown): HomeCollection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((col: Record<string, unknown>) => {
    const rawUrl = (col['url'] ?? '') as string;
    let url = normalizeCollectionUrl(rawUrl);
    const categorySlug = getCollectionCategorySlug(col);
    // If URL is empty or has no category and we have a category slug, link to catalog with that category
    if (categorySlug) {
      const hasCategoryInUrl = url.includes('category=');
      if (!url || url === '/catalog' || !hasCategoryInUrl) {
        const params = new URLSearchParams(url?.split('?')[1] ?? '');
        params.set('category', categorySlug);
        url = `/catalog?${params.toString()}`;
      }
    }
    if (!url) url = '/catalog';
    return {
      title: (col['title'] ?? { en: '', ar: '' }) as HomeCollection['title'],
      image: col['image'] as string | undefined,
      video: col['video'] as string | undefined,
      hoverImage: col['hoverImage'] as string | undefined,
      url,
      order: typeof col['order'] === 'number' ? col['order'] : undefined,
    };
  });
}

function normalizeStore(store: Record<string, unknown>): StoreData {
  const rawNewArrivals = store['newArrivals'];
  const newArrivals = Array.isArray(rawNewArrivals)
    ? rawNewArrivals.map((p: unknown) => normalizeProductFromApi(p as Parameters<typeof normalizeProductFromApi>[0]))
    : undefined;
  return {
    ...store,
    quickLinks: normalizeQuickLinks(store['quickLinks']),
    socialLinks: normalizeSocialLinks(store['socialLinks']),
    feedbacks: normalizeFeedbacks(store['feedbacks']),
    homeCollections: normalizeHomeCollections(store['homeCollections']),
    ...(newArrivals != null ? { newArrivals } : {}),
  } as StoreData;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private cached: StoreData | null = null;
  /** Pending shared request so header + footer (and others) trigger only one HTTP call */
  private store$: Observable<StoreData> | null = null;

  getStore(force = false): Observable<StoreData> {
    if (this.cached && !force) {
      return new Observable((sub) => {
        sub.next(this.cached!);
        sub.complete();
      });
    }
    if (this.store$ && !force) return this.store$;
    this.store$ = this.http
      .get<StoreApiResponse | ApiSuccess<StoreData>>('store')
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const raw = 'store' in res.data ? res.data.store : res.data;
            if (raw && typeof raw === 'object') {
              this.cached = normalizeStore(raw as unknown as Record<string, unknown>);
              this.store$ = null;
            }
          }
        })
      )
      .pipe(
        (o) =>
          new Observable<StoreData>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data) {
                  const raw = 'store' in r.data ? r.data.store : r.data;
                  if (raw && typeof raw === 'object') sub.next(normalizeStore(raw as unknown as Record<string, unknown>));
                }
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          }),
        shareReplay(1)
      );
    return this.store$;
  }

  getPage(slug: string): Observable<ContentPage> {
    return this.http
      .get<PageApiResponse | ApiSuccess<{ page: ContentPage }> | ApiSuccess<ContentPage>>(
        `store/page/${encodeURIComponent(slug)}`
      )
      .pipe(
        (o) =>
          new Observable<ContentPage>((sub) => {
            o.subscribe({
              next: (r) => {
                if (!r.success || !r.data) return;
                const d = r.data as { page?: ContentPage } & ContentPage;
                const page = d.page ?? (d.slug != null && (d.title != null || d.content != null) ? (d as ContentPage) : null);
                if (page) sub.next(page);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }
}
