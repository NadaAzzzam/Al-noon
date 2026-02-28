import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  let service: ShippingService;
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ShippingService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(ShippingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return normalized methods from { success, data } format', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: [
          { id: '1', name: { en: 'Standard' }, description: { en: '' }, estimatedDays: '3-5', price: 10, enabled: true },
        ],
      })
    );
    const methods = await firstValueFrom(service.getShippingMethods());
    expect(methods).toHaveLength(1);
    expect(methods[0].id).toBe('1');
    expect(methods[0].name).toEqual({ en: 'Standard' });
    expect(methods[0].estimatedDays).toBe('3-5');
    expect(methods[0].price).toBe(10);
  });

  it('should return methods from { data: { shippingMethods } } format', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: {
          shippingMethods: [
            { _id: '2', name: { ar: 'سريع' }, estimatedDays: { min: 1, max: 2 }, enabled: true },
          ],
        },
      })
    );
    const methods = await firstValueFrom(service.getShippingMethods());
    expect(methods).toHaveLength(1);
    expect(methods[0].id).toBe('2');
    expect(methods[0].estimatedDays).toBe('1-2');
  });

  it('should filter out disabled methods', async () => {
    httpMock.get.mockReturnValue(
      of({
        success: true,
        data: [
          { id: '1', name: {}, estimatedDays: '1', enabled: true },
          { id: '2', name: {}, estimatedDays: '2', enabled: false },
        ],
      })
    );
    const methods = await firstValueFrom(service.getShippingMethods());
    expect(methods).toHaveLength(1);
    expect(methods[0].id).toBe('1');
  });

  it('should return empty array on error', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('Network error')));
    const methods = await firstValueFrom(service.getShippingMethods());
    expect(methods).toEqual([]);
  });
});
