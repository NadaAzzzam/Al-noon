import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { ProductDetailComponent } from './product-detail.component';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { SeoService } from '../../core/services/seo.service';
import type { Product } from '../../core/types/api.types';

const mockProduct: Product = {
  id: '1',
  name: { en: 'Test Product', ar: 'منتج' },
  price: 100,
  images: ['/img.jpg'],
  stock: 5,
} as Product;

describe('ProductDetailComponent', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '1']])), snapshot: { paramMap: new Map([['id', '1']]) } } },
        {
          provide: ProductsService,
          useValue: {
            getProduct: () => of(mockProduct),
            getRelated: () => of([]),
            getVariantStock: () => 5,
            getAvailableSizesForColor: () => [],
            getAvailableColorsForSize: () => [],
            isVariantAvailable: () => true,
          },
        },
        { provide: CartService, useValue: { items: signal([]), add: () => ({ success: true }), getItemQuantity: () => 0 } },
        { provide: StoreService, useValue: { settings: signal(null) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: ToastService, useValue: { show: () => {} } },
        { provide: SeoService, useValue: { setPage: () => {}, setProductJsonLd: () => {} } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductDetailComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
