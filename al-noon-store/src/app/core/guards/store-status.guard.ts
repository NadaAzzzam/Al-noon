import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { StoreService } from '../services/store.service';
import { LocaleService } from '../services/locale.service';
import type { Settings } from '../types/api.types';
import { map, take, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Blocks all store routes when comingSoonMode or underConstructionMode is enabled.
 * Priority: comingSoon > underConstruction.
 */
export const storeStatusGuard: CanActivateFn = (_route: ActivatedRouteSnapshot) => {
  const store = inject(StoreService);
  const router = inject(Router);
  const locale = inject(LocaleService);

  const settings = store.settings();
  if (settings) {
    return evaluateStatus(settings, router, locale);
  }

  return toObservable(store.settings).pipe(
    filter((s): s is Settings => s != null),
    take(1),
    map((s) => evaluateStatus(s, router, locale)),
  );
};

/**
 * Reverse guard: ensures the coming-soon / under-construction pages are only
 * accessible when their mode is actually enabled. Redirects to home otherwise.
 */
export const statusPageGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(StoreService);
  const router = inject(Router);
  const locale = inject(LocaleService);

  const page = route.url[0]?.path;

  const settings = store.settings();
  if (settings) {
    return evaluateStatusPage(settings, page, router, locale);
  }

  return toObservable(store.settings).pipe(
    filter((s): s is Settings => s != null),
    take(1),
    map((s) => evaluateStatusPage(s, page, router, locale)),
  );
};

function evaluateStatus(settings: Settings, router: Router, locale: LocaleService): boolean | UrlTree {
  const lang = locale.getLocale();
  if (settings.comingSoonMode) {
    return router.createUrlTree([lang, 'coming-soon']);
  }
  if (settings.underConstructionMode) {
    return router.createUrlTree([lang, 'under-construction']);
  }
  return true;
}

function evaluateStatusPage(settings: Settings, page: string | undefined, router: Router, locale: LocaleService): boolean | UrlTree {
  const lang = locale.getLocale();

  if (page === 'coming-soon') {
    if (settings.comingSoonMode) return true;
    if (settings.underConstructionMode) return router.createUrlTree([lang, 'under-construction']);
    return router.createUrlTree([lang]);
  }

  if (page === 'under-construction') {
    if (settings.comingSoonMode) return router.createUrlTree([lang, 'coming-soon']);
    if (settings.underConstructionMode) return true;
    return router.createUrlTree([lang]);
  }

  return router.createUrlTree([lang]);
}
