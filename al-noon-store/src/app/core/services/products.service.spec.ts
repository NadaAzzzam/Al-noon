import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ProductsService } from './products.service';

const mockProduct = {
  _id: '1',
  name: { en: 'Test', ar: 'اختبار' },
  price: 100,
  stock: 5,
  status: 'ACTIVE',
  media: { default: { type: 'image', url: '/img.jpg' } },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ProductsService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(ProductsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return normalized products from getProducts', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: [mockProduct], pagination: { total: 1, page: 1, limit: 12, totalPages: 1 } })
    );
    const res = await firstValueFrom(service.getProducts({ page: 1 }));
    expect(res.data).toHaveLength(1);
    expect(res.data[0].id).toBe('1');
    expect(res.data[0].price).toBe(100);
    expect(res.pagination.total).toBe(1);
  });

  it('should return products from data.products when wrapped', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: { products: [mockProduct] },
        pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
      })
    );
    const res = await firstValueFrom(service.getProducts({}));
    expect(res.data).toHaveLength(1);
    expect(res.data[0].id).toBe('1');
  });

  it('should normalize single product from getProduct with merged slug/SEO', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: {
          product: mockProduct,
          slug: 'test-product',
          seoTitle: { en: 'Test SEO' },
          seoDescription: { en: 'Desc' },
        },
      })
    );
    const p = await firstValueFrom(service.getProduct('1'));
    expect(p.id).toBe('1');
    expect(p.slug).toBe('test-product');
    expect(p.seoTitle).toEqual({ en: 'Test SEO' });
  });

  it('should return related products from getRelated', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: [mockProduct] }));
    const list = await firstValueFrom(service.getRelated('1'));
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('1');
  });

  it('should return empty array from getRelated on error', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('Fail')));
    const list = await firstValueFrom(service.getRelated('1'));
    expect(list).toEqual([]);
  });

  it('should return sort filters from getSortFilters', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: [{ value: 'PRICE_ASC', labelEn: 'Price' }] }));
    const opts = await firstValueFrom(service.getSortFilters());
    expect(opts).toHaveLength(1);
    expect(opts[0].value).toBe('PRICE_ASC');
  });
});
