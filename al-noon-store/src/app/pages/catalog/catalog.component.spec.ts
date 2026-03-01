import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { CatalogComponent } from './catalog.component';
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
      getProducts: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, limit: 12 })),
      getSortFilters: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [CatalogComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
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
});
