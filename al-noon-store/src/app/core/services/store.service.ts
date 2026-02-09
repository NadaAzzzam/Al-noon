import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import type {
  ApiSuccess,
  StoreData,
  ContentPage,
  StoreApiResponse,
  PageApiResponse,
  StoreSocialLink,
  StoreQuickLink,
} from '../types/api.types';

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

/** Ensure quickLinks is always an array. */
function normalizeQuickLinks(raw: unknown): StoreQuickLink[] {
  if (Array.isArray(raw)) return raw as StoreQuickLink[];
  return [];
}

function normalizeStore(store: Record<string, unknown>): StoreData {
  return {
    ...store,
    quickLinks: normalizeQuickLinks(store['quickLinks']),
    socialLinks: normalizeSocialLinks(store['socialLinks']),
  } as StoreData;
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly http = inject(HttpClient);
  private cached: StoreData | null = null;

  getStore(force = false): Observable<StoreData> {
    if (this.cached && !force) {
      return new Observable((sub) => {
        sub.next(this.cached!);
        sub.complete();
      });
    }
    return this.http
      .get<StoreApiResponse | ApiSuccess<StoreData>>('store')
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const raw = 'store' in res.data ? res.data.store : res.data;
            if (raw && typeof raw === 'object') this.cached = normalizeStore(raw as unknown as Record<string, unknown>);
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
          })
      );
  }

  getPage(slug: string): Observable<ContentPage> {
    return this.http
      .get<PageApiResponse | ApiSuccess<{ page: ContentPage }>>(`store/page/${encodeURIComponent(slug)}`)
      .pipe(
        (o) =>
          new Observable<ContentPage>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data?.page) sub.next(r.data.page);
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }
}
