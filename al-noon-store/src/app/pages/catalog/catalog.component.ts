import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type { Product, ProductSort, ProductAvailability } from '../../core/types/api.types';
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

  sortOptions: { value: ProductSort; labelEn: string; labelAr: string }[] = [
    { value: 'newest', labelEn: 'Newest', labelAr: 'الأحدث' },
    { value: 'priceAsc', labelEn: 'Price: Low to High', labelAr: 'السعر: منخفض إلى عالي' },
    { value: 'priceDesc', labelEn: 'Price: High to Low', labelAr: 'السعر: عالي إلى منخفض' },
    { value: 'nameAsc', labelEn: 'Name A–Z', labelAr: 'الاسم أ–ي' },
    { value: 'nameDesc', labelEn: 'Name Z–A', labelAr: 'الاسم ي–أ' },
  ];

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} as Record<string, string> });

  constructor() {
    effect(() => {
      const qp = this.queryParams();
      this.search.set(qp['search'] ?? '');
      this.categoryId.set(qp['category'] || undefined);
      this.sort.set((qp['sort'] as ProductSort) || 'newest');
      this.availability.set((qp['availability'] as ProductAvailability) || 'all');
      this.minPrice.set(qp['minPrice'] ? Number(qp['minPrice']) : undefined);
      this.maxPrice.set(qp['maxPrice'] ? Number(qp['maxPrice']) : undefined);
      this.color.set(qp['color'] || undefined);
      this.page.set(qp['page'] ? Number(qp['page']) : 1);
      this.load();
    });
  }

  ngOnInit(): void {
    this.categoriesService.getCategories().subscribe((c) =>
      this.categories.set(Array.isArray(c) ? c.filter((x) => x.status === 'visible') : [])
    );
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, unknown> = {
      page: this.page(),
      limit: this.limit,
      status: 'ACTIVE',
      sort: this.sort(),
      availability: this.availability(),
    };
    const search = this.search();
    if (search) params['search'] = search;
    const cat = this.categoryId();
    if (cat) params['category'] = cat;
    const min = this.minPrice();
    if (min != null) params['minPrice'] = min;
    const max = this.maxPrice();
    if (max != null) params['maxPrice'] = max;
    const col = this.color();
    if (col) params['color'] = col;

    this.productsService.getProducts(params).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.total.set(res.pagination.total);
        this.totalPages.set(res.pagination.totalPages);
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
