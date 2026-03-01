import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, shareReplay } from 'rxjs';
import type {
  StoreData,
  StoreFeedback,
  ContentPage,
  StoreSocialLink,
  StoreQuickLink,
  HomeCollection,
  Settings,
  SettingsRaw,
  SchemaStoreHomeResponse,
  SchemaPageResponse,
  SchemaSettingsResponse,
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

/**
 * Normalize quickLink URL from BE. Uses BE url/slug as-is; only applies app route conventions:
 * - Absolute URLs (http/https): pass through
 * - Full paths (/page/privacy, /contact): pass through
 * - Single segment (e.g. "privacy", "contact"): slug → /page/slug; "contact" → /contact
 */
function normalizeQuickLinkUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  const slug = trimmed.split('/')[0]?.toLowerCase() ?? trimmed.toLowerCase();
  if (slug === 'contact') return '/contact';
  return `/page/${slug}`;
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
    const categoryId = categorySlug ?? (typeof col['categoryId'] === 'string' ? (col['categoryId'] as string).trim() || undefined : undefined);
    return {
      title: (col['title'] ?? { en: '', ar: '' }) as HomeCollection['title'],
      image: col['image'] as string | undefined,
      video: col['video'] as string | undefined,
      hoverImage: col['hoverImage'] as string | undefined,
      url,
      categoryId,
      order: typeof col['order'] === 'number' ? col['order'] : undefined,
    };
  });
}

/** API returns data.home with optional nested store: { store: { storeName, logo, quickLinks, ... } }. Flatten when present. */
function normalizeStore(home: Record<string, unknown>): StoreData {
  const nested = home['store'] as Record<string, unknown> | undefined;
  const flat = nested && typeof nested === 'object' ? { ...home, ...nested } : home;
  const rawNewArrivals = flat['newArrivals'];
  const newArrivals = Array.isArray(rawNewArrivals)
    ? rawNewArrivals.map((p: unknown) => normalizeProductFromApi(p as Parameters<typeof normalizeProductFromApi>[0]))
    : undefined;
  return {
    ...flat,
    quickLinks: normalizeQuickLinks(flat['quickLinks'] ?? nested?.['quickLinks']),
    socialLinks: normalizeSocialLinks(flat['socialLinks'] ?? nested?.['socialLinks']),
    feedbacks: normalizeFeedbacks(flat['feedbacks']),
    homeCollections: normalizeHomeCollections(flat['homeCollections']),
    ...(newArrivals != null ? { newArrivals } : {}),
  } as StoreData;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private cached: StoreData | null = null;
  /** Pending shared request so header + footer (and others) trigger only one HTTP call */
  private store$: Observable<StoreData> | null = null;

  /** Settings from GET /api/settings – loaded once from app root, updated by getSettings() tap. Read everywhere via settings(). */
  private readonly settingsSignal = signal<Settings | null>(null);
  readonly settings = this.settingsSignal.asReadonly();

  /**
   * GET /api/store/home – single source for store + home data.
   * BE returns { success, data: { home: StoreHomeData } }; home is a flat object with all store
   * fields (storeName, logo, quickLinks, newArrivals, homeCollections, hero, announcementBar,
   * promoBanner, newArrivalsLimit, homeCollectionsDisplayLimit, section images/videos, etc.).
   */
  getStore(force = false): Observable<StoreData> {
    if (this.cached && !force) {
      return new Observable((sub) => {
        sub.next(this.cached!);
        sub.complete();
      });
    }
    if (this.store$ && !force) return this.store$;
    this.store$ = this.http
      .get<SchemaStoreHomeResponse>('store/home')
      .pipe(
        tap((res) => {
          if (res.success && res.data && 'home' in res.data) {
            const raw = res.data.home;
            if (raw && typeof raw === 'object') {
              this.cached = normalizeStore(raw as Record<string, unknown>);
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
                if (r.success && r.data && 'home' in r.data) {
                  const raw = (r.data as { home: Record<string, unknown> }).home;
                  if (raw && typeof raw === 'object') sub.next(normalizeStore(raw));
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
      .get<SchemaPageResponse>(`store/page/${encodeURIComponent(slug)}`)
      .pipe(
        (o) =>
          new Observable<ContentPage>((sub) => {
            o.subscribe({
              next: (r) => {
                if (!r.success || !r.data) return;
                const d = r.data as { page?: ContentPage } & ContentPage;
                const slugVal = (d as { slug?: { en?: string; ar?: string } | string }).slug;
                const hasSlug = slugVal != null && (typeof slugVal === 'string' ? slugVal !== '' : (slugVal.en != null || slugVal.ar != null));
                const page = d.page ?? (hasSlug && (d.title != null || d.content != null) ? (d as ContentPage) : null);
                if (page) sub.next(page);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  /**
   * GET /api/settings – BE returns { success, data: { settings: SettingsRaw } }.
   * Call once from app root (App.ngOnInit). Response is also written to settings() signal so the whole app can read it reactively.
   */
  getSettings(): Observable<Settings> {
    return this.http.get<SchemaSettingsResponse>('settings').pipe(
      (o) =>
        new Observable<Settings>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success || !r.data) return;
              const raw: SettingsRaw | null = r.data && 'settings' in r.data ? (r.data as unknown as { settings: SettingsRaw }).settings : null;
              if (!raw || typeof raw !== 'object') return;
              const mapped: Settings = {
                storeName: raw.storeName,
                logo: raw.logo,
                announcementBar: raw.announcementBar,
                socialLinks: raw.socialLinks,
                showSocialLinks: raw.showSocialLinks,
                newsletterEnabled: raw.newsletterEnabled,
                contentPages: raw.contentPages,
                stockDisplay: {
                  lowStockThreshold: raw.lowStockThreshold,
                  stockInfoThreshold: raw.stockInfoThreshold,
                },
                currency: raw.currency,
                currencySymbol: raw.currencySymbol,
                seoSettings: raw.seoSettings,
              };
              sub.next(mapped);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        }),
      tap((s) => this.settingsSignal.set(s)),
      shareReplay(1)
    );
  }
}
