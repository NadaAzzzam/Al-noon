import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
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
});
