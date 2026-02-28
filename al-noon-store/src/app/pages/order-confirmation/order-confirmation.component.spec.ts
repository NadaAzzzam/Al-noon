import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';

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
            queryParams: { subscribe: () => ({ unsubscribe: () => {} }) },
            snapshot: {
              queryParams: {},
              queryParamMap: { get: () => null },
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
});
