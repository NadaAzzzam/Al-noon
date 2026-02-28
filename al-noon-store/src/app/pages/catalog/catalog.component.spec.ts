import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CatalogComponent } from './catalog.component';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import { signal } from '@angular/core';

describe('CatalogComponent', () => {
  let fixture: ComponentFixture<CatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParams: of({}), snapshot: { queryParams: {} } } },
        { provide: ProductsService, useValue: { getProducts: () => of({ items: [], total: 0, page: 1, limit: 12 }), getSortFilters: () => of([]) } },
        { provide: CategoriesService, useValue: { getCategories: () => of([]) } },
        { provide: StoreService, useValue: { settings: signal(null), getPage: () => of(null) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: SeoService, useValue: { setPage: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CatalogComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
