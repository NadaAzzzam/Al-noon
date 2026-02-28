import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { OrdersService } from '../../../core/services/orders.service';
import { LocaleService } from '../../../core/services/locale.service';

describe('OrdersComponent', () => {
  let fixture: ComponentFixture<OrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: OrdersService, useValue: { getOrders: () => of({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } }) } },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OrdersComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
