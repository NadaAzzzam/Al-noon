import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';

describe('errorInterceptor', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ToastService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  const runInterceptor = (req: HttpRequest<unknown>, next: ReturnType<typeof mockNext>) =>
    TestBed.runInInjectionContext(() => errorInterceptor(req, next));

  it('should rethrow for 401 on auth/profile (handled by auth-profile interceptor)', async () => {
    const req = new HttpRequest('GET', 'http://api.test/auth/profile');
    mockNext.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, url: req.url }))
    );
    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should rethrow for 401 on sign-in (component handles)', async () => {
    const req = new HttpRequest('POST', 'http://api.test/auth/sign-in', {});
    mockNext.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, url: req.url }))
    );
    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should rethrow for 404', async () => {
    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );
    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should rethrow for non-HttpErrorResponse', async () => {
    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(throwError(() => new Error('plain error')));
    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(mockNext).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should pass through success responses', async () => {
    const req = new HttpRequest('GET', 'http://api.test/products');
    const res = new HttpResponse({ status: 200, body: {} });
    mockNext.mockReturnValue(of(res));
    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        next: (value) => {
          expect(value).toBe(res);
          resolve();
        },
      });
    });
  });

  it('should redirect and show toast on 401 (non-profile, non-sign-in)', async () => {
    const toast = TestBed.inject(ToastService);
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate');
    const toastSpy = vi.spyOn(toast, 'show');
    vi.stubGlobal('window', { location: { pathname: '/en/products', search: '?q=1' } });
    vi.stubGlobal('localStorage', { getItem: () => 'en' });

    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(navSpy).toHaveBeenCalledWith(['en', 'account', 'login'], expect.objectContaining({ queryParams: expect.any(Object) }));
          expect(toastSpy).toHaveBeenCalledWith('Your session has expired. Please sign in again.', 'info');
          resolve();
        },
      });
    });
  });

  it('should show toast on 403', async () => {
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'show');

    const req = new HttpRequest('GET', 'http://api.test/orders');
    mockNext.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));

    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(toastSpy).toHaveBeenCalled();
          expect(toastSpy.mock.calls[0][1]).toBe('error');
          resolve();
        },
      });
    });
  });

  it('should show toast on 500', async () => {
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'show');

    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(toastSpy).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it('should show network error toast on status 0', async () => {
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'show');

    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(toastSpy).toHaveBeenCalledWith('Network error. Please check your connection.', 'error');
          resolve();
        },
      });
    });
  });

  it('should show unexpected error toast for non-HttpErrorResponse', async () => {
    const toast = TestBed.inject(ToastService);
    const toastSpy = vi.spyOn(toast, 'show');

    const req = new HttpRequest('GET', 'http://api.test/products');
    mockNext.mockReturnValue(throwError(() => new Error('plain')));

    await new Promise<void>((resolve) => {
      runInterceptor(req, mockNext).subscribe({
        error: () => {
          expect(toastSpy).toHaveBeenCalledWith('An unexpected error occurred', 'error');
          resolve();
        },
      });
    });
  });
});
