import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged, switchMap, take } from 'rxjs/operators';
import { timer } from 'rxjs';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import type { Product, ProductAvailabilityColor, ProductAvailabilitySize, FormattedDetails } from '../../core/types/api.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, ProductCardComponent, BreadcrumbComponent, StarRatingComponent, LoadingSkeletonComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly toast = inject(ToastService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  readonly Math = Math;

  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  selectedImageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);
  quantity = signal(1);
  added = signal(false);
  loadingColor = signal(false);

  /** Effective stock: selected variant stock when both color and size match, else global product.stock. */
  effectiveStock = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const av = p.availability;
    const color = this.selectedColor();
    const size = this.selectedSize();
    if (av?.variants?.length && color != null && size != null) {
      const v = av.variants.find((x) => x.color === color && x.size === size);
      if (v) return v.outOfStock ? 0 : v.stock;
    }
    return p.stock;
  });

  /** Formatted details blocks for current locale (or fallback to plain details). */
  detailBlocks = computed(() => {
    const p = this.product();
    if (!p) return null;
    const fd = p.formattedDetails as FormattedDetails | undefined;
    const lang = this.locale.getLocale();
    const blocks = fd?.[lang] ?? fd?.['en'] ?? null;
    return blocks ?? null;
  });

  isColorOutOfStock = (color: string): boolean => {
    const p = this.product();
    const info = p?.availability?.colors?.find((c) => c.color === color);
    return info?.outOfStock ?? false;
  };

  isSizeOutOfStock = (size: string): boolean => {
    const p = this.product();
    const info = p?.availability?.sizes?.find((s) => s.size === size);
    return info?.outOfStock ?? false;
  };

  /** Image URLs only (for backward compatibility). */
  images = computed(() => {
    const p = this.product();
    if (!p) return [];
    const list = p.images ?? [];
    const byColor = p.imageColors?.map((c) => (typeof c === 'string' ? c : (c as { imageUrl?: string }).imageUrl)).filter(Boolean) as string[] | undefined;
    return byColor?.length ? byColor : list;
  });

  /** Gallery items: images first, then videos (each { type, url }) so we can show both in the gallery. */
  galleryItems = computed(() => {
    const p = this.product();
    if (!p) return [] as { type: 'image' | 'video'; url: string }[];
    const imgs = this.images();
    const items: { type: 'image' | 'video'; url: string }[] = imgs.map((url) => ({ type: 'image' as const, url }));
    const videos = p.videos ?? [];
    videos.forEach((url) => items.push({ type: 'video', url }));
    return items;
  });

  currentPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;
  });

  discountPercent = computed(() => {
    const p = this.product();
    if (!p || p.discountPrice == null || p.discountPrice >= p.price || p.price === 0) return 0;
    return Math.round(((p.price - p.discountPrice) / p.price) * 100);
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(p => p.get('id')),
      distinctUntilChanged(),
      switchMap(id => {
        this.product.set(null);
        this.related.set([]);
        this.selectedImageIndex.set(0);
        this.selectedSize.set(null);
        this.selectedColor.set(null);
        this.quantity.set(1);
        if (!id || id === 'undefined' || id === '') return [];
        this.productsService.getRelated(id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe((list) => this.related.set(list));
        return this.productsService.getProduct(id);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => {
        this.product.set(p);
        this.updateProductMeta(p);
      },
      error: () => this.product.set(null),
    });
  }

  private updateProductMeta(p: Product | null): void {
    if (!p) return;
    const name = this.getLocalized(p.name);
    const desc = this.getLocalized(p.description);
    this.seo.setPage({ title: name, description: desc?.slice(0, 160), type: 'product' });
    this.seo.setProductJsonLd({
      name,
      description: desc,
      image: p.images?.[0] ? this.api.imageUrl(p.images[0]) : undefined,
      price: p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      averageRating: p.averageRating ?? undefined,
      ratingCount: p.ratingCount ?? undefined,
    });
  }

  /** Select color and fetch product with color-specific images (GET ?color=...). */
  selectColor(color: string): void {
    if (this.isColorOutOfStock(color)) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.selectedColor.set(color);
    this.loadingColor.set(true);
    this.productsService.getProduct(id, { color: color }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => {
        this.product.set(p);
        this.selectedImageIndex.set(0);
        this.loadingColor.set(false);
      },
      error: () => this.loadingColor.set(false),
    });
  }

  addToCart(): void {
    const p = this.product();
    const stock = this.effectiveStock();
    if (!p || stock < 1) return;
    const qty = Math.min(this.quantity(), stock);
    const price = this.currentPrice();
    const variant = [this.selectedColor(), this.selectedSize()].filter(Boolean).join(' / ') || undefined;
    this.cart.add({
      productId: p.id,
      quantity: qty,
      price,
      name: this.getLocalized(p.name),
      image: p.images?.[0],
      variant: variant ?? undefined,
    });
    this.added.set(true);
    this.toast.show(this.getLocalized(p.name) + ' added to cart', 'success');
    // Open cart drawer after adding
    this.cart.openDrawer();
    timer(2000).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.added.set(false));
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
}
