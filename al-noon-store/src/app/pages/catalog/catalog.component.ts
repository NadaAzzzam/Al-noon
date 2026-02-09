import { Component, OnInit, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslateModule } from '@ngx-translate/core';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import type {
  Product,
  ProductSort,
  ProductAvailability,
  ProductFilterOption,
  ProductsQuery,
  Category,
} from '../../core/types/api.types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProductCardComponent, LoadingSkeletonComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  total = signal(0);
  totalPages = signal(0);
  page = signal(1);
  readonly limit = 12;
  loading = signal(false);

  search = signal('');
  categoryId = signal<string | undefined>(undefined);
  sort = signal<ProductSort>('newest');
  availability = signal<ProductAvailability>('all');
  minPrice = signal<number | undefined>(undefined);
  maxPrice = signal<number | undefined>(undefined);
  color = signal<string | undefined>(undefined);
  newArrival = signal<boolean | undefined>(undefined);
  minRating = signal<number | undefined>(undefined);

  availabilityOptions = signal<ProductFilterOption[]>([]);
  sortOptions = signal<ProductFilterOption[]>([]);
  filtersOpen = signal(false);

  private static readonly FALLBACK_SORTS: ProductSort[] = [
    'newest', 'priceAsc', 'priceDesc', 'nameAsc', 'nameDesc', 'bestSelling', 'highestSelling', 'lowSelling',
  ];
  private static readonly FALLBACK_AVAILABILITY: ProductAvailability[] = ['all', 'inStock', 'outOfStock'];

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.categoryId()) count++;
    if (this.availability() !== 'all') count++;
    if (this.minPrice() != null) count++;
    if (this.maxPrice() != null) count++;
    if (this.color()) count++;
    if (this.minRating() != null) count++;
    return count;
  });

  pageNumbers = computed(() => {
    const n = this.totalPages();
    return Array.from({ length: n }, (_, i) => i + 1);
  });

  constructor() {
    effect(
      () => {
        const qp = this.queryParams();
        this.search.set(typeof qp['search'] === 'string' ? qp['search'].trim() : '');
        this.categoryId.set(qp['category']?.trim() || undefined);
        const sortVal = qp['sort']?.trim();
        const validSort = CatalogComponent.FALLBACK_SORTS.includes(sortVal as ProductSort) ? (sortVal as ProductSort) : 'newest';
        this.sort.set(validSort);
        const avVal = qp['availability']?.trim();
        const validAv = CatalogComponent.FALLBACK_AVAILABILITY.includes(avVal as ProductAvailability) ? (avVal as ProductAvailability) : 'all';
        this.availability.set(validAv);
        const minNum = qp['minPrice'] != null && qp['minPrice'] !== '' ? Number(qp['minPrice']) : NaN;
        this.minPrice.set(Number.isFinite(minNum) && minNum >= 0 ? minNum : undefined);
        const maxNum = qp['maxPrice'] != null && qp['maxPrice'] !== '' ? Number(qp['maxPrice']) : NaN;
        this.maxPrice.set(Number.isFinite(maxNum) && maxNum >= 0 ? maxNum : undefined);
        this.color.set(qp['color']?.trim() || undefined);
        const newArrivalStr = qp['newArrival']?.trim()?.toLowerCase();
        this.newArrival.set(newArrivalStr === 'true' ? true : newArrivalStr === 'false' ? false : undefined);
        const minRatingNum = qp['minRating'] != null && qp['minRating'] !== '' ? Number(qp['minRating']) : NaN;
        this.minRating.set(Number.isFinite(minRatingNum) && minRatingNum >= 1 && minRatingNum <= 5 ? minRatingNum : undefined);
        const pageNum = qp['page'] != null && qp['page'] !== '' ? Number(qp['page']) : NaN;
        this.page.set(Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1);
        this.loadWithQuery(this.buildQueryFromParams(qp));
      },
      { allowSignalWrites: true }
    );
  }

  private buildQueryFromParams(qp: Record<string, string>): ProductsQuery {
    const pageNum = qp['page'] != null && qp['page'] !== '' ? Number(qp['page']) : NaN;
    const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;
    const sortVal = qp['sort']?.trim();
    const sort = CatalogComponent.FALLBACK_SORTS.includes(sortVal as ProductSort) ? (sortVal as ProductSort) : 'newest';
    const avVal = qp['availability']?.trim();
    const availability = CatalogComponent.FALLBACK_AVAILABILITY.includes(avVal as ProductAvailability) ? (avVal as ProductAvailability) : 'all';
    const query: ProductsQuery = { page, limit: this.limit, status: 'ACTIVE', sort };
    const cat = qp['category']?.trim();
    if (cat) query.category = cat;
    const searchVal = typeof qp['search'] === 'string' ? qp['search'].trim() : '';
    if (searchVal) query.search = searchVal;
    if (availability === 'inStock' || availability === 'outOfStock') query.availability = availability;
    const newArrivalStr = qp['newArrival']?.trim()?.toLowerCase();
    if (newArrivalStr === 'true') query.newArrival = true;
    else if (newArrivalStr === 'false') query.newArrival = false;
    const minNum = qp['minPrice'] != null && qp['minPrice'] !== '' ? Number(qp['minPrice']) : NaN;
    if (Number.isFinite(minNum) && minNum >= 0) query.minPrice = minNum;
    const maxNum = qp['maxPrice'] != null && qp['maxPrice'] !== '' ? Number(qp['maxPrice']) : NaN;
    if (Number.isFinite(maxNum) && maxNum >= 0) query.maxPrice = maxNum;
    const col = qp['color']?.trim();
    if (col) query.color = col;
    const minRatingNum = qp['minRating'] != null && qp['minRating'] !== '' ? Number(qp['minRating']) : NaN;
    if (Number.isFinite(minRatingNum) && minRatingNum >= 1 && minRatingNum <= 5) query.minRating = minRatingNum;
    return query;
  }

  private loadWithQuery(query: ProductsQuery): void {
    this.loading.set(true);
    this.productsService.getProducts(query).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.total.set(res.pagination?.total ?? 0);
        this.totalPages.set(res.pagination?.totalPages ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnInit(): void {
    this.seo.setPage({ title: 'Shop', description: 'Browse our full catalog of products. Filter by category, price, and more.' });
    this.categoriesService.getCategories({ status: 'PUBLISHED' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) =>
      this.categories.set(
        Array.isArray(c) ? c.filter((x) => x.status === 'PUBLISHED' || x.status === 'visible') : []
      )
    );
    this.productsService.getAvailabilityFilters().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((opts) => this.availabilityOptions.set(opts));
    this.productsService.getSortFilters().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((opts) => this.sortOptions.set(opts));
  }

  load(): void {
    const query: ProductsQuery = { page: this.page(), limit: this.limit, status: 'ACTIVE', sort: this.sort() };
    const cat = this.categoryId();
    if (cat) query.category = cat;
    const searchVal = this.search()?.trim();
    if (searchVal) query.search = searchVal;
    const av = this.availability();
    if (av === 'inStock' || av === 'outOfStock') query.availability = av;
    const newArr = this.newArrival();
    if (newArr === true || newArr === false) query.newArrival = newArr;
    const min = this.minPrice();
    if (min != null && Number.isFinite(min) && min >= 0) query.minPrice = min;
    const max = this.maxPrice();
    if (max != null && Number.isFinite(max) && max >= 0) query.maxPrice = max;
    const col = this.color()?.trim();
    if (col) query.color = col;
    const rating = this.minRating();
    if (rating != null && Number.isFinite(rating) && rating >= 1 && rating <= 5) query.minRating = rating;
    this.loadWithQuery(query);
  }

  applyFilters(): void {
    this.filtersOpen.set(false);
    const qp: Record<string, string | number> = { page: 1, sort: this.sort(), availability: this.availability() };
    const searchVal = this.search()?.trim();
    if (searchVal) qp['search'] = searchVal;
    const cat = this.categoryId();
    if (cat) qp['category'] = cat;
    if (this.minPrice() != null && Number.isFinite(this.minPrice()!)) qp['minPrice'] = this.minPrice()!;
    if (this.maxPrice() != null && Number.isFinite(this.maxPrice()!)) qp['maxPrice'] = this.maxPrice()!;
    const col = this.color()?.trim();
    if (col) qp['color'] = col;
    const newArr = this.newArrival();
    if (newArr === true) qp['newArrival'] = 'true';
    else if (newArr === false) qp['newArrival'] = 'false';
    const rating = this.minRating();
    if (rating != null && Number.isFinite(rating) && rating >= 1 && rating <= 5) qp['minRating'] = rating;
    this.router.navigate(['/catalog'], { queryParams: qp, queryParamsHandling: '' });
  }

  goToPage(p: number): void {
    this.router.navigate(['/catalog'], { queryParams: { ...this.route.snapshot.queryParams, page: p } });
  }

  removeFilter(key: string): void {
    switch (key) {
      case 'search': this.search.set(''); break;
      case 'category': this.categoryId.set(undefined); break;
      case 'availability': this.availability.set('all'); break;
      case 'minPrice': this.minPrice.set(undefined); break;
      case 'maxPrice': this.maxPrice.set(undefined); break;
      case 'color': this.color.set(undefined); break;
      case 'minRating': this.minRating.set(undefined); break;
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryId.set(undefined);
    this.sort.set('newest');
    this.availability.set('all');
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.color.set(undefined);
    this.minRating.set(undefined);
    this.newArrival.set(undefined);
    this.router.navigate(['/catalog'], { queryParams: { page: 1 } });
  }

  toggleFilters(): void {
    this.filtersOpen.update((v) => !v);
  }

  getCategoryName(id: string): string {
    const cat = this.categories().find((c) => c.id === id);
    return cat ? this.getLocalized(cat.name) : id;
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
