import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
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
  let productsMock: {
    getProduct: ReturnType<typeof vi.fn>;
    getRelated: ReturnType<typeof vi.fn>;
    getVariantStock: ReturnType<typeof vi.fn>;
    isVariantAvailable: ReturnType<typeof vi.fn>;
  };
  let cartMock: { add: ReturnType<typeof vi.fn>; getItemQuantity: ReturnType<typeof vi.fn> };
  let toastMock: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    productsMock = {
      getProduct: vi.fn().mockReturnValue(of(mockProduct)),
      getRelated: vi.fn().mockReturnValue(of([])),
      getVariantStock: vi.fn().mockReturnValue(5),
      isVariantAvailable: vi.fn().mockReturnValue(true),
    };
    cartMock = {
      add: vi.fn().mockReturnValue({ success: true }),
      getItemQuantity: vi.fn().mockReturnValue(0),
    };
    toastMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', '1']])),
            snapshot: { paramMap: new Map([['id', '1']]) },
          },
        },
        {
          provide: ProductsService,
          useValue: {
            ...productsMock,
            getAvailableSizesForColor: () => [],
            getAvailableColorsForSize: () => [],
          },
        },
        { provide: CartService, useValue: { items: signal([]), add: cartMock.add, getItemQuantity: cartMock.getItemQuantity } },
        { provide: StoreService, useValue: { settings: signal(null) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: ToastService, useValue: toastMock },
        { provide: SeoService, useValue: { setPage: vi.fn(), setProductJsonLd: vi.fn() } },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductDetailComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

});
