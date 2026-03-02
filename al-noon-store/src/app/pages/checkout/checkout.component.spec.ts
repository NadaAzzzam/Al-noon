import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError, Observable } from 'rxjs';
import { signal, computed } from '@angular/core';
import { CheckoutComponent } from './checkout.component';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ShippingService } from '../../core/services/shipping.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { StoreService } from '../../core/services/store.service';
import { ToastService } from '../../core/services/toast.service';

const mockCity = { id: '1', name: { en: 'Cairo', ar: 'القاهرة' }, deliveryFee: 35 };
const mockShipping = { id: '698bd736064e85b854c54416', name: { en: 'Standard', ar: 'عادي' }, description: { en: '', ar: '' }, estimatedDays: '3-5', price: 0 };
const mockPayment = { id: 'COD' as const, name: { en: 'Cash on Delivery', ar: 'الدفع' } };
const mockCartItems = [{ productId: 'p1', quantity: 1, price: 100, name: 'Test' }];

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let toastSpy: { show: ReturnType<typeof vi.fn> };
  let checkoutSpy: ReturnType<typeof vi.fn>;
  let cartClearSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    toastSpy = { show: vi.fn() };
    checkoutSpy = vi.fn().mockReturnValue(of({ id: 'ord1', items: [], total: 100, status: 'PENDING' }));
    cartClearSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { items: signal(mockCartItems), subtotal: computed(() => 100), getItemsForOrder: () => [{ product: 'p1', quantity: 1, price: 100 }], specialInstructions: signal(''), clear: cartClearSpy } },
        { provide: OrdersService, useValue: { checkout: checkoutSpy } },
        { provide: CitiesService, useValue: { getCities: () => of([mockCity]) } },
        { provide: ShippingService, useValue: { getShippingMethods: () => of([mockShipping]) } },
        { provide: PaymentMethodsService, useValue: { getPaymentMethods: () => of([mockPayment]) } },
        { provide: ApiService, useValue: { imageUrl: (p: string) => p } },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: AuthService, useValue: { user: signal(null), isLoggedIn: () => false } },
        {
          provide: StoreService,
          useValue: {
            settings: signal(null),
            getStore: () => of({ discountCodeSupported: true }),
          },
        },
        { provide: ToastService, useValue: toastSpy },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('applyDiscountCode', () => {
    it('should set discountCodeError when code is empty', () => {
      fixture.detectChanges();
      component.discountCode.set('');
      component.applyDiscountCode();
      expect(component.discountCodeError()).toBeTruthy();
    });

    it('should set discountCodeApplied when code is valid and supported', () => {
      fixture.detectChanges();
      component.discountCode.set('SAVE10');
      component.applyDiscountCode();
      expect(component.discountCodeApplied()).toBe(true);
      expect(toastSpy.show).toHaveBeenCalledWith(expect.any(String), 'success');
    });

    it('should clear discountCodeError before applying', () => {
      fixture.detectChanges();
      component.discountCodeError.set('Previous error');
      component.discountCode.set('SAVE10');
      component.applyDiscountCode();
      expect(component.discountCodeError()).toBeNull();
    });
  });

  describe('submit with discount', () => {
    it('should include discountCode in checkout body when applied', () => {
      fixture.detectChanges();
      component.discountCode.set('SAVE10');
      component.applyDiscountCode();
      component.submit();
      expect(checkoutSpy).toHaveBeenCalled();
      const body = checkoutSpy.mock.calls[0][0];
      expect(body.discountCode).toBe('SAVE10');
    });

    it('should NOT include discountCode when not applied', () => {
      fixture.detectChanges();
      component.submit();
      expect(checkoutSpy).toHaveBeenCalled();
      const body = checkoutSpy.mock.calls[0][0];
      expect(body.discountCode).toBeUndefined();
    });

    it('should clear discountCodeApplied and set discountCodeError on 400 discount error', () => {
      checkoutSpy.mockReturnValue(
        throwError(() => ({ status: 400, error: { message: 'Invalid discount code' } }))
      );
      fixture.detectChanges();
      component.discountCode.set('BADCODE');
      component.applyDiscountCode();
      component.submit();
      expect(component.discountCodeApplied()).toBe(false);
      expect(component.discountCodeError()).toBe('Invalid discount code');
    });
  });

  it('should set submitting=true during checkout (double-click prevention)', () => {
    checkoutSpy.mockReturnValue(new Observable(() => {}));
    fixture.detectChanges();
    component.submit();
    expect(component.submitting()).toBe(true);
  });

  it('should set showUpdateCart when checkout returns 400 with out-of-stock message', () => {
    checkoutSpy.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Product X is out of stock' } }))
    );
    fixture.detectChanges();
    component.submit();
    expect(component.showUpdateCart()).toBe(true);
  });

  it('should NOT set showUpdateCart when 400 has non-stock message', () => {
    checkoutSpy.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Invalid shipping method' } }))
    );
    fixture.detectChanges();
    component.submit();
    expect(component.showUpdateCart()).toBe(false);
  });

  describe('business scenarios', () => {
    it('should redirect to order-confirmation on successful checkout', () => {
      const router = TestBed.inject(Router);
      const navSpy = vi.spyOn(router, 'navigate');
      fixture.detectChanges();
      component.submit();
      expect(navSpy).toHaveBeenCalled();
      const call = navSpy.mock.calls[0][0];
      expect(JSON.stringify(call)).toContain('order-confirmation');
    });

    it('should clear cart after successful order', () => {
      fixture.detectChanges();
      component.submit();
      expect(cartClearSpy).toHaveBeenCalled();
    });
  });

  it('should clear error and showUpdateCart when submitting again', () => {
    checkoutSpy.mockReturnValue(
      throwError(() => ({ status: 400, error: { message: 'Product X is out of stock' } }))
    );
    fixture.detectChanges();
    component.submit();
    expect(component.showUpdateCart()).toBe(true);
    checkoutSpy.mockReturnValue(of({ id: 'ord1', items: [], total: 100, status: 'PENDING' }));
    component.submit();
    expect(component.error()).toBeNull();
    expect(component.showUpdateCart()).toBe(false);
  });
});
