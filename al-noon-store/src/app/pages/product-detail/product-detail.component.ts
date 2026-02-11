import { Component, OnInit, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged, switchMap, take } from 'rxjs/operators';
import { timer } from 'rxjs';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslatePipe } from '@ngx-translate/core';
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
  imports: [TranslatePipe, ProductCardComponent, BreadcrumbComponent, StarRatingComponent, LoadingSkeletonComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly toast = inject(ToastService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  readonly Math = Math;

  /** From GET /api/settings (stockDisplay); fallbacks for when BE does not send. */
  lowStockThreshold = signal(5);
  stockInfoThreshold = signal(10);

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

  /** Variant key for cart (same as used in addToCart). */
  private cartVariantKey = computed(() => {
    const parts = [this.selectedColor(), this.selectedSize()].filter(Boolean);
    return parts.length ? parts.join(' / ') : undefined;
  });

  /** How many of this product+variant are already in the cart. */
  cartQuantityForCurrent = computed(() => {
    this.cart.items(); // dependency so this re-runs when cart changes
    const p = this.product();
    if (!p) return 0;
    return this.cart.getItemQuantity(p.id, this.cartVariantKey());
  });

  /** How many more can be added (stock minus already in cart). */
  remainingCanAdd = computed(() =>
    Math.max(0, this.effectiveStock() - this.cartQuantityForCurrent())
  );

  /** True when add-to-cart should be disabled (quantity exceeded or none left to add). */
  addToCartDisabled = computed(() =>
    this.added() ||
    this.effectiveStock() <= 0 ||
    this.remainingCanAdd() <= 0 ||
    this.quantity() > this.remainingCanAdd()
  );

  constructor() {
    // Clamp quantity when remaining can-add drops (e.g. after adding to cart or cart changed)
    effect(() => {
      const remaining = this.remainingCanAdd();
      const qty = this.quantity();
      if (remaining > 0 && qty > remaining) {
        this.quantity.set(remaining);
      }
    });
  }

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
    // When color is selected, backend returns filtered images array
    // Just use the images array directly as it's already filtered by color
    return p.images ?? [];
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

  /** True when API sends discountPrice and it differs from price. */
  hasSale = computed(() => {
    const p = this.product();
    return p?.discountPrice != null && p.discountPrice !== p.price;
  });

  /** Original (higher) price when on sale. */
  originalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (p.discountPrice == null) return p.price;
    return Math.max(p.price, p.discountPrice);
  });

  /** Current (lower) price when on sale; used for add-to-cart and display. */
  currentPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (p.discountPrice == null) return p.price;
    return Math.min(p.price, p.discountPrice);
  });

  discountPercent = computed(() => {
    const p = this.product();
    if (!p || !this.hasSale()) return 0;
    const orig = this.originalPrice();
    if (orig === 0) return 0;
    return Math.round(((orig - this.currentPrice()) / orig) * 100);
  });

  ngOnInit(): void {
    // From GET /api/settings; fallbacks when BE does not send
    this.storeService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((settings) => {
      const sd = settings?.stockDisplay;
      const low = sd?.lowStockThreshold;
      const info = sd?.stockInfoThreshold;
      this.lowStockThreshold.set(typeof low === 'number' && Number.isFinite(low) ? low : 5);
      this.stockInfoThreshold.set(typeof info === 'number' && Number.isFinite(info) ? info : 10);
    });
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
      price: this.currentPrice(),
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
    if (!p || stock < 1) {
      this.toast.show('This item is out of stock', 'error');
      return;
    }

    const qty = Math.min(this.quantity(), stock);
    const price = this.currentPrice();
    const variant = [this.selectedColor(), this.selectedSize()].filter(Boolean).join(' / ') || undefined;

    // Calculate remaining stock considering what's already in cart
    const currentCartQty = this.cart.getItemQuantity(p.id, variant);
    const totalQtyAfterAdd = currentCartQty + qty;

    // Validate against available stock
    if (totalQtyAfterAdd > stock) {
      const remainingStock = stock - currentCartQty;
      if (remainingStock > 0) {
        this.toast.show(`Only ${remainingStock} more available. You already have ${currentCartQty} in cart.`, 'error');
      } else {
        this.toast.show(`You already have the maximum available quantity (${currentCartQty}) in your cart.`, 'error');
      }
      return;
    }

    const result = this.cart.add({
      productId: p.id,
      quantity: qty,
      price,
      name: this.getLocalized(p.name),
      image: p.images?.[0],
      variant: variant ?? undefined,
    }, stock);

    if (result.success) {
      this.added.set(true);
      this.toast.show(this.getLocalized(p.name) + ' added to cart', 'success');
      // Open cart drawer after adding
      this.cart.openDrawer();
      timer(2000).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.added.set(false));
    } else {
      this.toast.show(result.message || 'Cannot add to cart', 'error');
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
}
