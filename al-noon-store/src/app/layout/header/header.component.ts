import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { CategoriesService } from '../../core/services/categories.service';
import type { Category } from '../../core/types/api.types';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import { PriceFormatPipe } from '../../shared/pipe/price.pipe';
import type { StoreData, StoreSocialLink } from '../../core/types/api.types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, LocalizedPipe, PriceFormatPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  readonly api = inject(ApiService);
  private readonly categoriesService = inject(CategoriesService);

  store = signal<StoreData | null>(null);
  categories = signal<Category[]>([]);
  shopCollectionExpanded = signal(true);
  cartCount = computed(() => this.cart.count());
  cartItems = this.cart.items;
  cartSubtotal = this.cart.subtotal;
  cartDrawerOpen = this.cart.drawerOpen;
  isLoggedIn = computed(() => this.auth.isLoggedIn());
  currentLocale = computed(() => this.locale.getLocale());
  searchOpen = signal(false);
  searchQuery = signal('');
  sidebarOpen = signal(false);

  /** When false, hide social links. From settings() signal; default true when not set. */
  showSocialLinksFromSettings = computed(() => this.storeService.settings()?.showSocialLinks ?? null);
  /** Social links from settings() (fallback when store has none). */
  socialLinksFromSettings = computed(() => this.storeService.settings()?.socialLinks ?? null);

  socialLinks = computed<StoreSocialLink[]>(() => {
    const fromStore = this.store()?.socialLinks;
    let storeList: StoreSocialLink[] = [];
    if (Array.isArray(fromStore)) storeList = fromStore;
    else if (fromStore && typeof fromStore === 'object')
      storeList = Object.entries(fromStore).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    if (storeList.length > 0) return storeList;
    const fromSettings = this.socialLinksFromSettings();
    if (fromSettings && typeof fromSettings === 'object')
      return Object.entries(fromSettings).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    return [];
  });

  showSocialSection = computed(
    () => (this.showSocialLinksFromSettings() !== false) && this.socialLinks().length > 0
  );

  ngOnInit(): void {
    this.storeService.getStore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
      this.store.set(s);
      this.updateFavicon(s?.logo);
    });
    this.categoriesService.getCategories({ status: 'PUBLISHED' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) =>
      this.categories.set(c)
    );
  }

  toggleShopCollection(): void {
    this.shopCollectionExpanded.update((v) => !v);
  }

  private updateFavicon(logoPath: string | undefined | null): void {
    const path = logoPath ?? 'uploads/logos/default-logo.png';
    const url = this.api.imageUrl(path) || null;
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (url) {
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'icon');
        link.setAttribute('type', 'image/x-icon');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }
  }

  toggleSearch(): void {
    const willOpen = !this.searchOpen();
    if (willOpen) {
      const searchFromUrl = this.route.snapshot.queryParams['search'];
      if (typeof searchFromUrl === 'string' && searchFromUrl.trim()) {
        this.searchQuery.set(searchFromUrl.trim());
      }
    }
    this.searchOpen.update((v) => !v);
  }

  toggleLocale(): void {
    this.locale.setLocale(this.currentLocale() === 'ar' ? 'en' : 'ar');
  }

  toggleSidebar(): void {
    const willOpen = !this.sidebarOpen();
    if (willOpen) {
      const searchFromUrl = this.route.snapshot.queryParams['search'];
      if (typeof searchFromUrl === 'string' && searchFromUrl.trim()) {
        this.searchQuery.set(searchFromUrl.trim());
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
    document.body.style.overflow = '';
  }

  signOut(): void {
    this.auth.signOut().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { });
  }

  submitSearch(): void {
    this.searchOpen.set(false);
    this.closeSidebar();
    const q = this.searchQuery().trim();
    const currentParams = { ...this.route.snapshot.queryParams };
    if (q) {
      currentParams['search'] = q;
      currentParams['page'] = '1';
    } else {
      delete currentParams['search'];
    }
    this.router.navigate(['/catalog'], { queryParams: currentParams, queryParamsHandling: '' });
  }

  /** Cart drawer methods */
  openCartDrawer(): void {
    this.cart.openDrawer();
  }

  closeCartDrawer(): void {
    this.cart.closeDrawer();
  }

  updateCartQty(productId: string, qty: number, variant?: string): void {
    this.cart.setQuantity(productId, qty, variant);
  }

  removeCartItem(productId: string, variant?: string): void {
    this.cart.remove(productId, variant);
  }

  goToCheckout(): void {
    this.cart.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
