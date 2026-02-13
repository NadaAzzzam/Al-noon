import { Component, input, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PriceFormatPipe } from '../../pipe/price.pipe';
import { ApiService } from '../../../core/services/api.service';
import { LocaleService } from '../../../core/services/locale.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import type { Product } from '../../../core/types/api.types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PriceFormatPipe, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    @if (p) {
      <a [routerLink]="['/product', p.id]" class="product-card">
        <div class="product-image-wrap"
             [class.has-hover-image]="hasSecondMedia()">
          @if (mainMedia()) {
            @if (mainMedia()!.type === 'video') {
              <video [src]="api.imageUrl(mainMedia()!.url)" class="product-img product-img-main" muted loop playsinline autoplay
                [poster]="(p.images && p.images[0]) ? api.imageUrl(p.images[0]) : null" [attr.aria-label]="name()"></video>
            } @else {
              <img
                [src]="api.imageUrl(mainMedia()!.url)"
                [alt]="name()"
                loading="lazy"
                class="product-img product-img-main" />
            }
            @if (hasSecondMedia()) {
              @if (hoverMedia()!.type === 'video') {
                <video [src]="api.imageUrl(hoverMedia()!.url)" class="product-img product-img-hover" muted loop playsinline autoplay
                  [poster]="(p.images && p.images[0]) ? api.imageUrl(p.images[0]) : null" [attr.aria-label]="name()"></video>
              } @else {
                <img
                  [src]="api.imageUrl(hoverMedia()!.url)"
                  [alt]="name()"
                  loading="lazy"
                  class="product-img product-img-hover" />
              }
            }
          } @else {
            <div class="product-image-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
            </div>
          }
          @if (hasSale()) {
            <span class="sale-badge">{{ 'sale' | translate }}</span>
          }
          @if (soldOut()) {
            <span class="sold-out-badge">{{ 'soldOut' | translate }}</span>
          } @else if (discountPercent() > 0) {
            <span class="discount-badge">-{{ discountPercent() }}%</span>
          }
          <span class="quick-view">{{ 'product.quickView' | translate }}</span>
        </div>
        <div class="product-card-body">
          <h3 class="product-name">{{ name() }}</h3>
          @if (p.averageRating) {
            <app-star-rating [rating]="p.averageRating" [showCount]="true" [count]="p.ratingCount ?? 0" />
          }
          <div class="price">
            @if (hasSale()) {
              <span class="original">{{ originalPrice() | priceFormat }}</span>
              <span class="current sale-price">{{ currentPrice() | priceFormat }}</span>
            } @else {
              <span class="current">{{ p.price | priceFormat }}</span>
            }
          </div>
        </div>
      </a>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .product-card {
      display: block;
      text-decoration: none;
      color: inherit;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-card:hover {
      transform: translateY(-6px);
    }
    .product-card:hover .quick-view {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .product-image-wrap {
      position: relative;
      overflow: hidden;
      aspect-ratio: 3 / 4;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e8e6e3);
      border-radius: 4px;
    }
    /* ── Image swap on hover (CSS-only so hover is reliable) ── */
    .product-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-img-main {
      opacity: 1;
      z-index: 1;
    }
    .product-img-hover {
      opacity: 0;
      z-index: 2;
    }
    .product-image-wrap.has-hover-image:hover .product-img-main {
      opacity: 0;
    }
    .product-image-wrap.has-hover-image:hover .product-img-hover {
      opacity: 1;
      transform: scale(1.03);
    }
    .product-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg, #faf9f7);
      color: var(--color-text-muted, #5c5c5c);
    }
    .quick-view {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%) translateY(8px);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(4px);
      color: var(--color-text, #1a1a1a);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 8px 20px;
      border-radius: 2px;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
      z-index: 5;
    }
    .sale-badge {
      position: absolute;
      top: 10px;
      inset-inline-start: 10px;
      background: var(--color-sale, #b8462a);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: 2px;
      z-index: 5;
    }
    .sold-out-badge {
      position: absolute;
      top: 10px;
      inset-inline-start: 10px;
      background: var(--color-text, #1a1a1a);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 2px;
      z-index: 5;
    }
    .discount-badge {
      position: absolute;
      top: 10px;
      inset-inline-end: 10px;
      background: var(--color-accent, #2c2c2c);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 2px;
      z-index: 5;
    }
    .product-card-body {
      padding: 14px 2px 0;
    }
    .product-name {
      font-family: var(--font-body, sans-serif);
      font-size: 0.9rem;
      font-weight: 500;
      margin: 0 0 4px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      transition: color 0.2s;
    }
    .product-card:hover .product-name {
      color: var(--color-text-muted, #5c5c5c);
    }
    .price {
      margin-top: 6px;
      font-size: 0.875rem;
    }
    .price .original {
      color: var(--color-text-muted, #5c5c5c);
      text-decoration: line-through;
      margin-inline-end: 8px;
    }
    .price .current {
      font-weight: 600;
    }
    .price .current.sale-price {
      color: var(--color-sale, #b8462a);
    }
  `],
})
export class ProductCardComponent {
  readonly api = inject(ApiService);
  private readonly locale = inject(LocaleService);

  product = input.required<Product>();

  /** Main media: media.default (image or video); fallback images[0] as image. */
  mainMedia = computed(() => {
    const p = this.product();
    if (!p) return undefined as { type: 'image' | 'video'; url: string } | undefined;
    const d = p.media?.default;
    if (d?.url) return { type: (d.type === 'video' ? 'video' : 'image') as 'image' | 'video', url: d.url };
    const url = p.images?.[0];
    return url ? { type: 'image' as const, url } : undefined;
  });

  /** Hover media: media.hover (image or video); fallback images[1] as image. */
  hoverMedia = computed(() => {
    const p = this.product();
    if (!p) return undefined as { type: 'image' | 'video'; url: string } | undefined;
    const h = p.media?.hover;
    if (h?.url) return { type: (h.type === 'video' ? 'video' : 'image') as 'image' | 'video', url: h.url };
    const url = p.images?.[1];
    return url ? { type: 'image' as const, url } : undefined;
  });

  name = computed(() => {
    const p = this.product();
    if (!p?.name) return '';
    const lang = this.locale.getLocale();
    return (p.name[lang] ?? p.name.en ?? p.name.ar ?? '') as string;
  });

  hasSecondMedia = computed(() => {
    const main = this.mainMedia();
    const hover = this.hoverMedia();
    return !!hover && (hover.url !== main?.url || hover.type !== main?.type);
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

  /** Sold-out: API inStock when present, else stock <= 0. */
  soldOut = computed(() => {
    const p = this.product();
    if (!p) return false;
    if (typeof p.inStock === 'boolean') return !p.inStock;
    return p.stock <= 0;
  });

  discountPercent = computed(() => {
    const p = this.product();
    if (!p || !this.hasSale()) return 0;
    const orig = this.originalPrice();
    if (orig === 0) return 0;
    return Math.round(((orig - this.currentPrice()) / orig) * 100);
  });
}
