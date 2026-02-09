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
  limit = computed(() => Math.max(1, this.store()?.newArrivalsLimit ?? 12));

  ngOnInit(): void {
    this.storeService.getStore().subscribe((s) => this.store.set(s));
    this.storeService.getStore().subscribe((s) => {
      const limit = s?.newArrivalsLimit ?? 12;
      this.productsService
        .getProducts({ newArrival: true, limit, status: 'ACTIVE' })
        .subscribe((res) => this.newArrivals.set(res.data));
    });
  }

  currentLocale = computed(() => this.locale.getLocale());

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
