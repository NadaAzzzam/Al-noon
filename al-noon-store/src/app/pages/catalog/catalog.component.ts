import { Component, OnInit, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { getLocalized } from '../../core/utils/localized';
import { PriceFormatPipe } from '../../shared/pipe/price.pipe';
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
  imports: [FormsModule, TranslatePipe, PriceFormatPipe, ProductCardComponent, LoadingSkeletonComponent],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  /** Sort values from GET /api/products/filters/sort – used to validate query param and as fallback options before API loads. */
  private static readonly FALLBACK_SORTS: ProductSort[] = [
    'BEST_SELLING', 'CREATED_DESC', 'PRICE_ASC', 'PRICE_DESC', 'TITLE_ASC', 'TITLE_DESC', 'MANUAL',
  ];
  private static readonly FALLBACK_SORT_OPTIONS: ProductFilterOption[] = [
    { value: 'BEST_SELLING', labelEn: 'Best selling', labelAr: 'الأكثر مبيعاً' },
    { value: 'CREATED_DESC', labelEn: 'Newest', labelAr: 'الأحدث' },
    { value: 'PRICE_ASC', labelEn: 'Price: Low to High', labelAr: 'السعر: منخفض إلى عالي' },
    { value: 'PRICE_DESC', labelEn: 'Price: High to Low', labelAr: 'السعر: عالي إلى منخفض' },
    { value: 'TITLE_ASC', labelEn: 'Name A–Z', labelAr: 'الاسم أ–ي' },
    { value: 'TITLE_DESC', labelEn: 'Name Z–A', labelAr: 'الاسم ي–أ' },
    { value: 'MANUAL', labelEn: 'Manual', labelAr: 'يدوي' },
  ];
  private static readonly FALLBACK_AVAILABILITY: ProductAvailability[] = ['all', 'inStock', 'outOfStock'];
  private static readonly AVAILABILITY_OPTIONS: ProductFilterOption[] = [
    { value: 'all', labelEn: 'All', labelAr: 'الكل' },
    { value: 'inStock', labelEn: 'In stock', labelAr: 'متوفر' },
    { value: 'outOfStock', labelEn: 'Out of stock', labelAr: 'غير متوفر' },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly translate = inject(TranslateService);
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
  sort = signal<ProductSort>('CREATED_DESC');
  availability = signal<ProductAvailability>('all');
  minPrice = signal<number | undefined>(undefined);
  maxPrice = signal<number | undefined>(undefined);
  color = signal<string | undefined>(undefined);
  tags = signal<string | undefined>(undefined);
  newArrival = signal<boolean | undefined>(undefined);
  minRating = signal<number | undefined>(undefined);

  availabilityOptions = signal<ProductFilterOption[]>([]);
  /** Deduplicated by value so options are not shown twice (e.g. when API returns duplicates). */
  availabilityOptionsUnique = computed(() => {
    const opts = this.availabilityOptions();
    const seen = new Set<string>();
    return opts.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  });
  /** Sort options from API; fallback to FALLBACK_SORT_OPTIONS before API loads. */
  sortOptions = signal<ProductFilterOption[]>(CatalogComponent.FALLBACK_SORT_OPTIONS);
  /** Options to show in sort dropdown (API data or fallback), deduplicated by value. */
  sortOptionsForSelect = computed(() => {
    const opts = this.sortOptions();
    const seen = new Set<string>();
    return opts.filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  });
  filtersOpen = signal(false);

  // Collapsible sidebar sections
  sectionOpen: Record<string, boolean> = {
    availability: true,
    category: true,
    price: true,
    color: true,
    rating: true,
  };

  toggleSection(key: string): void {
    this.sectionOpen[key] = !this.sectionOpen[key];
  }

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  /** Parsed tags from URL (?tags=summer,bestseller) as array for display. */
  activeTagsArray = computed(() => {
    const t = this.tags()?.trim();
    if (!t) return [];
    return t.split(',').map((s) => s.trim()).filter(Boolean);
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.categoryId()) count++;
    if (this.availability() !== 'all') count++;
    if (this.minPrice() != null) count++;
    if (this.maxPrice() != null) count++;
    if (this.color()) count++;
    if (this.activeTagsArray().length) count += this.activeTagsArray().length;
    if (this.minRating() != null) count++;
    return count;
  });

  pageNumbers = computed(() => {
    const n = this.totalPages();
    return Array.from({ length: n }, (_, i) => i + 1);
  });

  /** Display name for the active category filter (updates when categories load or locale changes). */
  categoryDisplayName = computed(() => {
    const id = this.categoryId();
    if (!id) return '';
    const cat = this.categories().find((c) => c.id === id || (c as { _id?: string })._id === id);
    if (!cat) return id;
    const lang = this.locale.getLocale();
    const name = cat.name as { en?: string; ar?: string };
    return (name?.[lang] ?? name?.en ?? name?.ar ?? '') || id;
  });

  constructor() {
    effect(() => {
      const s = this.storeService.settings();
      if (s) {
        const lang = this.locale.getLocale();
        const meta = s.seoSettings?.catalogPageMeta;
        const title = meta?.title ? getLocalized(meta.title, lang) : this.translate.instant('catalog.pageTitle');
        const description = meta?.description ? getLocalized(meta.description, lang) : this.translate.instant('catalog.pageDescription');
        this.seo.setPage({ title, description });
      }
    });
    effect(
      () => {
        const qp = this.queryParams();
        this.search.set(typeof qp['search'] === 'string' ? qp['search'].trim() : '');
        this.categoryId.set(qp['category']?.trim() || undefined);
        const sortVal = qp['sort']?.trim();
        const validSort = CatalogComponent.FALLBACK_SORTS.includes(sortVal as ProductSort) ? (sortVal as ProductSort) : 'CREATED_DESC';
        this.sort.set(validSort);
        const avVal = qp['availability']?.trim();
        const validAv = CatalogComponent.FALLBACK_AVAILABILITY.includes(avVal as ProductAvailability) ? (avVal as ProductAvailability) : 'all';
        this.availability.set(validAv);
        const minNum = qp['minPrice'] != null && qp['minPrice'] !== '' ? Number(qp['minPrice']) : NaN;
        this.minPrice.set(Number.isFinite(minNum) && minNum >= 0 ? minNum : undefined);
        const maxNum = qp['maxPrice'] != null && qp['maxPrice'] !== '' ? Number(qp['maxPrice']) : NaN;
        this.maxPrice.set(Number.isFinite(maxNum) && maxNum >= 0 ? maxNum : undefined);
        this.color.set(qp['color']?.trim() || undefined);
        this.tags.set(qp['tags']?.trim() || undefined);
        const newArrivalStr = qp['newArrival']?.trim()?.toLowerCase();
        this.newArrival.set(newArrivalStr === 'true' ? true : newArrivalStr === 'false' ? false : undefined);
        const minRatingNum = qp['minRating'] != null && qp['minRating'] !== '' ? Number(qp['minRating']) : NaN;
        this.minRating.set(Number.isFinite(minRatingNum) && minRatingNum >= 1 && minRatingNum <= 5 ? minRatingNum : undefined);
        const pageNum = qp['page'] != null && qp['page'] !== '' ? Number(qp['page']) : NaN;
        this.page.set(Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1);
        this.loadWithQuery(this.buildQueryFromParams(qp));
      }
    );
  }

  private buildQueryFromParams(qp: Record<string, string>): ProductsQuery {
    const pageNum = qp['page'] != null && qp['page'] !== '' ? Number(qp['page']) : NaN;
    const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;
    const sortVal = qp['sort']?.trim();
    const sort = CatalogComponent.FALLBACK_SORTS.includes(sortVal as ProductSort) ? (sortVal as ProductSort) : 'CREATED_DESC';
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
    const tagsVal = qp['tags']?.trim();
    if (tagsVal) query.tags = tagsVal;
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
    this.categoriesService.getCategories({ status: 'PUBLISHED' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) =>
      this.categories.set(
        Array.isArray(c) ? c.filter((x) => x.status === 'PUBLISHED' || x.status === 'visible') : []
      )
    );
    this.availabilityOptions.set(CatalogComponent.AVAILABILITY_OPTIONS);
    this.productsService.getSortFilters().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((opts) =>
      this.sortOptions.set(Array.isArray(opts) && opts.length > 0 ? opts : CatalogComponent.FALLBACK_SORT_OPTIONS)
    );
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
    const tagsVal = this.tags()?.trim();
    if (tagsVal) query.tags = tagsVal;
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
    const tagsVal = this.tags()?.trim();
    if (tagsVal) qp['tags'] = tagsVal;
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

  /** Remove a single tag from the active tags filter. */
  removeTag(tagToRemove: string): void {
    const arr = this.activeTagsArray().filter((t) => t !== tagToRemove);
    this.tags.set(arr.length ? arr.join(',') : undefined);
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.categoryId.set(undefined);
    this.sort.set('CREATED_DESC');
    this.availability.set('all');
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
    this.color.set(undefined);
    this.tags.set(undefined);
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
