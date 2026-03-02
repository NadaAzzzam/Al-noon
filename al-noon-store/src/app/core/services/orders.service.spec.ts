import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { OrdersService } from './orders.service';

const mockOrder = {
  _id: 'o1',
  items: [{ productId: '1', quantity: 1, price: 100, product: { _id: '1', name: { en: 'P' }, price: 100, stock: 5, status: 'ACTIVE', media: {} } }],
  total: 100,
};

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn(), post: vi.fn() };
    TestBed.configureTestingModule({
      providers: [OrdersService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(OrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should complete checkout and return order', async () => {
    httpMock.post.mockReturnValue(of({ success: true, data: mockOrder }));
    const order = await firstValueFrom(service.checkout({ items: [{ product: '1', quantity: 1, price: 100 }] }));
    expect(order.id).toBe('o1');
    expect(order.items).toHaveLength(1);
  });

  it('should return paginated orders from getOrders', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: [mockOrder],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      })
    );
    const res = await firstValueFrom(service.getOrders());
    expect(res.data).toHaveLength(1);
    expect(res.data[0].id).toBe('o1');
    expect(res.pagination.total).toBe(1);
  });

  it('should return guest order by id and email', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: mockOrder }));
    const order = await firstValueFrom(service.getGuestOrder('o1', 'guest@test.com'));
    expect(order.id).toBe('o1');
  });

  it('should error when checkout fails', async () => {
    httpMock.post.mockReturnValue(of({ success: false, message: 'Invalid' }));
    await expect(firstValueFrom(service.checkout({ items: [] }))).rejects.toBeDefined();
  });

  it('should create order and return normalized order', async () => {
    httpMock.post.mockReturnValue(of({ success: true, data: mockOrder }));
    const order = await firstValueFrom(service.createOrder({ items: [{ product: '1', quantity: 1, price: 100 }] }));
    expect(order.id).toBe('o1');
    expect(httpMock.post).toHaveBeenCalledWith('orders', expect.any(Object));
  });

  it('should get order by id', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: mockOrder }));
    const order = await firstValueFrom(service.getOrder('o1'));
    expect(order.id).toBe('o1');
    expect(httpMock.get).toHaveBeenCalledWith('orders/o1');
  });

  it('should error when getOrder returns success: false', async () => {
    httpMock.get.mockReturnValue(of({ success: false }));
    await expect(firstValueFrom(service.getOrder('bad'))).rejects.toBeDefined();
  });

  it('should error when getGuestOrder returns success: false', async () => {
    httpMock.get.mockReturnValue(of({ success: false }));
    await expect(firstValueFrom(service.getGuestOrder('bad', 'x@y.com'))).rejects.toBeDefined();
  });

  it('should pass params to getOrders', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: [], pagination: { total: 0, page: 2, limit: 5, totalPages: 0 } }));
    await firstValueFrom(service.getOrders({ page: 2, limit: 5 }));
    expect(httpMock.get).toHaveBeenCalledWith('orders', expect.objectContaining({ params: expect.any(Object) }));
  });
});
