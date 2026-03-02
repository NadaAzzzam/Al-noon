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
  id: '0123456789abcdef01234567',
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
            paramMap: of(new Map([['id', '0123456789abcdef01234567']])),
            snapshot: { paramMap: new Map([['id', '0123456789abcdef01234567']]) },
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
        { provide: CartService, useValue: { items: signal([]), add: cartMock.add, getItemQuantity: cartMock.getItemQuantity, openDrawer: vi.fn() } },
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

  it('should compute effectiveStock from product', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.product()).toBeTruthy();
    expect(fixture.componentInstance.effectiveStock()).toBe(5);
  });

  it('should compute hasSale when discountPrice differs from price', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, price: 100, discountPrice: 80 }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(f.componentInstance.hasSale()).toBe(true);
    expect(f.componentInstance.currentPrice()).toBe(80);
  });

  it('should compute discountPercent', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, price: 100, discountPrice: 75 }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(f.componentInstance.discountPercent()).toBe(25);
  });

  it('should call addToCart and show toast on success', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.addToCart();
    expect(cartMock.add).toHaveBeenCalled();
    expect(toastMock.show).toHaveBeenCalledWith(expect.stringContaining('added to cart'), 'success');
  });

  it('should show error when addToCart with missing color', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, colors: ['Red'], sizes: [] }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.selectedColor.set(null);
    f.componentInstance.addToCart();
    expect(toastMock.show).toHaveBeenCalledWith('Please select a color', 'error');
    expect(cartMock.add).not.toHaveBeenCalled();
  });

  it('should show error when addToCart with missing size', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, colors: [], sizes: ['M'] }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.selectedSize.set(null);
    f.componentInstance.addToCart();
    expect(toastMock.show).toHaveBeenCalledWith('Please select a size', 'error');
  });

  it('should getLocalized return en value', () => {
    expect(fixture.componentInstance.getLocalized({ en: 'Hello', ar: 'مرحبا' })).toBe('Hello');
  });

  it('should colorToCss map burgundy to hex', () => {
    expect(fixture.componentInstance.colorToCss('burgundy')).toBe('#800020');
  });

  it('should getDetailBlockItems return items for list block', () => {
    const items = fixture.componentInstance.getDetailBlockItems({ type: 'list', items: ['a', 'b'] });
    expect(items).toEqual(['a', 'b']);
  });

  it('should selectGalleryIndex update selected index', () => {
    fixture.componentInstance.selectGalleryIndex(2);
    expect(fixture.componentInstance.selectedImageIndex()).toBe(2);
  });

  it('should getThumbsTrackWidth return correct width', () => {
    expect(fixture.componentInstance.getThumbsTrackWidth()).toBeGreaterThan(0);
  });

  it('should compute originalPrice when on sale', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, price: 100, discountPrice: 75 }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(f.componentInstance.originalPrice()).toBe(100);
  });

  it('should compute remainingCanAdd from effectiveStock minus cart', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.remainingCanAdd()).toBeGreaterThanOrEqual(0);
  });

  it('should return empty for getDetailBlockItems when not list type', () => {
    const items = fixture.componentInstance.getDetailBlockItems({ type: 'text', content: 'hi' } as never);
    expect(items).toEqual([]);
  });

  it('should compute images from product', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.images()).toEqual(['/img.jpg']);
  });

  it('should compute breadcrumbItems when product loaded', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    const items = fixture.componentInstance.breadcrumbItems();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((i) => i.label === 'Test Product')).toBe(true);
  });

  it('should show error when addToCart with variant unavailable', async () => {
    productsMock.isVariantAvailable.mockReturnValue(false);
    const p = { ...mockProduct, colors: ['Red'], sizes: ['M'], availability: { variants: [{ color: 'Red', size: 'M' }] } };
    productsMock.getProduct.mockReturnValue(of(p));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.selectedColor.set('Red');
    f.componentInstance.selectedSize.set('M');
    f.componentInstance.addToCart();
    expect(toastMock.show).toHaveBeenCalledWith('This color and size combination is out of stock', 'error');
  });

  it('should show error when addToCart with no stock', async () => {
    productsMock.getVariantStock.mockReturnValue(0);
    const p = { ...mockProduct, stock: 0 };
    productsMock.getProduct.mockReturnValue(of(p));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.addToCart();
    expect(toastMock.show).toHaveBeenCalledWith('This item is out of stock', 'error');
  });

  it('should compute addToCartDisabled when added', () => {
    fixture.componentInstance.product.set(mockProduct);
    fixture.componentInstance.added.set(true);
    expect(fixture.componentInstance.addToCartDisabled()).toBe(true);
  });

  it('should compute addToCartDisabled when quantity exceeds remainingCanAdd', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.quantity.set(999);
    expect(fixture.componentInstance.addToCartDisabled()).toBe(true);
  });

  it('should use effectivePrice for hasSale when present', async () => {
    productsMock.getProduct.mockReturnValue(of({ ...mockProduct, price: 100, effectivePrice: 80 }));
    const f = TestBed.createComponent(ProductDetailComponent);
    f.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    expect(f.componentInstance.hasSale()).toBe(true);
    expect(f.componentInstance.currentPrice()).toBe(80);
  });

  it('should compute cartQuantityForCurrent from cart', () => {
    fixture.componentInstance.product.set(mockProduct);
    cartMock.getItemQuantity.mockReturnValue(2);
    expect(fixture.componentInstance.cartQuantityForCurrent()).toBe(2);
  });

  it('should return isColorOutOfStock from availability', () => {
    const p = { ...mockProduct, availability: { colors: [{ color: 'Red', outOfStock: true, available: false }] } } as Product;
    fixture.componentInstance.product.set(p);
    expect(fixture.componentInstance.isColorOutOfStock('Red')).toBe(true);
  });

  it('should return isSizeOutOfStock from availability', () => {
    const p = { ...mockProduct, availability: { sizes: [{ size: 'M', outOfStock: true, available: false }] } } as Product;
    fixture.componentInstance.product.set(p);
    expect(fixture.componentInstance.isSizeOutOfStock('M')).toBe(true);
  });

  it('should call selectColor and update product', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.selectColor('Red');
    await new Promise((r) => setTimeout(r, 20));
    expect(productsMock.getProduct).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ color: 'Red' }));
  });

  it('should call selectSize and update product', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.selectSize('M');
    await new Promise((r) => setTimeout(r, 20));
    expect(productsMock.getProduct).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ size: 'M' }));
  });

  it('should compute detailBlocks from formattedDetails', () => {
    const p = { ...mockProduct, formattedDetails: { en: [{ type: 'paragraph', text: 'Hello' }] } } as Product;
    fixture.componentInstance.product.set(p);
    expect(fixture.componentInstance.detailBlocks()).toBeDefined();
  });

  it('should compute allSizesOrdered from availability', () => {
    const p = { ...mockProduct, availability: { sizes: [{ size: 'S', available: true, outOfStock: false }, { size: 'M', available: true, outOfStock: false }] } } as Product;
    fixture.componentInstance.product.set(p);
    expect(fixture.componentInstance.allSizesOrdered()).toEqual(['S', 'M']);
  });

  it('should compute allColorsOrdered from product colors', () => {
    const p = { ...mockProduct, colors: ['Red', 'Blue'] } as Product;
    fixture.componentInstance.product.set(p);
    expect(fixture.componentInstance.allColorsOrdered()).toEqual(['Red', 'Blue']);
  });

  it('should compute galleryItems from media when present', () => {
    const p = { ...mockProduct, media: { default: { type: 'image' as const, url: '/m.jpg' } } } as Product;
    fixture.componentInstance.product.set(p);
    const items = fixture.componentInstance.galleryItems();
    expect(items.length).toBeGreaterThan(0);
  });
});
