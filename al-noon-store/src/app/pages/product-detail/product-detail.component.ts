import { Component, OnInit, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef, ViewChild, ElementRef, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, distinctUntilChanged, switchMap, take } from 'rxjs/operators';
import { timer, of } from 'rxjs';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { StoreService } from '../../core/services/store.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslatePipe } from '@ngx-translate/core';
import { PriceFormatPipe } from '../../shared/pipe/price.pipe';
import { SanitizeHtmlPipe } from '../../shared/pipe/sanitize-html.pipe';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { StarRatingComponent } from '../../shared/components/star-rating/star-rating.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { SeoService } from '../../core/services/seo.service';
import { ToastService } from '../../core/services/toast.service';
import type { Product, FormattedDetails, FormattedDetailBlock } from '../../core/types/api.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [TranslatePipe, PriceFormatPipe, SanitizeHtmlPipe, ProductCardComponent, BreadcrumbComponent, StarRatingComponent, LoadingSkeletonComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seo = inject(SeoService);
  private readonly toast = inject(ToastService);
  private readonly doc = inject(DOCUMENT);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  readonly Math = Math;

  @ViewChild('thumbsTrack') thumbsTrackRef?: ElementRef<HTMLElement>;

  /** Number of thumbnail slides visible at once in the gallery strip. Easy to change (e.g. 3, 4, 5). */
  thumbsPerView = input(6);

  /** From settings() signal (stockDisplay); fallbacks for when BE does not send. */
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

  /** Effective stock: selected variant stock (from product service helper) or global product.stock. */
  effectiveStock = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const variantStock = this.productsService.getVariantStock(p, this.selectedColor(), this.selectedSize());
    return variantStock > 0 ? variantStock : p.stock;
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

  /** True when add-to-cart should be disabled (missing selection, quantity exceeded, or none left to add). */
  addToCartDisabled = computed(() => {
    const p = this.product();
    if (this.added()) return true;
    if (p?.colors?.length && !this.selectedColor()) return true;
    if (p?.sizes?.length && !this.selectedSize()) return true;
    if (!this.productsService.isVariantAvailable(p ?? null, this.selectedColor(), this.selectedSize()) && p?.availability?.variants?.length) return true;
    return this.effectiveStock() <= 0 || this.remainingCanAdd() <= 0 || this.quantity() > this.remainingCanAdd();
  });

  constructor() {
    effect(() => {
      const sd = this.storeService.settings()?.stockDisplay;
      const low = sd?.lowStockThreshold;
      const info = sd?.stockInfoThreshold;
      this.lowStockThreshold.set(typeof low === 'number' && Number.isFinite(low) ? low : 5);
      this.stockInfoThreshold.set(typeof info === 'number' && Number.isFinite(info) ? info : 10);
    });
    effect(() => {
      const remaining = this.remainingCanAdd();
      const qty = this.quantity();
      if (remaining > 0 && qty > remaining) this.quantity.set(remaining);
    });
    effect(() => {
      const p = this.product();
      const color = this.selectedColor();
      const size = this.selectedSize();
      const availableSizes = this.availableSizesForSelectedColor();
      const availableColors = this.availableColorsForSelectedSize();
      if (!p) return;
      if (size != null && availableSizes.length > 0 && !availableSizes.includes(size)) {
        this.selectedSize.set(availableSizes[0] ?? null);
      }
      if (color != null && availableColors.length > 0 && !availableColors.includes(color)) {
        this.selectedColor.set(availableColors[0] ?? null);
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

  /** Sizes available for the selected color (from product service helper). */
  availableSizesForSelectedColor = computed(() =>
    this.productsService.getAvailableSizesForColor(this.product(), this.selectedColor())
  );

  /** Colors available for the selected size (from product service helper). */
  availableColorsForSelectedSize = computed(() =>
    this.productsService.getAvailableColorsForSize(this.product(), this.selectedSize())
  );

  /** All sizes in API order (availability.sizes or product.sizes) for display; out-of-stock shown disabled. */
  allSizesOrdered = computed(() => {
    const p = this.product();
    if (!p) return [];
    const fromAv = p.availability?.sizes?.map((s) => s.size);
    return fromAv?.length ? fromAv : p.sizes ?? [];
  });

  /** All colors for display (always include every product.color; use availability.colors for order when present). Out-of-stock shown disabled. */
  allColorsOrdered = computed(() => {
    const p = this.product();
    if (!p) return [];
    const productColors = p.colors ?? [];
    const avColors = p.availability?.colors?.map((c) => c.color) ?? [];
    if (avColors.length === 0) return productColors;
    const ordered = avColors.filter((color) => productColors.includes(color));
    const missing = productColors.filter((color) => !ordered.includes(color));
    return [...ordered, ...missing];
  });

  /** True when this size is out of stock for the selected color (validates size against color). */
  isSizeOutOfStockForSelectedColor = (size: string): boolean => {
    const p = this.product();
    const color = this.selectedColor();
    if (!p) return true;
    if (p.availability?.variants?.length && color != null)
      return !this.productsService.isVariantAvailable(p, color, size);
    return this.isSizeOutOfStock(size);
  };

  /** True when this color is out of stock for the selected size (when variants exist). */
  isColorOutOfStockForSelectedSize = (color: string): boolean => {
    const p = this.product();
    const size = this.selectedSize();
    if (!p) return true;
    if (p.availability?.variants?.length && size != null)
      return !this.productsService.isVariantAvailable(p, color, size);
    return this.isColorOutOfStock(color);
  };

  /** Image URLs only (for poster/thumb fallback when media is video). */
  images = computed(() => {
    const p = this.product();
    if (!p) return [];
    return p.images ?? [];
  });

  /** Gallery items: from media.default, media.hover, media.previewVideo (with correct types); else images + videos. */
  galleryItems = computed(() => {
    const p = this.product();
    if (!p) return [] as { type: 'image' | 'video'; url: string }[];
    const media = p.media;
    if (media) {
      const items: { type: 'image' | 'video'; url: string }[] = [];
      const seen = new Set<string>();
      const add = (item: { type: 'image' | 'video'; url: string } | undefined) => {
        if (item?.url && !seen.has(item.url)) {
          seen.add(item.url);
          items.push(item);
        }
      };
      add(media.default ? { type: media.default.type === 'video' ? 'video' : 'image', url: media.default.url } : undefined);
      add(media.hover ? { type: media.hover.type === 'video' ? 'video' : 'image', url: media.hover.url } : undefined);
      add(media.previewVideo ? { type: 'video', url: media.previewVideo.url } : undefined);
      if (items.length) return items;
    }
    const imgs = this.images();
    const items: { type: 'image' | 'video'; url: string }[] = imgs.map((url) => ({ type: 'image' as const, url }));
    (p.videos ?? []).forEach((url) => items.push({ type: 'video', url }));
    return items;
  });

  /** True when API sends effectivePrice/discountPrice and it differs from price. */
  hasSale = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (typeof p.effectivePrice === 'number' && p.effectivePrice < p.price) return true;
    return p.discountPrice != null && p.discountPrice !== p.price;
  });

  /** Original (higher) price when on sale. Uses price when API sends effectivePrice. */
  originalPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (typeof p.effectivePrice === 'number' && p.effectivePrice < p.price) return p.price;
    if (p.discountPrice == null) return p.price;
    return Math.max(p.price, p.discountPrice);
  });

  /** Current price: API effectivePrice when present, else discountPrice vs price. */
  currentPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (typeof p.effectivePrice === 'number') return p.effectivePrice;
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
    this.route.paramMap.pipe(
      map(p => p.get('id')),
      distinctUntilChanged(),
      switchMap(id => {
        const existingProduct = this.product();
        const existingRelated = this.related();
        this.product.set(null);
        this.related.set([]);
        this.selectedImageIndex.set(0);
        this.selectedSize.set(null);
        this.selectedColor.set(null);
        this.quantity.set(1);
        if (!id || id === 'undefined' || id === '') return [];
        // After redirect ID→slug, param becomes slug but BE expects _id. Skip refetch when param matches our product's slug.
        if (existingProduct?.slug === id) {
          this.product.set(existingProduct);
          this.related.set(existingRelated);
          return of(existingProduct);
        }
        const apiId = this.resolveApiId(id, existingProduct);
        if (!apiId) return [];
        this.productsService.getRelated(apiId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe((list) => this.related.set(list));
        return this.productsService.getProduct(apiId);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => {
        this.product.set(p);
        this.setDefaultSelections(p);
        this.updateProductMeta(p);
        if (p.slug && p.id) this.cacheSlugId(p.slug, p.id);
        // Replace URL with slug when loaded by ID so route reflects BE SEO (canonical slug)
        const currentParam = this.route.snapshot.paramMap.get('id');
        if (p.slug && currentParam && currentParam !== p.slug) {
          this.router.navigate(['/product', p.slug], { replaceUrl: true });
        }
      },
      error: () => this.product.set(null),
    });
  }

  private updateProductMeta(p: Product | null): void {
    if (!p) return;
    const name = this.getLocalized(p.name);
    const desc = this.getLocalized(p.description);
    const seoTitle = p.seoTitle ? this.getLocalized(p.seoTitle) : name;
    const seoDesc = p.seoDescription ? this.getLocalized(p.seoDescription) : desc;
    const canonicalUrl =
      p.canonicalUrl ||
      (p.slug && typeof this.doc?.defaultView?.location?.origin === 'string'
        ? `${this.doc.defaultView.location.origin}/product/${p.slug}`
        : undefined);
    this.seo.setPage({
      title: seoTitle,
      description: seoDesc?.slice(0, 160),
      type: 'product',
      canonicalUrl,
    });
    this.seo.setProductJsonLd({
      name,
      description: desc,
      image: p.images?.[0] ? this.api.imageUrl(p.images[0]) : undefined,
      price: this.currentPrice(),
      availability: (p.inStock !== undefined ? p.inStock : p.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      averageRating: p.averageRating ?? undefined,
      ratingCount: p.ratingCount ?? undefined,
    });
  }

  /** First available color: from availability.colors or product.colors. */
  private getFirstAvailableColor(p: Product): string | null {
    if (p.availability?.colors?.length) {
      const first = p.availability.colors.find((c) => !c.outOfStock);
      return first?.color ?? p.availability.colors[0]?.color ?? null;
    }
    return p.colors?.[0] ?? null;
  }

  /** First available size for a given color (from variants or global availability). */
  private getFirstAvailableSizeForColor(p: Product, color: string | null): string | null {
    const av = p.availability;
    if (av?.variants?.length && color != null) {
      const first = av.variants.find((v) => v.color === color && !v.outOfStock);
      if (first?.size) return first.size;
    }
    const firstAvailable = av?.sizes?.find((s) => !s.outOfStock);
    if (firstAvailable?.size) return firstAvailable.size;
    return p.sizes?.[0] ?? null;
  }

  /** Set default selected color (first) and size (first for that color). Call after setting product so page does not show until selections are set. */
  private setDefaultSelections(p: Product): void {
    const firstColor = this.getFirstAvailableColor(p);
    this.selectedColor.set(firstColor);
    const firstSize = this.getFirstAvailableSizeForColor(p, firstColor);
    this.selectedSize.set(firstSize);
  }

  /** Select color and fetch product with color-specific images (GET ?color=...). Preserves full colors/availability from previous product so out-of-stock options (e.g. Burgundy) stay visible. */
  selectColor(color: string): void {
    if (this.isColorOutOfStockForSelectedSize(color)) return;
    const prev = this.product();
    const param = this.route.snapshot.paramMap.get('id');
    const apiId = prev?.id ?? this.resolveApiId(param, prev);
    if (!apiId) return;
    this.selectedColor.set(color);
    this.loadingColor.set(true);
    this.productsService.getProduct(apiId, { color: color }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => {
        const merged = prev ? this.mergeProductOptions(prev, p) : p;
        this.product.set(merged);
        this.selectedImageIndex.set(0);
        const firstSize = this.getFirstAvailableSizeForColor(merged, color);
        this.selectedSize.set(firstSize);
        this.loadingColor.set(false);
      },
      error: () => this.loadingColor.set(false),
    });
  }

  /** Keep full colors and availability from previous product when refetching for color (so out-of-stock colors like Burgundy remain visible). */
  private mergeProductOptions(prev: Product, incoming: Product): Product {
    const colorsUnion = [...new Set([...(prev.colors ?? []), ...(incoming.colors ?? [])])];
    const prevAv = prev.availability;
    const incAv = incoming.availability;
    if (!prevAv && !incAv) return { ...incoming, colors: colorsUnion.length ? colorsUnion : incoming.colors };
    const prevColors = prevAv?.colors ?? [];
    const incColors = incAv?.colors ?? [];
    const mergedColors = [...prevColors];
    incColors.forEach((c) => {
      if (!mergedColors.some((x) => x.color === c.color)) mergedColors.push(c);
    });
    const prevVariants = prevAv?.variants ?? [];
    const incVariants = incAv?.variants ?? [];
    const variantKey = (v: { color?: string; size?: string }) => `${v.color ?? ''}\t${v.size ?? ''}`;
    const variantKeys = new Set(prevVariants.map(variantKey));
    const mergedVariants = [...prevVariants];
    incVariants.forEach((v) => {
      if (!variantKeys.has(variantKey(v))) {
        variantKeys.add(variantKey(v));
        mergedVariants.push(v);
      }
    });
    const mergedAvailability = (incAv ?? prevAv)
      ? {
        ...(incAv ?? prevAv),
        colors: mergedColors.length ? mergedColors : incAv?.colors ?? prevAv?.colors,
        variants: mergedVariants.length ? mergedVariants : incAv?.variants ?? prevAv?.variants,
      }
      : undefined;
    return {
      ...incoming,
      colors: colorsUnion.length ? colorsUnion : incoming.colors,
      availability: mergedAvailability,
    };
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;

    if (p.colors?.length && !this.selectedColor()) {
      this.toast.show('Please select a color', 'error');
      return;
    }
    if (p.sizes?.length && !this.selectedSize()) {
      this.toast.show('Please select a size', 'error');
      return;
    }
    const color = this.selectedColor();
    const size = this.selectedSize();
    if (p.availability?.variants?.length && (color != null || size != null)) {
      if (!this.productsService.isVariantAvailable(p, color, size)) {
        this.toast.show('This color and size combination is out of stock', 'error');
        return;
      }
    }

    const stock = this.effectiveStock();
    if (stock < 1) {
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

  /** Set gallery main image index (used by main arrows and thumb clicks). */
  selectGalleryIndex(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /** Track width in px so exactly thumbsPerView() thumbnails are visible (thumb 72px + gap 8px). */
  getThumbsTrackWidth(): number {
    const n = Math.max(1, this.thumbsPerView() ?? 4);
    return n * 72 + (n - 1) * 8;
  }

  /** Scroll thumbnails track by one step (Shopify-style slider arrows). */
  scrollThumbs(container: HTMLElement | null | undefined, direction: 'left' | 'right'): void {
    if (!container) return;
    const step = 80; // thumb width 72 + gap 8
    container.scrollBy({
      left: direction === 'right' ? step : -step,
      behavior: 'smooth',
    });
  }

  /** Bring the selected thumb into view in the thumbs strip. */
  scrollThumbIntoView(): void {
    const track = this.thumbsTrackRef?.nativeElement;
    if (!track) return;
    const idx = this.selectedImageIndex();
    const thumb = track.querySelector(`[data-index="${idx}"]`);
    if (thumb) {
      (thumb as HTMLElement).scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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

  /** Safe list items for formattedDetails list block (for template). */
  getDetailBlockItems(block: FormattedDetailBlock): string[] {
    return block.type === 'list' ? (block.items ?? []) : [];
  }

  /** MongoDB ObjectId: 24 hex chars. Slugs contain hyphens/letters. */
  private static readonly OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i;
  private static readonly SLUG_ID_CACHE_KEY = 'al_noon_slug_id';

  /** Resolve route param to API id. BE expects _id; on refresh with slug we use sessionStorage cache. */
  private resolveApiId(param: string | null, product?: Product | null): string | null {
    if (!param) return null;
    if (ProductDetailComponent.OBJECT_ID_REGEX.test(param)) return param;
    if (product?.slug === param) return product.id;
    try {
      const raw = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ProductDetailComponent.SLUG_ID_CACHE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      return map[param] ?? param;
    } catch {
      return param;
    }
  }

  private cacheSlugId(slug: string, id: string): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const raw = sessionStorage.getItem(ProductDetailComponent.SLUG_ID_CACHE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[slug] = id;
      const keys = Object.keys(map);
      if (keys.length > 50) {
        keys.slice(0, keys.length - 50).forEach((k) => delete map[k]);
      }
      sessionStorage.setItem(ProductDetailComponent.SLUG_ID_CACHE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  }

  /** Map color names to valid CSS color values (for names not recognized by CSS). */
  private static readonly COLOR_MAP: Record<string, string> = {
    burgundy: '#800020',
    champagne: '#F7E7CE',
    camel: '#C19A6B',
    nude: '#E3BC9A',
    taupe: '#483C32',
    mauve: '#E0B0FF',
    blush: '#DE5D83',
    rust: '#B7410E',
    mustard: '#FFDB58',
    sage: '#BCB88A',
    charcoal: '#36454F',
    cream: '#FFFDD0',
    mocha: '#967969',
    dusty_rose: '#DCAE96',
    emerald: '#50C878',
    cobalt: '#0047AB',
    wine: '#722F37',
    sand: '#C2B280',
    ash: '#B2BEB5',
    lilac: '#C8A2C8',
  };

  /** Resolve a color name to a valid CSS value. Returns the name as-is if already valid. */
  colorToCss(name: string): string {
    return ProductDetailComponent.COLOR_MAP[name.toLowerCase()] ?? name;
  }
}
