import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import type { StoreData, StoreSocialLink } from '../../core/types/api.types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LocalizedPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly api = inject(ApiService);

  store = signal<StoreData | null>(null);
  cartCount = computed(() => this.cart.count());
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
    this.storeService.getStore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => this.store.set(s));
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
    this.auth.signOut().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {});
  }

  submitSearch(): void {
    this.searchOpen.set(false);
    this.closeSidebar();
    const q = this.searchQuery().trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { search: q } : {} });
  }
}
