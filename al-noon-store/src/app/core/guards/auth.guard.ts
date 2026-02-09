import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.loaded() && auth.user()) return true;
  if (auth.loaded() && !auth.user())
    return router.createUrlTree(['/account', 'login'], { queryParams: { returnUrl: router.url } });
  return auth.loadProfile().pipe(
    take(1),
    map((user) => {
      if (user) return true;
      return router.createUrlTree(['/account', 'login'], { queryParams: { returnUrl: router.url } });
    })
  );
};
