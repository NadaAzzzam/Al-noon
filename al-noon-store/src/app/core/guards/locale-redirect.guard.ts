import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocaleService } from '../services/locale.service';

/** Redirects root '' to /{storedLocale} for locale-aware entry. */
export const localeRedirectGuard: CanActivateFn = () => {
  return inject(Router).createUrlTree([inject(LocaleService).getLocale()]);
};
