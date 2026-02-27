import { describe, it, expect } from 'vitest';
import { HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { authProfileInterceptor } from './auth-profile.interceptor';

describe('authProfileInterceptor', () => {
  const next = (req: HttpRequest<unknown>) => of({} as never);

  it('passes through non-401/403 errors', () => {
    const req = new HttpRequest('GET', '/auth/profile');
    const nextWithError = () => throwError(() => new HttpErrorResponse({ status: 500 }));
    let thrown = false;
    authProfileInterceptor(req, nextWithError).subscribe({
      error: () => { thrown = true; },
    });
    expect(thrown).toBe(true);
  });

  it('returns success response for 401 on auth/profile', () => {
    const req = new HttpRequest('GET', 'https://api.example.com/auth/profile');
    const nextWithError = () => throwError(() => new HttpErrorResponse({ status: 401 }));
    authProfileInterceptor(req, nextWithError).subscribe((res) => {
      expect(res).toBeDefined();
      expect((res as { body?: { success?: boolean; data?: { user: null } } }).body?.success).toBe(true);
      expect((res as { body?: { data?: { user: null } } }).body?.data?.user).toBeNull();
    });
  });
});
