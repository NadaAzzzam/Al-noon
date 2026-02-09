import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

const PROFILE_NO_SESSION = { success: true as const, data: { user: null } };

export const authProfileInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403)) {
        const isProfile = req.url.includes('auth/profile');
        if (isProfile) {
          return of(new HttpResponse({ status: 200, statusText: 'OK', body: PROFILE_NO_SESSION }));
        }
      }
      throw err;
    })
  );
};
