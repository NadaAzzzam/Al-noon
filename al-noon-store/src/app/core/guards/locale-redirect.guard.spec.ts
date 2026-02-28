import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { localeRedirectGuard } from './locale-redirect.guard';
import { LocaleService } from '../services/locale.service';

describe('localeRedirectGuard', () => {
  let localeService: { getLocale: ReturnType<typeof vi.fn> };
  let urlTree: { toString: () => string };

  beforeEach(() => {
    localeService = { getLocale: vi.fn(() => 'en') };
    urlTree = { toString: () => '/en' };
    TestBed.configureTestingModule({
      providers: [
        { provide: LocaleService, useValue: localeService },
        {
          provide: Router,
          useValue: { createUrlTree: vi.fn(() => urlTree) },
        },
      ],
    });
  });

  it('should return UrlTree to stored locale', () => {
    const result = TestBed.runInInjectionContext(() => localeRedirectGuard({} as any, {} as any));
    expect(result).toBe(urlTree);
    expect(localeService.getLocale).toHaveBeenCalled();
  });

  it('should return UrlTree to ar when stored locale is ar', () => {
    localeService.getLocale.mockReturnValue('ar');
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() => localeRedirectGuard({} as any, {} as any));
    expect(router.createUrlTree).toHaveBeenCalledWith(['ar']);
  });
});
