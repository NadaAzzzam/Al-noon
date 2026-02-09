import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type { Order } from '../../core/types/api.types';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
<div class="container order-confirmation-page">
  @if (!order()) {
    <p class="not-found">{{ 'orderConfirmation.notFound' | translate }}</p>
    <a [routerLink]="['/catalog']" class="btn">{{ 'orderConfirmation.continueShopping' | translate }}</a>
  } @else {
    @let o = order()!;
    <div class="confirmation-card">
      <h1 class="page-title">{{ 'orderConfirmation.thankYou' | translate }}</h1>
      <p class="confirmation-message">{{ 'orderConfirmation.message' | translate }}</p>
      <p class="order-id">{{ 'orderConfirmation.orderId' | translate }}: <strong>#{{ o.id }}</strong></p>
      <p class="order-status">{{ 'orderDetail.status' | translate }}: {{ o.status }}</p>
      @if (o.guestEmail) {
        <p class="guest-contact">{{ 'checkout.guestEmail' | translate }}: {{ o.guestEmail }}</p>
      }
      @if (o.shippingAddress) {
        <p class="shipping-address">{{ 'orderDetail.shipping' | translate }}: {{ o.shippingAddress }}</p>
      }
      <div class="order-items">
        <h2>{{ 'orderDetail.items' | translate }}</h2>
        @for (item of o.items; track $index) {
          <div class="order-item">
            @if (item.product.images.length) {
              <img [src]="api.imageUrl(item.product.images[0])" [alt]="getLocalized(item.product.name)" class="item-image" />
            } @else {
              <div class="item-image item-image-placeholder"></div>
            }
            <div class="item-details">
              <span>{{ getLocalized(item.product.name) || ('cart.product' | translate) }}</span>
              <p>× {{ item.quantity }} — LE {{ item.price }} EGP</p>
            </div>
            <span class="item-total">LE {{ item.quantity * item.price }} EGP</span>
          </div>
        }
      </div>
      <div class="order-totals">
        @if (o.deliveryFee != null && o.deliveryFee > 0) {
          <p><span>{{ 'checkout.delivery' | translate }}</span><span>LE {{ o.deliveryFee }} EGP</span></p>
        }
        <p class="total"><span>{{ 'orderDetail.total' | translate }}</span><span>LE {{ o.total }} EGP</span></p>
      </div>
      <a [routerLink]="['/catalog']" class="btn btn-block">{{ 'orderConfirmation.continueShopping' | translate }}</a>
    </div>
  }
</div>
`,
  styles: [`
.order-confirmation-page { padding: 32px 0 48px; }
.confirmation-card { max-width: 560px; margin: 0 auto; padding: 32px; background: var(--color-surface); border: 1px solid var(--color-border); }
.page-title { margin-bottom: 8px; }
.confirmation-message { margin-bottom: 16px; color: var(--color-text-muted); }
.order-id { margin-bottom: 8px; font-size: 1rem; }
.order-status { margin-bottom: 16px; font-size: 14px; }
.guest-contact { margin-bottom: 8px; font-size: 14px; color: var(--color-text-muted); }
.shipping-address { margin-bottom: 24px; font-size: 14px; color: var(--color-text-muted); }
.not-found { color: var(--color-text-muted); margin-bottom: 16px; }
.order-items { margin-bottom: 24px; }
.order-items h2 { font-size: 1.1rem; margin-bottom: 16px; }
.order-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-border); }
.item-image { width: 80px; height: 80px; object-fit: cover; background: var(--color-border); }
.item-image-placeholder { width: 80px; height: 80px; background: var(--color-border); }
.item-details p { margin: 4px 0 0; font-size: 14px; color: var(--color-text-muted); }
.item-total { font-weight: 600; }
.order-totals { margin-bottom: 24px; }
.order-totals p { display: flex; justify-content: space-between; margin: 8px 0; }
.order-totals .total { font-weight: 600; font-size: 1.1rem; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.btn-block { margin-top: 8px; }
`],
})
export class OrderConfirmationComponent {
  private readonly router = inject(Router);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  /** Order passed via router state after guest checkout */
  order = signal<Order | null>(null);

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras?.state as { order?: Order } | undefined;
    if (state?.order) this.order.set(state.order);
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
