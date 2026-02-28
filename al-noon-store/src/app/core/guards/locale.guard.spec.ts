import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { localeGuard } from './locale.guard';
import { LocaleService } from '../services/locale.service';

function createSnapshot(lang: string | null): ActivatedRouteSnapshot {
  return {
    paramMap: { get: (k: string) => (k === 'lang' ? lang : null) },
  } as unknown as ActivatedRouteSnapshot;
}

describe('localeGuard', () => {
  let localeService: { setLocaleFromRoute: ReturnType<typeof vi.fn>; getLocale: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localeService = {
      setLocaleFromRoute: vi.fn(),
      getLocale: vi.fn(() => 'en'),
    };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: LocaleService, useValue: localeService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should allow activation for valid en', () => {
    const result = TestBed.runInInjectionContext(() => localeGuard(createSnapshot('en'), {} as any));
    expect(result).toBe(true);
    expect(localeService.setLocaleFromRoute).toHaveBeenCalledWith('en');
  });

  it('should allow activation for valid ar', () => {
    const result = TestBed.runInInjectionContext(() => localeGuard(createSnapshot('ar'), {} as any));
    expect(result).toBe(true);
    expect(localeService.setLocaleFromRoute).toHaveBeenCalledWith('ar');
  });

  it('should redirect for invalid lang', () => {
    const result = TestBed.runInInjectionContext(() => localeGuard(createSnapshot('fr'), {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['en'], expect.any(Object));
  });

  it('should redirect for missing lang', () => {
    const result = TestBed.runInInjectionContext(() => localeGuard(createSnapshot(null), {} as any));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['en'], expect.any(Object));
  });
});
