import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentMethodsService } from './payment-methods.service';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentMethodsService],
    });
    service = TestBed.inject(PaymentMethodsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return payment methods on success', () => {
    const mockData = {
      success: true,
      data: {
        paymentMethods: [
          { id: '1', label: { en: 'Card', ar: 'بطاقة' }, type: 'card' },
          { id: '2', label: { en: 'Cash', ar: 'نقدي' }, type: 'cash' },
        ],
      },
    };
    service.getPaymentMethods().subscribe((list) => {
      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('1');
      expect(list[1].id).toBe('2');
    });
    const req = httpMock.expectOne((r) => r.url.includes('payment-methods'));
    req.flush(mockData);
  });

  it('should return empty array when success is false', () => {
    service.getPaymentMethods().subscribe((list) => {
      expect(list).toEqual([]);
    });
    const req = httpMock.expectOne((r) => r.url.includes('payment-methods'));
    req.flush({ success: false });
  });

  it('should return empty array when data.paymentMethods is missing', () => {
    service.getPaymentMethods().subscribe((list) => {
      expect(list).toEqual([]);
    });
    const req = httpMock.expectOne((r) => r.url.includes('payment-methods'));
    req.flush({ success: true, data: {} });
  });

  it('should filter out items with null id', () => {
    const mockData = {
      success: true,
      data: {
        paymentMethods: [
          { id: '1', label: { en: 'Card', ar: 'بطاقة' }, type: 'card' },
          { id: null, label: { en: 'Invalid', ar: 'غير صالح' }, type: 'other' },
        ],
      },
    };
    service.getPaymentMethods().subscribe((list) => {
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('1');
    });
    const req = httpMock.expectOne((r) => r.url.includes('payment-methods'));
    req.flush(mockData);
  });

  it('should return empty array on HTTP error', () => {
    service.getPaymentMethods().subscribe((list) => {
      expect(list).toEqual([]);
    });
    const req = httpMock.expectOne((r) => r.url.includes('payment-methods'));
    req.flush('error', { status: 500, statusText: 'Server Error' });
  });
});
