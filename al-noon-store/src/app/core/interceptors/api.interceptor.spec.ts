import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom, lastValueFrom } from 'rxjs';
import { apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'en'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  const runInterceptor = (req: HttpRequest<unknown>) => {
    mockNext.mockImplementation((r: HttpRequest<unknown>) => of(new HttpResponse({ status: 200 })));
    return apiInterceptor(req, mockNext);
  };

  it('should prefix relative URLs with apiUrl', async () => {
    const req = new HttpRequest('GET', '/products');
    await firstValueFrom(runInterceptor(req));
    const called = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
    expect(called.url).toMatch(/\/products$/);
    expect(called.url).toContain('localhost');
  });

  it('should not modify absolute URLs', async () => {
    const req = new HttpRequest('GET', 'https://cdn.example.com/i18n/en.json');
    await firstValueFrom(runInterceptor(req));
    const called = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
    expect(called.url).toBe('https://cdn.example.com/i18n/en.json');
  });

  it('should add x-language and Accept-Language for relative non-i18n', async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('ar');
    const req = new HttpRequest('GET', '/products');
    await firstValueFrom(runInterceptor(req));
    const called = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
    expect(called.headers.get('x-language')).toBe('ar');
    expect(called.headers.get('Accept-Language')).toBe('ar');
    expect(called.headers.has('X-Request-Id')).toBe(true);
  });

  it('should set withCredentials for relative non-i18n', async () => {
    const req = new HttpRequest('GET', '/products');
    await firstValueFrom(runInterceptor(req));
    const called = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
    expect(called.withCredentials).toBe(true);
  });

  it('should not add auth headers for i18n URLs', async () => {
    const req = new HttpRequest('GET', '/i18n/en.json');
    await firstValueFrom(runInterceptor(req));
    const called = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
    expect(called.headers.has('x-language')).toBe(false);
    expect(called.withCredentials).toBe(false);
  });

  it('should not retry on non-429 errors', async () => {
    mockNext.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );
    const req = new HttpRequest('GET', '/products');
    try {
      await lastValueFrom(apiInterceptor(req, mockNext));
    } catch (err) {
      expect(err).toBeInstanceOf(HttpErrorResponse);
      expect((err as HttpErrorResponse).status).toBe(500);
    }
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
