import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { retry, timer } from 'rxjs';

const LOCALE_KEY = 'al_noon_locale';

function getLocaleFromStorage(): 'en' | 'ar' {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === 'ar' || stored === 'en' ? stored : 'en';
}

/** Generate a UUID v4 for X-Request-Id (support/debugging). */
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let url = req.url;
  const isRelative = !url.startsWith('http');
  const isI18n = url.includes('/i18n/') || url.includes('i18n/');
  if (isRelative && !isI18n) {
    url = `${environment.apiUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  const lang = getLocaleFromStorage();
  const requestId = req.headers.get('X-Request-Id') ?? generateRequestId();
  const headers: Record<string, string> = isRelative && !isI18n
    ? { 'x-language': lang, 'Accept-Language': lang, 'X-Request-Id': requestId }
    : {};
  const cloned = req.clone({
    url,
    withCredentials: isRelative && !isI18n,
    setHeaders: headers,
  });
  return next(cloned).pipe(
    retry({
      count: 1,
      delay: (err, count) => {
        if (count === 0 && err instanceof HttpErrorResponse && err.status === 429) {
          const retryAfter = err.headers?.get('Retry-After');
          const ms = retryAfter ? Math.max(1000, parseInt(retryAfter, 10) * 1000) : 2000;
          return timer(ms);
        }
        throw err;
      },
    }),
  );
};
