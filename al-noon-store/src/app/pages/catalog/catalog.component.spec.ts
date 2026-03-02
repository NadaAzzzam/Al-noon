import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CatalogComponent } from './catalog.component';
import { LocalizedPathService } from '../../core/services/localized-path.service';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;
  let productsMock: { getProducts: ReturnType<typeof vi.fn>; getSortFilters: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productsMock = {
      getProducts: vi.fn().mockReturnValue(of({ data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 12 } })),
      getSortFilters: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [CatalogComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([
          { path: 'en', children: [{ path: 'catalog', component: CatalogComponent }] },
          { path: 'catalog', component: CatalogComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            snapshot: { queryParams: {}, queryParamMap: { get: () => null } },
          },
        },
        { provide: ProductsService, useValue: productsMock },
        { provide: CategoriesService, useValue: { getCategories: () => of([]) } },
        { provide: StoreService, useValue: { settings: signal(null), getPage: () => of(null) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
        { provide: LocalizedPathService, useValue: { path: (...segments: string[]) => (segments.length ? ['/en', ...segments] : ['/en']) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CatalogComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should fetch products and sort filters on init', () => {
    fixture.detectChanges();
    expect(productsMock.getProducts).toHaveBeenCalled();
    expect(productsMock.getSortFilters).toHaveBeenCalled();
  });

  it('should have pagination and loading state', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.loading()).toBeDefined();
    expect(comp.total()).toBeDefined();
  });

  it('should toggle section', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.sectionOpen['availability']).toBe(true);
    comp.toggleSection('availability');
    expect(comp.sectionOpen['availability']).toBe(false);
  });

  it('should update sort when sort.set called', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.sort.set('PRICE_ASC' as import('../../core/types/api.types').ProductSort);
    expect(comp.sort()).toBe('PRICE_ASC');
  });

  it('should have sortOptionsForSelect deduplicated', () => {
    fixture.detectChanges();
    const opts = fixture.componentInstance.sortOptionsForSelect();
    expect(opts.length).toBeGreaterThan(0);
  });

  it('should call applyFilters and navigate', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate');
    comp.search.set('test');
    comp.applyFilters();
    expect(navSpy).toHaveBeenCalled();
    expect(comp.filtersOpen()).toBe(false);
  });

  it('should clearFilters and navigate', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.search.set('x');
    comp.categoryId.set('cat1');
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate');
    comp.clearFilters();
    expect(comp.search()).toBe('');
    expect(comp.categoryId()).toBeUndefined();
    expect(comp.sort()).toBe('CREATED_DESC');
    expect(navSpy).toHaveBeenCalled();
  });

  it('should removeTag and apply filters', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.tags.set('summer,bestseller');
    comp.removeTag('summer');
    expect(comp.tags()).toBe('bestseller');
  });

  it('should removeFilter and call applyFilters', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.search.set('q');
    comp.removeFilter('search');
    expect(comp.search()).toBe('');
  });

  it('should compute activeFilterCount', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.search.set('a');
    comp.categoryId.set('c1');
    expect(comp.activeFilterCount()).toBeGreaterThanOrEqual(2);
  });

  it('should load when load() called', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    productsMock.getProducts.mockClear();
    comp.load();
    expect(productsMock.getProducts).toHaveBeenCalled();
  });

  it('should goToPage and navigate', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate');
    comp.goToPage(2);
    expect(navSpy).toHaveBeenCalled();
  });

  it('should toggleFilters', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.filtersOpen()).toBe(false);
    comp.toggleFilters();
    expect(comp.filtersOpen()).toBe(true);
    comp.toggleFilters();
    expect(comp.filtersOpen()).toBe(false);
  });

  it('should getCategoryName from categories', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.categories.set([{ id: 'c1', name: { en: 'Abayas', ar: '' } } as never]);
    expect(comp.getCategoryName('c1')).toBe('Abayas');
  });

  it('should compute categoryDisplayName', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.categories.set([{ id: 'c1', name: { en: 'Abayas', ar: '' } } as never]);
    comp.categoryId.set('c1');
    expect(comp.categoryDisplayName()).toBe('Abayas');
  });

  it('should compute activeTagsArray from tags', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.tags.set('summer, bestseller ');
    expect(comp.activeTagsArray()).toEqual(['summer', 'bestseller']);
  });

  it('should compute pageNumbers', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.totalPages.set(3);
    expect(comp.pageNumbers()).toEqual([1, 2, 3]);
  });

  it('should sync search and category from queryParams', async () => {
    const queryParams$ = of({ search: 'dress', category: 'abayas' });
    const route = { queryParams: queryParams$, snapshot: { queryParams: {} } };
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CatalogComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([
          { path: 'en', children: [{ path: 'catalog', component: CatalogComponent }] },
          { path: 'catalog', component: CatalogComponent },
        ]),
        { provide: ActivatedRoute, useValue: route },
        { provide: ProductsService, useValue: { getProducts: vi.fn().mockReturnValue(of({ data: [], pagination: { total: 0, totalPages: 0 } })), getSortFilters: vi.fn().mockReturnValue(of([])) } },
        { provide: CategoriesService, useValue: { getCategories: () => of([]) } },
        { provide: StoreService, useValue: { settings: signal(null), getPage: () => of(null) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
        { provide: LocalizedPathService, useValue: { path: (...segments: string[]) => (segments.length ? ['/en', ...segments] : ['/en']) } },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(CatalogComponent);
    f.detectChanges();
    expect(f.componentInstance.search()).toBe('dress');
    expect(f.componentInstance.categoryId()).toBe('abayas');
  });
});
