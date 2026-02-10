import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { CategoriesService } from '../../core/services/categories.service';
import type { Category } from '../../core/types/api.types';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import type { StoreData, StoreSocialLink } from '../../core/types/api.types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DecimalPipe, RouterLink, RouterLinkActive, TranslatePipe, LocalizedPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
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

  socialLinks = computed<StoreSocialLink[]>(() => {
    const links = this.store()?.socialLinks;
    if (Array.isArray(links)) return links;
    if (links && typeof links === 'object' && !Array.isArray(links)) {
      return Object.entries(links).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    }
    return [];
  });

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
    const url = logoPath ? this.api.imageUrl(logoPath) : null;
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
    this.searchOpen.update((v) => !v);
  }

  toggleLocale(): void {
    this.locale.setLocale(this.currentLocale() === 'ar' ? 'en' : 'ar');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
    if (this.sidebarOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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
    this.router.navigate(['/catalog'], { queryParams: q ? { search: q } : {} });
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
