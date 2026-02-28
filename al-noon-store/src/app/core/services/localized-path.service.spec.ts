import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LocalizedPathService } from './localized-path.service';
import { LocaleService } from './locale.service';

describe('LocalizedPathService', () => {
  let service: LocalizedPathService;
  let localeService: { getLocale: ReturnType<typeof vi.fn> };
  let router: { url: string; createUrlTree: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn>; parseUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localeService = { getLocale: vi.fn(() => 'en') };
    router = {
      url: '/en/catalog',
      createUrlTree: vi.fn((segments: string[]) => ({ toString: () => '/' + segments.join('/') })),
      navigate: vi.fn(),
      parseUrl: vi.fn(() => ({ queryParams: {} })),
    };

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        LocalizedPathService,
        { provide: LocaleService, useValue: localeService },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(LocalizedPathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return path array with absolute prefix (leading slash avoids /en/en/ when under /en)', () => {
    expect(service.path('catalog')).toEqual(['/en', 'catalog']);
    expect(service.path('product', '123')).toEqual(['/en', 'product', '123']);
    expect(service.path()).toEqual(['/en']);
  });

  it('should return path with ar when locale is ar', () => {
    localeService.getLocale.mockReturnValue('ar');
    expect(service.path('catalog')).toEqual(['/ar', 'catalog']);
  });

  it('should not duplicate locale when first segment already matches locale', () => {
    expect(service.path('en', 'product', '123')).toEqual(['/en', 'product', '123']);
  });

  it('should convert path string to localized URL', () => {
    expect(service.toUrl('/catalog')).toBe('/en/catalog');
    expect(service.toUrl('/product/123')).toBe('/en/product/123');
    expect(service.toUrl('/')).toBe('/en');
    expect(service.toUrl('')).toBe('/en');
  });

  it('should not double-prefix when path already has lang', () => {
    expect(service.toUrl('/en/catalog')).toBe('/en/catalog');
    expect(service.toUrl('/ar/contact')).toBe('/ar/contact');
  });

  it('should not duplicate locale when path has locale without leading slash', () => {
    expect(service.toUrl('en/product/69a267320d47d126e790b28f')).toBe('/en/product/69a267320d47d126e790b28f');
    expect(service.toUrl('ar/catalog')).toBe('/ar/catalog');
  });

  it('should get current path segments without lang', () => {
    router.url = '/en/catalog';
    expect(service.getCurrentPathSegments()).toEqual(['catalog']);
    router.url = '/en/product/abc';
    expect(service.getCurrentPathSegments()).toEqual(['product', 'abc']);
    router.url = '/en';
    expect(service.getCurrentPathSegments()).toEqual([]);
  });

  it('should navigate with new locale preserving path', () => {
    router.url = '/en/catalog';
    service.navigateWithLocale('ar');
    expect(router.navigate).toHaveBeenCalledWith(
      ['ar', 'catalog'],
      expect.objectContaining({ replaceUrl: true })
    );
  });
});
