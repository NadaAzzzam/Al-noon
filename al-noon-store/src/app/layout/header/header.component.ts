import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import type { StoreData } from '../../core/types/api.types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, LocalizedPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly locale = inject(LocaleService);
  private readonly router = inject(Router);
  readonly api = inject(ApiService);

  store = signal<StoreData | null>(null);
  cartCount = computed(() => this.cart.count());
  isLoggedIn = computed(() => this.auth.isLoggedIn());
  currentLocale = computed(() => this.locale.getLocale());
  searchOpen = signal(false);
  searchQuery = signal('');

  ngOnInit(): void {
    this.storeService.getStore().subscribe((s) => this.store.set(s));
    if (typeof document !== 'undefined')
      document.documentElement.dir = this.locale.getLocale() === 'ar' ? 'rtl' : 'ltr';
  }

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
  }

  toggleLocale(): void {
    this.locale.setLocale(this.currentLocale() === 'ar' ? 'en' : 'ar');
  }

  signOut(): void {
    this.auth.signOut().subscribe(() => {});
  }

  submitSearch(): void {
    this.searchOpen.set(false);
    const q = this.searchQuery().trim();
    this.router.navigate(['/catalog'], { queryParams: q ? { search: q } : {} });
  }
}
