import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import type { Order } from '../../core/types/api.types';

const mockOrder: Order = {
  id: 'o1',
  status: 'CONFIRMED',
  items: [{ product: { id: '1', name: { en: 'P', ar: 'P' }, price: 100, stock: 5, status: 'ACTIVE', images: [] }, quantity: 1, price: 100 }],
  total: 100,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  phone: '123',
  shippingAddress: { address: '123 Main St', city: 'Cairo', governorate: 'Cairo' },
  shippingMethod: 'express',
  paymentMethod: 'COD',
};

describe('OrderConfirmationComponent', () => {
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: { subscribe: (fn: (p: unknown) => void) => { fn({}); return { unsubscribe: () => {} }; } },
            snapshot: {
              queryParams: {},
              queryParamMap: { get: (key: string) => (key === 'id' ? null : key === 'email' ? null : null) },
            },
          },
        },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: AuthService, useValue: { isLoggedIn: () => false, user: signal(null) } },
        { provide: OrdersService, useValue: { getGuestOrder: () => ({ subscribe: () => {} }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OrderConfirmationComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display customerName from order firstName', () => {
    fixture.componentInstance.order.set(mockOrder);
    fixture.detectChanges();
    expect(fixture.componentInstance.customerName()).toBe('John');
  });

  it('should display shippingLines from structured address', () => {
    fixture.componentInstance.order.set(mockOrder);
    fixture.detectChanges();
    const lines = fixture.componentInstance.shippingLines();
    expect(lines).toContain('123 Main St');
    expect(lines).toContain('Cairo, Cairo');
  });

  it('should display paymentDisplay for COD', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.paymentDisplay()).toContain('Cash on Delivery');
  });

  it('should compute subtotal from items', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.subtotal()).toBe(100);
  });

  it('should display contactEmail from order', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.contactEmail()).toBe('john@test.com');
  });

  it('should display contactPhone from order', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.contactPhone()).toBe('123');
  });

  it('should display fullName from firstName and lastName', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.fullName()).toBe('John Doe');
  });

  it('should display fullName from guestName when no firstName', () => {
    fixture.componentInstance.order.set({ ...mockOrder, firstName: undefined, lastName: undefined, guestName: 'Jane Smith' });
    expect(fixture.componentInstance.fullName()).toBe('Jane Smith');
  });

  it('should display shippingMethodDisplay with capitalization', () => {
    fixture.componentInstance.order.set(mockOrder);
    expect(fixture.componentInstance.shippingMethodDisplay()).toBe('Express');
  });

  it('should display Standard when no shippingMethod', () => {
    fixture.componentInstance.order.set({ ...mockOrder, shippingMethod: undefined });
    expect(fixture.componentInstance.shippingMethodDisplay()).toBe('Standard');
  });

  it('should compute deliveryFee from order', () => {
    fixture.componentInstance.order.set({ ...mockOrder, deliveryFee: 20 });
    expect(fixture.componentInstance.deliveryFee()).toBe(20);
  });

  it('should use billingLines when billingAddress differs from shipping', () => {
    const orderWithBilling = {
      ...mockOrder,
      billingAddress: { address: '456 Billing St', city: 'Alex', governorate: '', apartment: '', postalCode: '' },
    };
    fixture.componentInstance.order.set(orderWithBilling);
    const lines = fixture.componentInstance.billingLines();
    expect(lines).toContain('456 Billing St');
    expect(lines).toContain('Alex');
  });

  it('should support flat string shippingAddress', () => {
    fixture.componentInstance.order.set({
      ...mockOrder,
      shippingAddress: '10 Main St, Cairo, Egypt',
    } as Order);
    const lines = fixture.componentInstance.shippingLines();
    expect(lines).toContain('10 Main St');
  });

  it('should call getLocalized for localized text', () => {
    expect(fixture.componentInstance.getLocalized({ en: 'Hello', ar: 'مرحبا' })).toBe('Hello');
  });
});
