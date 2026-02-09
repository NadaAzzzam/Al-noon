import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { ProductsService } from '../../core/services/products.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type { StoreData } from '../../core/types/api.types';
import type { Product } from '../../core/types/api.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly productsService = inject(ProductsService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  store = signal<StoreData | null>(null);
  newArrivals = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  limit = computed(() => Math.max(1, this.store()?.newArrivalsLimit ?? 12));
  currentLocale = computed(() => this.locale.getLocale());

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.storeService.getStore().subscribe({
      next: (s) => {
        this.store.set(s);
        const limit = Math.max(1, s?.newArrivalsLimit ?? 12);
        this.productsService
          .getProducts({ newArrival: true, limit, status: 'ACTIVE' })
          .subscribe({
            next: (res) => this.newArrivals.set(res.data ?? []),
            error: () => {
              this.error.set('Failed to load new arrivals.');
              this.loading.set(false);
            },
            complete: () => this.loading.set(false),
          });
      },
      error: () => {
        this.error.set('Failed to load store.');
        this.loading.set(false);
      },
    });
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
