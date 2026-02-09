import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type {
  Product,
  ProductSort,
  ProductAvailability,
  ProductFilterOption,
  ProductsQuery,
} from '../../core/types/api.types';
import type { Category } from '../../core/types/api.types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
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
  /** API: newArrival (string query, e.g. "true") – home page uses true */
  newArrival = signal<boolean | undefined>(undefined);
  /** API: minRating (number 1–5) */
  minRating = signal<number | undefined>(undefined);

  /** From GET /api/products/filters/availability */
  availabilityOptions = signal<ProductFilterOption[]>([]);
  /** From GET /api/products/filters/sort */
  sortOptions = signal<ProductFilterOption[]>([]);

  /** Fallback when filter options haven't loaded yet – so URL params still map correctly on first load */
  private static readonly FALLBACK_SORTS: ProductSort[] = [
    'newest', 'priceAsc', 'priceDesc', 'nameAsc', 'nameDesc', 'bestSelling', 'highestSelling', 'lowSelling',
  ];
  private static readonly FALLBACK_AVAILABILITY: ProductAvailability[] = ['all', 'inStock', 'outOfStock'];

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  constructor() {
    // Effect must only read queryParams() so it runs only when the URL changes.
    // If we called load() here, the effect would also depend on every signal load() reads
    // (search, sort, categoryId, etc.), so typing or changing a select would re-run the effect
    // and overwrite the form with URL values again.
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
        // Build query from URL only and load; do not read filter signals here so effect stays dependent only on queryParams.
        this.loadWithQuery(this.buildQueryFromParams(qp));
      },
      { allowSignalWrites: true }
    );
  }

  /** Build ProductsQuery from URL params only (used inside effect so we don't read filter signals). */
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

  /** Load products with a given query (does not read filter signals). */
  private loadWithQuery(query: ProductsQuery): void {
    this.loading.set(true);
    this.productsService.getProducts(query).subscribe({
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
    // OpenAPI: status=PUBLISHED is alias for visible; filter client-side for both for compatibility
    this.categoriesService.getCategories({ status: 'PUBLISHED' }).subscribe((c) =>
      this.categories.set(
        Array.isArray(c) ? c.filter((x) => x.status === 'PUBLISHED' || x.status === 'visible') : []
      )
    );
    this.productsService.getAvailabilityFilters().subscribe((opts) => this.availabilityOptions.set(opts));
    this.productsService.getSortFilters().subscribe((opts) => this.sortOptions.set(opts));
  }

  /** Load products using current filter signals (e.g. for a refresh). Normal flow: Apply → navigate → effect runs → loadWithQuery. */
  load(): void {
    const query: ProductsQuery = {
      page: this.page(),
      limit: this.limit,
      status: 'ACTIVE',
      sort: this.sort(),
    };
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
    const qp: Record<string, string | number> = {
      page: 1,
      sort: this.sort(),
      availability: this.availability(),
    };
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
    this.router.navigate(['/catalog'], {
      queryParams: { ...this.route.snapshot.queryParams, page: p },
    });
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

  pages(): number[] {
    const n = this.totalPages();
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
