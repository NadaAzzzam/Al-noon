import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('authGuard', () => {
  let authService: { loaded: () => boolean; user: () => unknown; loadProfile: () => ReturnType<AuthService['loadProfile']> };
  let router: Router;

  beforeEach(() => {
    authService = {
      loaded: vi.fn(),
      user: vi.fn(),
      loadProfile: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'account/login', component: DummyComponent },
          { path: 'orders', component: DummyComponent },
        ]),
      ],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'createUrlTree');
  });

  it('should allow access when loaded and user exists', () => {
    vi.mocked(authService.loaded).mockReturnValue(true);
    vi.mocked(authService.user).mockReturnValue({ id: '1' });
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('should redirect to login when loaded and no user', () => {
    vi.mocked(authService.loaded).mockReturnValue(true);
    vi.mocked(authService.user).mockReturnValue(null);
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/account', 'login'],
      expect.objectContaining({ queryParams: expect.any(Object) })
    );
  });

  it('should allow access when loadProfile returns user', async () => {
    vi.mocked(authService.loaded).mockReturnValue(false);
    vi.mocked(authService.loadProfile).mockReturnValue(of({ id: '1' } as never));
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(authService.loadProfile).toHaveBeenCalled();
    expect(result).toBeDefined();
    if (result && typeof result === 'object' && 'subscribe' in result) {
      await new Promise<void>((resolve) => {
        (result as { subscribe: (cb: (v: unknown) => void) => void }).subscribe((v) => {
          expect(v).toBe(true);
          resolve();
        });
      });
    }
  });
});
