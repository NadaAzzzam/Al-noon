import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type { Product, ProductSort, ProductAvailability, ProductsQuery } from '../../core/types/api.types';
import type { Category } from '../../core/types/api.types';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
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

  /** Must match backend: newest | priceAsc | priceDesc | nameAsc | nameDesc | bestSelling | highestSelling | lowSelling */
  sortOptions: { value: ProductSort; labelEn: string; labelAr: string }[] = [
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
    { value: 'priceAsc', labelEn: 'Price: Low to High', labelAr: 'السعر: منخفض إلى عالي' },
    { value: 'priceDesc', labelEn: 'Price: High to Low', labelAr: 'السعر: عالي إلى منخفض' },
    { value: 'nameAsc', labelEn: 'Name A–Z', labelAr: 'الاسم أ–ي' },
    { value: 'nameDesc', labelEn: 'Name Z–A', labelAr: 'الاسم ي–أ' },
    { value: 'bestSelling', labelEn: 'Best selling', labelAr: 'الأكثر مبيعاً' },
    { value: 'highestSelling', labelEn: 'Highest selling', labelAr: 'الأعلى مبيعاً' },
    { value: 'lowSelling', labelEn: 'Lowest selling', labelAr: 'الأقل مبيعاً' },
  ];

  private static readonly VALID_SORTS: ProductSort[] = [
    'newest', 'priceAsc', 'priceDesc', 'nameAsc', 'nameDesc', 'bestSelling', 'highestSelling', 'lowSelling',
  ];
  private static readonly VALID_AVAILABILITY: ProductAvailability[] = ['all', 'inStock', 'outOfStock'];

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  constructor() {
    effect(() => {
      const qp = this.queryParams();
      this.search.set(typeof qp['search'] === 'string' ? qp['search'].trim() : '');
      this.categoryId.set(qp['category']?.trim() || undefined);
      const sortVal = qp['sort']?.trim();
      this.sort.set(
        CatalogComponent.VALID_SORTS.includes(sortVal as ProductSort) ? (sortVal as ProductSort) : 'newest'
      );
      const avVal = qp['availability']?.trim();
      this.availability.set(
        CatalogComponent.VALID_AVAILABILITY.includes(avVal as ProductAvailability) ? (avVal as ProductAvailability) : 'all'
      );
      const minNum = qp['minPrice'] != null && qp['minPrice'] !== '' ? Number(qp['minPrice']) : NaN;
      this.minPrice.set(Number.isFinite(minNum) && minNum >= 0 ? minNum : undefined);
      const maxNum = qp['maxPrice'] != null && qp['maxPrice'] !== '' ? Number(qp['maxPrice']) : NaN;
      this.maxPrice.set(Number.isFinite(maxNum) && maxNum >= 0 ? maxNum : undefined);
      this.color.set(qp['color']?.trim() || undefined);
      const pageNum = qp['page'] != null && qp['page'] !== '' ? Number(qp['page']) : NaN;
      this.page.set(Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1);
      this.load();
    });
  }

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe((c) =>
      this.categories.set(Array.isArray(c) ? c.filter((x) => x.status === 'PUBLISHED') : [])
    );
  }

  load(): void {
    this.loading.set(true);
    const av = this.availability();
    // Storefront: only ACTIVE products. Backend expects availability: inStock | outOfStock (not "inactive").
    const params: Record<string, unknown> = {
      page: this.page(),
      limit: this.limit,
      status: 'ACTIVE',
      sort: this.sort(),
    };
    if (av === 'inStock' || av === 'outOfStock') params['availability'] = av;
    const search = this.search();
    if (search) params['search'] = search;
    const cat = this.categoryId();
    if (cat) params['category'] = cat;
    const min = this.minPrice();
    const max = this.maxPrice();
    if (min != null && Number.isFinite(min)) params['minPrice'] = min;
    if (max != null && Number.isFinite(max)) params['maxPrice'] = max;
    const col = this.color();
    if (col) params['color'] = col;

    this.productsService.getProducts(params as ProductsQuery).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.total.set(res.pagination?.total ?? 0);
        this.totalPages.set(res.pagination?.totalPages ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters(): void {
    const qp: Record<string, string | number> = {};
    if (this.search()) qp['search'] = this.search();
    if (this.categoryId()) qp['category'] = this.categoryId()!;
    if (this.sort() !== 'newest') qp['sort'] = this.sort();
    if (this.availability() !== 'all') qp['availability'] = this.availability();
    if (this.minPrice() != null) qp['minPrice'] = this.minPrice()!;
    if (this.maxPrice() != null) qp['maxPrice'] = this.maxPrice()!;
    if (this.color()) qp['color'] = this.color()!;
    qp['page'] = 1;
    this.router.navigate(['/catalog'], { queryParams: qp });
  }

  goToPage(p: number): void {
    this.router.navigate(['/catalog'], {
      queryParams: { ...this.route.snapshot.queryParams, page: p },
    });
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
