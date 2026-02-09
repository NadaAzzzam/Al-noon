import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const LOCALE_KEY = 'al_noon_locale';

function getLocaleFromStorage(): 'en' | 'ar' {
  if (typeof localStorage === 'undefined') return 'en';
  const stored = localStorage.getItem(LOCALE_KEY);
  return stored === 'ar' || stored === 'en' ? stored : 'en';
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  let url = req.url;
  const isRelative = !url.startsWith('http');
  const isI18n = url.includes('/i18n/') || url.includes('i18n/');
  if (isRelative && !isI18n) {
    url = `${environment.apiUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  const lang = getLocaleFromStorage();
  const cloned = req.clone({
    url,
    withCredentials: isRelative && !isI18n,
    setHeaders: isRelative && !isI18n
      ? { 'x-language': lang, 'Accept-Language': lang }
      : {},
  });
  return next(cloned);
};
