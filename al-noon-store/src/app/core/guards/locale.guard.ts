import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { LocaleService } from '../services/locale.service';

const SUPPORTED_LOCALES = ['en', 'ar'] as const;

export const localeGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const localeService = inject(LocaleService);
  const lang = route.paramMap.get('lang');

  if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
    localeService.setLocaleFromRoute(lang as 'en' | 'ar');
    return true;
  }

  const stored = localeService.getLocale();
  router.navigate([stored], { queryParams: route.queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  return false;
};
