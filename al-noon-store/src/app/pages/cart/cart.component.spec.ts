import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { signal, computed } from '@angular/core';
import { CartComponent } from './cart.component';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartSpy: { items: ReturnType<typeof signal>; subtotal: ReturnType<typeof computed>; setQuantity: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    cartSpy = {
      items: signal([]),
      subtotal: computed(() => 0),
      setQuantity: vi.fn(),
      remove: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CartComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        ApiService,
        { provide: CartService, useValue: cartSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should call cart.remove when remove is invoked', () => {
    component.remove('p1');
    expect(cartSpy.remove).toHaveBeenCalledWith('p1', undefined);
  });

  it('should call cart.setQuantity when updateQty is invoked', () => {
    component.updateQty('p1', 2);
    expect(cartSpy.setQuantity).toHaveBeenCalledWith('p1', 2, undefined);
  });
});
