import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { HomeComponent } from './home.component';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import type { Product } from '../../core/types/api.types';

const mockProduct = {
  id: '1',
  name: { en: 'Product', ar: 'منتج' },
  price: 100,
  images: [] as string[],
  stock: 5,
  status: 'PUBLISHED',
} as Product;

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let storeMock: { getStore: ReturnType<typeof vi.fn>; settings: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storeMock = {
      getStore: vi.fn().mockReturnValue(
        of({
          storeName: { en: 'Store' },
          hero: { images: ['/a.jpg', '/b.jpg'] },
          newArrivals: [mockProduct],
        })
      ),
      settings: vi.fn().mockReturnValue({ seoSettings: null }),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        ApiService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: SeoService, useValue: { setPage: vi.fn() } },
        { provide: StoreService, useValue: storeMock },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('en');
    translate.use('en');

    fixture = TestBed.createComponent(HomeComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call getStore on init', () => {
    fixture.detectChanges();
    expect(storeMock.getStore).toHaveBeenCalled();
  });

  it('should advance hero image on nextHeroImage', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.heroImageIndex()).toBe(0);
    comp.nextHeroImage();
    expect(comp.heroImageIndex()).toBe(1);
    comp.nextHeroImage();
    expect(comp.heroImageIndex()).toBe(0); // wrap
  });

  it('should go back on prevHeroImage', () => {
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.heroImageIndex.set(1);
    comp.prevHeroImage();
    expect(comp.heroImageIndex()).toBe(0);
    comp.prevHeroImage();
    expect(comp.heroImageIndex()).toBe(1); // wrap from 0
  });

  it('should scroll slider', () => {
    fixture.detectChanges();
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 100, writable: false });
    el.scrollBy = vi.fn();
    fixture.componentInstance.scrollSlider(el, 'right');
    expect(el.scrollBy).toHaveBeenCalledWith({ left: 80, behavior: 'smooth' });
    fixture.componentInstance.scrollSlider(el, 'left');
    expect(el.scrollBy).toHaveBeenCalledWith({ left: -80, behavior: 'smooth' });
  });

  it('should get collection query params from categoryId', () => {
    fixture.detectChanges();
    const params = fixture.componentInstance.getCollectionQueryParams({ url: '/x', categoryId: 'cat-1' });
    expect(params).toEqual({ category: 'cat-1' });
  });

  it('should get collection query params from category in url', () => {
    fixture.detectChanges();
    const params = fixture.componentInstance.getCollectionQueryParams({
      url: '/catalog?category=abayas',
      categoryId: '',
    });
    expect(params).toEqual({ category: 'abayas' });
  });

  it('should set error on getStore failure', () => {
    storeMock.getStore.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Failed to load store.');
  });

  it('should clear hero interval on destroy', () => {
    fixture.detectChanges();
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    fixture.destroy();
    expect(clearSpy).toHaveBeenCalled();
  });
});
