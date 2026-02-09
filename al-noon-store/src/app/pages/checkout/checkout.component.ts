import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { requiredError, emailError } from '../../shared/utils/form-validators';
import type { City, CreateOrderBody } from '../../core/types/api.types';
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
  private readonly auth = inject(AuthService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  cities = signal<City[]>([]);
  cityId = signal('');
  shippingAddress = signal('');
  paymentMethod = signal<PaymentMethod>('COD');
  /** Guest checkout contact fields (used when not logged in) */
  guestName = signal('');
  guestEmail = signal('');
  guestPhone = signal('');
  submitting = signal(false);
  error = signal<string | null>(null);

  items = this.cart.items;
  subtotal = this.cart.subtotal;
  isLoggedIn = this.auth.isLoggedIn;

  selectedCity = computed(() => {
    const id = this.cityId();
    return this.cities().find((c) => c.id === id) ?? null;
  });
  cityError = computed(() => requiredError(this.cityId(), 'City'));
  shippingError = computed(() => requiredError(this.shippingAddress(), 'Shipping address'));
  guestNameError = computed(() => requiredError(this.guestName(), 'Name'));
  guestEmailError = computed(() => {
    const v = this.guestEmail();
    return requiredError(v, 'Email') || emailError(v);
  });
  formValid = computed(() => {
    const base = !this.cityError() && !this.shippingError();
    if (this.isLoggedIn()) return base;
    return base && !this.guestNameError() && !this.guestEmailError();
  });
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
    const body: CreateOrderBody = {
      items: this.cart.getItemsForOrder(),
      paymentMethod: this.paymentMethod(),
      shippingAddress: this.shippingAddress().trim(),
      deliveryFee: this.deliveryFee(),
    };
    if (!this.isLoggedIn()) {
      body.guestName = this.guestName().trim();
      body.guestEmail = this.guestEmail().trim();
      const phone = this.guestPhone().trim();
      if (phone) body.guestPhone = phone;
    }
    this.ordersService.createOrder(body).subscribe({
      next: (order) => {
        this.cart.clear();
        this.submitting.set(false);
        if (this.isLoggedIn()) {
          this.router.navigate(['/account', 'orders', order.id]);
        } else {
          this.router.navigate(['/order-confirmation'], { state: { order } });
        }
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to place order');
        this.submitting.set(false);
      },
    });
  }
}
