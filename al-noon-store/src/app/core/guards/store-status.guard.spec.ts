import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { storeStatusGuard, statusPageGuard } from './store-status.guard';
import { StoreService } from '../services/store.service';
import { LocaleService } from '../services/locale.service';
import type { Settings } from '../types/api.types';

function makeRoute(path: string): ActivatedRouteSnapshot {
  return {
    url: [{ path }],
  } as unknown as ActivatedRouteSnapshot;
}

describe('storeStatusGuard', () => {
  let settingsSignal: ReturnType<typeof signal<Settings | null>>;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let localeService: { getLocale: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    settingsSignal = signal<Settings | null>(null);
    router = { createUrlTree: vi.fn((segs: string[]) => ({ toString: () => segs.join('/') }) as unknown as UrlTree) };
    localeService = { getLocale: vi.fn(() => 'en') };

    TestBed.configureTestingModule({
      providers: [
        { provide: StoreService, useValue: { settings: settingsSignal.asReadonly() } },
        { provide: Router, useValue: router },
        { provide: LocaleService, useValue: localeService },
      ],
    });
  });

  it('should allow access when no mode is enabled', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: false });
    const result = TestBed.runInInjectionContext(() => storeStatusGuard(makeRoute(''), {} as any));
    expect(result).toBe(true);
  });

  it('should redirect to coming-soon when comingSoonMode is enabled', () => {
    settingsSignal.set({ comingSoonMode: true, underConstructionMode: false });
    TestBed.runInInjectionContext(() => storeStatusGuard(makeRoute(''), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en', 'coming-soon']);
  });

  it('should redirect to under-construction when underConstructionMode is enabled', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: true });
    TestBed.runInInjectionContext(() => storeStatusGuard(makeRoute(''), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en', 'under-construction']);
  });

  it('should prioritize coming-soon when both modes are enabled', () => {
    settingsSignal.set({ comingSoonMode: true, underConstructionMode: true });
    TestBed.runInInjectionContext(() => storeStatusGuard(makeRoute(''), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en', 'coming-soon']);
  });

  it('should use the current locale for redirects', () => {
    localeService.getLocale.mockReturnValue('ar');
    settingsSignal.set({ comingSoonMode: true });
    TestBed.runInInjectionContext(() => storeStatusGuard(makeRoute(''), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['ar', 'coming-soon']);
  });
});

describe('statusPageGuard', () => {
  let settingsSignal: ReturnType<typeof signal<Settings | null>>;
  let router: { createUrlTree: ReturnType<typeof vi.fn> };
  let localeService: { getLocale: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    settingsSignal = signal<Settings | null>(null);
    router = { createUrlTree: vi.fn((segs: string[]) => ({ toString: () => segs.join('/') }) as unknown as UrlTree) };
    localeService = { getLocale: vi.fn(() => 'en') };

    TestBed.configureTestingModule({
      providers: [
        { provide: StoreService, useValue: { settings: settingsSignal.asReadonly() } },
        { provide: Router, useValue: router },
        { provide: LocaleService, useValue: localeService },
      ],
    });
  });

  it('should allow coming-soon page when comingSoonMode is enabled', () => {
    settingsSignal.set({ comingSoonMode: true, underConstructionMode: false });
    const result = TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('coming-soon'), {} as any));
    expect(result).toBe(true);
  });

  it('should allow under-construction page when underConstructionMode is enabled', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: true });
    const result = TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('under-construction'), {} as any));
    expect(result).toBe(true);
  });

  it('should redirect coming-soon to home when neither mode is enabled', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: false });
    TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('coming-soon'), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en']);
  });

  it('should redirect under-construction to home when neither mode is enabled', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: false });
    TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('under-construction'), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en']);
  });

  it('should redirect under-construction to coming-soon when comingSoonMode has priority', () => {
    settingsSignal.set({ comingSoonMode: true, underConstructionMode: true });
    TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('under-construction'), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en', 'coming-soon']);
  });

  it('should redirect coming-soon to under-construction when only underConstruction is on', () => {
    settingsSignal.set({ comingSoonMode: false, underConstructionMode: true });
    TestBed.runInInjectionContext(() => statusPageGuard(makeRoute('coming-soon'), {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['en', 'under-construction']);
  });
});
