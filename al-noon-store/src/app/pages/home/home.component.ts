import { Component, OnInit, OnDestroy, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { getLocalized } from '../../core/utils/localized';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import type { StoreData, Product } from '../../core/types/api.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe, ProductCardComponent, LoadingSkeletonComponent, StarRatingComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  store = signal<StoreData | null>(null);
  newArrivals = signal<Product[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  heroImageIndex = signal(0);

  currentLocale = computed(() => this.locale.getLocale());
  heroImages = computed(() => this.store()?.hero?.images ?? []);

  // Slider state
  arrivalsScrollLeft = signal(0);
  testimonialsScrollLeft = signal(0);

  private heroInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const s = this.storeService.settings();
      if (!s) return;
      const lang = this.locale.getLocale();
      const meta = s.seoSettings?.homePageMeta;
      const title = meta?.title ? getLocalized(meta.title, lang) : this.translate.instant('home.pageTitle');
      const description = meta?.description ? getLocalized(meta.description, lang) : this.translate.instant('home.pageDescription');
      this.seo.setPage({ title, description });
    });
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.storeService.getStore().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (s) => {
        this.store.set(s);
        this.newArrivals.set(s?.newArrivals ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load store.');
        this.loading.set(false);
      },
    });

    // Auto-advance hero
    this.heroInterval = setInterval(() => this.nextHeroImage(), 5000);
  }

  ngOnDestroy(): void {
    if (this.heroInterval) clearInterval(this.heroInterval);
  }

  nextHeroImage(): void {
    const imgs = this.heroImages();
    if (imgs.length > 1) {
      this.heroImageIndex.update((i) => (i + 1) % imgs.length);
    }
  }

  prevHeroImage(): void {
    const imgs = this.heroImages();
    if (imgs.length > 1) {
      this.heroImageIndex.update((i) => (i - 1 + imgs.length) % imgs.length);
    }
  }

  scrollSlider(container: HTMLElement, direction: 'left' | 'right'): void {
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  /** Query params for collection link so catalog filters by category (avoids URL encoding issues). */
  getCollectionQueryParams(col: { url: string; categoryId?: string }): { category?: string } {
    if (col.categoryId?.trim()) return { category: col.categoryId.trim() };
    const url = col.url?.trim();
    if (url?.includes('category=')) {
      const match = /[?&]category=([^&]+)/.exec(url);
      if (match?.[1]) return { category: decodeURIComponent(match[1]) };
    }
    return {};
  }
}
