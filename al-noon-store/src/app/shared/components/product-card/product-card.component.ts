import { Component, input, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { LocaleService } from '../../../core/services/locale.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import type { Product } from '../../../core/types/api.types';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, TranslateModule, StarRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    @if (p) {
      <a [routerLink]="['/product', p.id]" class="product-card" [attr.aria-label]="name()">
        <div class="product-image-wrap">
          @if (p.images.length) {
            <img [src]="api.imageUrl(p.images[0])" [alt]="name()" loading="lazy" />
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
          @if (p.stock <= 0) {
            <span class="sold-out-badge">{{ 'soldOut' | translate }}</span>
          }
          @if (discountPercent() > 0) {
            <span class="discount-badge">-{{ discountPercent() }}%</span>
          }
        </div>
        <div class="product-card-body">
          <h3 class="product-name">{{ name() }}</h3>
          @if (p.averageRating) {
            <app-star-rating [rating]="p.averageRating" [showCount]="true" [count]="p.ratingCount ?? 0" />
          }
          <div class="price">
            @if (hasSale()) {
              <span class="original">{{ p.price }} EGP</span>
              <span class="current">{{ p.discountPrice }} EGP</span>
            } @else {
              <span class="current">{{ p.price }} EGP</span>
            }
          </div>
        </div>
      </a>
    }
  `,
  styles: [`
    .product-card {
      display: block;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .product-card:hover {
      transform: translateY(-4px);
    }
    .product-card:hover .product-image-wrap img {
      transform: scale(1.03);
    }
    .product-image-wrap {
      position: relative;
      overflow: hidden;
      aspect-ratio: 3 / 4;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e8e6e3);
    }
    .product-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
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
    .sale-badge {
      position: absolute;
      top: 10px;
      inset-inline-start: 10px;
      background: var(--color-sale, #b8462a);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .sold-out-badge {
      position: absolute;
      top: 10px;
      inset-inline-start: 10px;
      background: var(--color-text, #1a1a1a);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
    }
    .discount-badge {
      position: absolute;
      top: 10px;
      inset-inline-end: 10px;
      background: var(--color-accent, #2c2c2c);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
    }
    .product-card-body {
      padding: 12px 0 0;
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
  `],
})
export class ProductCardComponent {
  readonly api = inject(ApiService);
  private readonly locale = inject(LocaleService);

  product = input.required<Product>();

  name = computed(() => {
    const p = this.product();
    if (!p?.name) return '';
    const lang = this.locale.getLocale();
    return (p.name[lang] ?? p.name.en ?? p.name.ar ?? '') as string;
  });

  hasSale = computed(() => {
    const p = this.product();
    return p?.discountPrice != null && p.discountPrice < p.price;
  });

  discountPercent = computed(() => {
    const p = this.product();
    if (!p || p.discountPrice == null || p.discountPrice >= p.price || p.price === 0) return 0;
    return Math.round(((p.price - p.discountPrice) / p.price) * 100);
  });
}
