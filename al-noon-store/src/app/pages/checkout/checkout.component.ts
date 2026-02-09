import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import { requiredError } from '../../shared/utils/form-validators';
import type { City } from '../../core/types/api.types';
import type { PaymentMethod } from '../../core/types/api.types';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  private readonly citiesService = inject(CitiesService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  cities = signal<City[]>([]);
  cityId = signal('');
  shippingAddress = signal('');
  paymentMethod = signal<PaymentMethod>('COD');
  submitting = signal(false);
  error = signal<string | null>(null);

  items = this.cart.items;
  subtotal = this.cart.subtotal;

  selectedCity = computed(() => {
    const id = this.cityId();
    return this.cities().find((c) => c.id === id) ?? null;
  });
  cityError = computed(() => requiredError(this.cityId(), 'City'));
  shippingError = computed(() => requiredError(this.shippingAddress(), 'Shipping address'));
  formValid = computed(() => !this.cityError() && !this.shippingError());
  deliveryFee = computed(() => this.selectedCity()?.deliveryFee ?? 0);
  total = computed(() => this.subtotal() + this.deliveryFee());

  ngOnInit(): void {
    this.citiesService.getCities().subscribe((c) => this.cities.set(c));
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  submit(): void {
    if (!this.formValid() || this.items().length === 0) return;
    this.error.set(null);
    this.submitting.set(true);
    this.ordersService
      .createOrder({
        items: this.cart.getItemsForOrder(),
        paymentMethod: this.paymentMethod(),
        shippingAddress: this.shippingAddress().trim(),
        deliveryFee: this.deliveryFee(),
      })
      .subscribe({
        next: (order) => {
          this.cart.clear();
          this.submitting.set(false);
          this.router.navigate(['/account', 'orders', order.id]);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'Failed to place order');
          this.submitting.set(false);
        },
      });
  }
}
