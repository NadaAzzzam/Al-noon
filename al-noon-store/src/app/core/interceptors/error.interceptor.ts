import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { extractErrorMessage } from '../../shared/utils/error-utils';

const LOCALE_KEY = 'al_noon_locale';

function getLocale(): string {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === 'ar' || stored === 'en' ? stored : 'en';
}

/** Handles 401/403 redirect to login, 5xx/network errors with toast. Auth profile 401 is handled by authProfileInterceptor. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const platformId = inject(PLATFORM_ID);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        if (isPlatformBrowser(platformId)) {
          toast.show('An unexpected error occurred', 'error');
        }
        return throwError(() => err);
      }

      const status = err.status;
      const isProfile = req.url.includes('auth/profile');
      const isSignInOrUp = req.url.includes('auth/sign-in') || req.url.includes('auth/sign-up');

      if (status === 401 && !isProfile && !isSignInOrUp) {
        const locale = getLocale();
        const returnUrl = typeof window !== 'undefined' ? window.location.pathname + (window.location.search || '') : '';
        router.navigate([locale, 'account', 'login'], {
          queryParams: { returnUrl: returnUrl || undefined },
          queryParamsHandling: returnUrl ? 'merge' : '',
        });
        if (isPlatformBrowser(platformId)) {
          toast.show('Your session has expired. Please sign in again.', 'info');
        }
        return throwError(() => err);
      }

      if (status === 403) {
        if (isPlatformBrowser(platformId)) {
          toast.show(extractErrorMessage(err, 'Access denied'), 'error');
        }
        return throwError(() => err);
      }

      if (status >= 500 || status === 0) {
        if (isPlatformBrowser(platformId)) {
          const message =
            status === 0
              ? 'Network error. Please check your connection.'
              : extractErrorMessage(err, 'Server error. Please try again later.');
          toast.show(message, 'error');
        }
        return throwError(() => err);
      }

      return throwError(() => err);
    })
  );
};
