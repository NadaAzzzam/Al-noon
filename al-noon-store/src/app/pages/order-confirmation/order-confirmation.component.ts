import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '@ngx-translate/core';
import { PriceFormatPipe } from '../../shared/pipe/price.pipe';
import type { Order, StructuredAddress } from '../../core/types/api.types';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [RouterLink, TranslatePipe, PriceFormatPipe],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationComponent {
  private readonly router = inject(Router);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  readonly auth = inject(AuthService);

  /** Order passed via router state after guest checkout */
  order = signal<Order | null>(null);
  isLoggedIn = computed(() => this.auth.isLoggedIn());

  /** Extract first name for "Thank you, Name!" greeting */
  customerName = computed(() => {
    const o = this.order();
    if (!o) return '';
    // Prefer new firstName field
    if (o.firstName) return o.firstName;
    // Fallback to legacy guestName
    if (o.guestName) return o.guestName.split(' ')[0];
    const user = this.auth.user();
    if (user?.name) return user.name.split(' ')[0];
    return '';
  });

  /** Contact email */
  contactEmail = computed(() => {
    const o = this.order();
    return o?.email ?? o?.guestEmail ?? this.auth.user()?.email ?? '';
  });

  /** Phone */
  contactPhone = computed(() => {
    const o = this.order();
    return o?.phone ?? o?.guestPhone ?? '';
  });

  /** Parsed shipping address lines — supports both structured and flat string */
  shippingLines = computed(() => {
    const o = this.order();
    if (!o?.shippingAddress) return [];
    // Structured address (object)
    if (typeof o.shippingAddress === 'object') {
      const addr = o.shippingAddress as StructuredAddress;
      const lines: string[] = [];
      if (addr.address) lines.push(addr.address);
      if (addr.apartment) lines.push(addr.apartment);
      const cityGov = [addr.city, addr.governorate].filter(Boolean).join(', ');
      if (cityGov) lines.push(cityGov);
      if (addr.postalCode) lines.push(addr.postalCode);
      return lines;
    }
    // Flat string (legacy)
    return (o.shippingAddress as string).split(',').map((s) => s.trim()).filter(Boolean);
  });

  /** Billing address lines */
  billingLines = computed(() => {
    const o = this.order();
    if (!o?.billingAddress) return this.shippingLines(); // Same as shipping if null
    const addr = o.billingAddress;
    const lines: string[] = [];
    if (addr.address) lines.push(addr.address);
    if (addr.apartment) lines.push(addr.apartment);
    const cityGov = [addr.city, addr.governorate].filter(Boolean).join(', ');
    if (cityGov) lines.push(cityGov);
    if (addr.postalCode) lines.push(addr.postalCode);
    return lines;
  });

  /** Full name for billing/shipping */
  fullName = computed(() => {
    const o = this.order();
    if (o?.firstName || o?.lastName) {
      return [o.firstName, o.lastName].filter(Boolean).join(' ');
    }
    if (o?.guestName) return o.guestName;
    return this.auth.user()?.name ?? '';
  });

  /** Shipping method display */
  shippingMethodDisplay = computed(() => {
    const o = this.order();
    if (!o?.shippingMethod) return 'Standard';
    // Capitalize first letter
    return o.shippingMethod.charAt(0).toUpperCase() + o.shippingMethod.slice(1);
  });

  /** Payment display */
  paymentDisplay = computed(() => {
    const o = this.order();
    if (!o) return '';
    const method = o.paymentMethod ?? o.payment?.method ?? 'COD';
    if (method === 'COD') return `Cash on Delivery (COD)`;
    return method;
  });

  /** Subtotal (sum of items) */
  subtotal = computed(() => {
    const o = this.order();
    if (!o) return 0;
    return o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  });

  /** Delivery fee */
  deliveryFee = computed(() => {
    const o = this.order();
    return o?.deliveryFee ?? 0;
  });

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras?.state as { order?: Order } | undefined;
    if (state?.order) {
      this.order.set(state.order);
    } else {
      try {
        const stored = sessionStorage.getItem('al_noon_last_order');
        if (stored) {
          const parsed = JSON.parse(stored) as Order;
          if (parsed?.id) this.order.set(parsed);
        }
      } catch {}
    }
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
