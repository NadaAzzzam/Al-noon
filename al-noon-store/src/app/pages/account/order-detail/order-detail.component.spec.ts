import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
import { OrdersService } from '../../../core/services/orders.service';
import { ApiService } from '../../../core/services/api.service';
import { LocaleService } from '../../../core/services/locale.service';

const mockOrder = { id: '1', items: [], total: 100, status: 'PENDING' };

describe('OrderDetailComponent', () => {
  let fixture: ComponentFixture<OrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', '1']]) } } },
        { provide: OrdersService, useValue: { getOrder: () => of(mockOrder) } },
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OrderDetailComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
