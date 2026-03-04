import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { StoreService } from '../../core/services/store.service';
import { FaviconService } from '../../core/services/favicon.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPathService } from '../../core/services/localized-path.service';
import { ApiService } from '../../core/services/api.service';
import { CategoriesService } from '../../core/services/categories.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let storeMock: { getStore: ReturnType<typeof vi.fn>; settings: ReturnType<typeof vi.fn> };
  let categoriesMock: { getCategories: ReturnType<typeof vi.fn> };
  let faviconMock: { setFavicon: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    faviconMock = { setFavicon: vi.fn() };
    storeMock = {
      getStore: vi.fn().mockReturnValue(of({ storeName: { en: 'Test Store' }, logo: null })),
      settings: vi.fn().mockReturnValue({}),
    };
    categoriesMock = {
      getCategories: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
        { provide: StoreService, useValue: storeMock },
        { provide: FaviconService, useValue: faviconMock },
        { provide: AuthService, useValue: { isLoggedIn: () => false, signOut: () => of(void 0) } },
        CartService,
        { provide: LocaleService, useValue: { getLocale: () => 'en', lang: () => 'en' } },
        { provide: LocalizedPathService, useValue: { path: (...p: string[]) => (p.length ? `/${p.join('/')}` : '/en'), toUrl: (u: string) => u } },
        { provide: ApiService, useValue: { imageUrl: (p: string) => (p ? `/api/img/${p}` : '') } },
        { provide: CategoriesService, useValue: categoriesMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should fetch store and categories on init', () => {
    fixture.detectChanges();
    expect(storeMock.getStore).toHaveBeenCalled();
    expect(categoriesMock.getCategories).toHaveBeenCalledWith({ status: 'PUBLISHED' });
  });

  it('should set favicon from store logo on init', () => {
    fixture.detectChanges();
    expect(faviconMock.setFavicon).toHaveBeenCalledWith(null);
  });

  it('should set favicon to store logo when getStore emits logo', () => {
    storeMock.getStore.mockReturnValue(of({ storeName: { en: 'Store' }, logo: 'uploads/logos/logo.png' }));
    fixture.detectChanges();
    expect(faviconMock.setFavicon).toHaveBeenCalledWith('uploads/logos/logo.png');
  });

  it('should toggle shop collection', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.shopCollectionExpanded()).toBe(true);
    fixture.componentInstance.toggleShopCollection();
    expect(fixture.componentInstance.shopCollectionExpanded()).toBe(false);
  });

  it('should toggle search', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.searchOpen()).toBe(false);
    fixture.componentInstance.toggleSearch();
    expect(fixture.componentInstance.searchOpen()).toBe(true);
  });

  it('should toggle sidebar', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
    fixture.componentInstance.toggleSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
  });

  it('should close sidebar', () => {
    fixture.componentInstance.sidebarOpen.set(true);
    document.body.style.overflow = 'hidden';
    fixture.componentInstance.closeSidebar();
    expect(fixture.componentInstance.sidebarOpen()).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('should open and close cart drawer', () => {
    fixture.detectChanges();
    fixture.componentInstance.openCartDrawer();
    expect(fixture.componentInstance.cartDrawerOpen()).toBe(true);
    fixture.componentInstance.closeCartDrawer();
    expect(fixture.componentInstance.cartDrawerOpen()).toBe(false);
  });
});
