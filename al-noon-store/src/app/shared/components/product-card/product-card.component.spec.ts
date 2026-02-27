import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProductCardComponent } from './product-card.component';
import { ApiService } from '../../../core/services/api.service';
import { LocaleService } from '../../../core/services/locale.service';
import type { Product } from '../../../core/types/api.types';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: '1',
    name: { en: 'Test Product', ar: 'منتج' },
    price: 100,
    images: ['https://example.com/img.jpg'],
    stock: 5,
  } as Product;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', mockProduct);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display product name', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Test Product');
  });

  it('should have link to product detail', () => {
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/product/1"]');
    expect(link).toBeTruthy();
  });
});
