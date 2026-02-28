import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LocaleService } from './locale.service';

/**
 * Builds routes and URLs with the current language prefix for SEO-friendly locale-specific paths.
 * Use path() for routerLink arrays and toUrl() for path strings (e.g. from backend).
 */
@Injectable({ providedIn: 'root' })
export class LocalizedPathService {
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  /** Returns router link array with current lang prefix (absolute path). e.g. path('catalog') => ['/en', 'catalog'] */
  path(...segments: string[]): string[] {
    const locale = this.locale.getLocale();
    const filtered = segments.filter(Boolean);
    // Leading '/' makes navigation absolute (avoids /en/en/catalog when under /en)
    // Avoid duplicate locale if first segment already matches locale
    if (filtered[0] === locale) return ['/' + locale, ...filtered.slice(1)];
    return filtered.length ? ['/' + locale, ...filtered] : ['/' + locale];
  }

  /** Converts a path string (e.g. '/catalog', '/product/123') to a localized URL with lang prefix */
  toUrl(path: string): string {
    const p = (path || '/').trim();
    if (!p || p === '/') return `/${this.locale.getLocale()}`;
    const lang = this.locale.getLocale();
    // Already has locale prefix (with or without leading slash) – avoid duplication
    if (p.startsWith(`/${lang}/`) || p === `/${lang}`) return p;
    if (p.startsWith('/en/') || p === '/en' || p.startsWith('/ar/') || p === '/ar') return p;
    if (p.startsWith('en/') || p === 'en' || p.startsWith('ar/') || p === 'ar') return '/' + p;
    const clean = p.replace(/^\//, '').replace(/\/+/g, '/').trim() || '';
    return clean ? `/${lang}/${clean}` : `/${lang}`;
  }

  /** Returns current path segments without the lang prefix (for rebuilding links) */
  getCurrentPathSegments(): string[] {
    const url = this.router.url;
    const [_, lang, ...rest] = url.split('?')[0].split('/').filter(Boolean);
    return lang === 'en' || lang === 'ar' ? rest : [lang, ...rest].filter(Boolean);
  }

  /** Navigate to the same page but with a different lang (for language switcher) */
  navigateWithLocale(newLang: 'en' | 'ar'): void {
    const segments = this.getCurrentPathSegments();
    const queryParams = this.router.parseUrl(this.router.url).queryParams;
    this.router.navigate([newLang, ...segments], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
