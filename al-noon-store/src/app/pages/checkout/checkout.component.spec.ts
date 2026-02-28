import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { signal } from '@angular/core';
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

vi.mock('../../../environments/environment', () => ({
  environment: { discountCodeSupported: true },
}));

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
let toastSpy: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    toastSpy = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: { items: signal([]), getItemsForOrder: () => [], specialInstructions: signal(''), clear: vi.fn() } },
        { provide: OrdersService, useValue: { checkout: () => of({ id: '1', items: [], total: 0, status: 'PENDING' }) } },
        { provide: CitiesService, useValue: { getCities: () => of([]) } },
        { provide: ShippingService, useValue: { getShippingMethods: () => of([]) } },
        { provide: PaymentMethodsService, useValue: { getPaymentMethods: () => of([]) } },
        { provide: ApiService, useValue: { imageUrl: (p: string) => p } },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: AuthService, useValue: { user: signal(null), isLoggedIn: () => false } },
        {
          provide: StoreService,
          useValue: {
            settings: signal(null),
            getStore: () => of(null),
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
});
