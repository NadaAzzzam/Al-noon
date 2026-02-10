import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ShippingService } from '../../core/services/shipping.service';
import { GovernoratesService } from '../../core/services/governorates.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { StoreService } from '../../core/services/store.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import { requiredError, emailError } from '../../shared/utils/form-validators';
import type { City, Governorate, ShippingMethod, CreateOrderBody, StructuredAddress, StoreData } from '../../core/types/api.types';
import type { PaymentMethod } from '../../core/types/api.types';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, TranslatePipe, LocalizedPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly ordersService = inject(OrdersService);
  private readonly citiesService = inject(CitiesService);
  private readonly shippingService = inject(ShippingService);
  private readonly governoratesService = inject(GovernoratesService);
  private readonly auth = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  /** Store data for checkout header */
  store = signal<StoreData | null>(null);

  /** Governorates from API (bilingual) */
  governorates = signal<Governorate[]>([]);

  /** Shipping methods from API (bilingual) */
  shippingMethods = signal<ShippingMethod[]>([]);

  /** Cities from API (for delivery fee) */
  cities = signal<City[]>([]);

  /** Contact / Email */
  email = signal('');
  emailNews = signal(false);

  /** Delivery fields */
  firstName = signal('');
  lastName = signal('');
  address = signal('');
  apartment = signal('');
  city = signal('');
  governorate = signal('cairo');
  postalCode = signal('');
  phone = signal('');
  textNews = signal(false);

  /** Shipping method selection */
  selectedShippingMethod = signal('standard');

  /** Payment */
  paymentMethod = signal<PaymentMethod>('COD');

  /** Billing address */
  billingSameAsShipping = signal(true);
  billingFirstName = signal('');
  billingLastName = signal('');
  billingAddress = signal('');
  billingApartment = signal('');
  billingCity = signal('');
  billingGovernorate = signal('cairo');
  billingPostalCode = signal('');
  billingPhone = signal('');

  /** Special instructions */
  specialInstructions = this.cart.specialInstructions;

  /** Form state */
  submitting = signal(false);
  error = signal<string | null>(null);
  touched = signal(false);

  /** Cart data */
  items = this.cart.items;
  subtotal = this.cart.subtotal;
  isLoggedIn = this.auth.isLoggedIn;

  /** Selected city for delivery fee */
  selectedCity = computed(() => {
    const name = this.city();
    if (!name) return null;
    return this.cities().find((c) => {
      const cityName = this.getLocalized(c.name).toLowerCase();
      return cityName === name.toLowerCase() || c.id === name;
    }) ?? null;
  });

  deliveryFee = computed(() => {
    const c = this.selectedCity();
    if (c) return c.deliveryFee;
    // Default shipping fee if no city match
    return this.cities().length > 0 ? this.cities()[0].deliveryFee : 65;
  });

  total = computed(() => this.subtotal() + this.deliveryFee());

  /** Currently selected shipping method details */
  currentShippingMethod = computed(() => {
    const id = this.selectedShippingMethod();
    return this.shippingMethods().find((m) => m.id === id) ?? null;
  });

  /** Validation */
  emailErrorMsg = computed(() => {
    if (!this.touched()) return null;
    return emailError(this.email());
  });
  firstNameError = computed(() => this.touched() ? requiredError(this.firstName(), 'First name') : null);
  lastNameError = computed(() => this.touched() ? requiredError(this.lastName(), 'Last name') : null);
  addressError = computed(() => this.touched() ? requiredError(this.address(), 'Address') : null);
  cityError = computed(() => this.touched() ? requiredError(this.city(), 'City') : null);
  phoneError = computed(() => this.touched() ? requiredError(this.phone(), 'Phone') : null);

  formValid = computed(() => {
    return !emailError(this.email())
      && !requiredError(this.firstName(), 'First name')
      && !requiredError(this.lastName(), 'Last name')
      && !requiredError(this.address(), 'Address')
      && !requiredError(this.city(), 'City')
      && !requiredError(this.phone(), 'Phone');
  });

  ngOnInit(): void {
    // Fetch cities for delivery fee
    this.citiesService.getCities().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((c) => this.cities.set(c));

    // Fetch store data and update favicon (checkout has no header, so we set it here)
    this.storeService.getStore().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((s) => {
      this.store.set(s);
      this.updateFavicon(s?.logo);
    });

    // Fetch governorates from API
    this.governoratesService.getGovernorates().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((govs) => {
      this.governorates.set(govs);
      // Default to cairo if available
      if (govs.length > 0 && !govs.find((g) => g.id === this.governorate())) {
        this.governorate.set(govs[0].id);
      }
    });

    // Fetch shipping methods from API
    this.shippingService.getShippingMethods().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((methods) => {
      this.shippingMethods.set(methods);
      if (methods.length > 0 && !methods.find((m) => m.id === this.selectedShippingMethod())) {
        this.selectedShippingMethod.set(methods[0].id);
      }
    });

    // Pre-fill email if logged in
    if (this.auth.user()) {
      const user = this.auth.user()!;
      this.email.set(user.email ?? '');
      this.firstName.set(user.name?.split(' ')[0] ?? '');
      this.lastName.set(user.name?.split(' ').slice(1).join(' ') ?? '');
    }
  }

  private updateFavicon(logoPath: string | undefined | null): void {
    const url = logoPath ? this.api.imageUrl(logoPath) : null;
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (url) {
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'icon');
        link.setAttribute('type', 'image/x-icon');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  submit(): void {
    this.touched.set(true);
    if (!this.formValid() || this.items().length === 0) return;
    this.error.set(null);
    this.submitting.set(true);

    // Build structured shipping address
    const shippingAddr: StructuredAddress = {
      address: this.address().trim(),
      apartment: this.apartment().trim() || undefined,
      city: this.city().trim(),
      governorate: this.getGovernorateName(this.governorate()),
      postalCode: this.postalCode().trim() || undefined,
      country: 'Egypt',
    };

    // Build billing address (null if same as shipping)
    let billingAddr: StructuredAddress | null = null;
    if (!this.billingSameAsShipping()) {
      billingAddr = {
        address: this.billingAddress().trim(),
        apartment: this.billingApartment().trim() || undefined,
        city: this.billingCity().trim(),
        governorate: this.getGovernorateName(this.billingGovernorate()),
        postalCode: this.billingPostalCode().trim() || undefined,
        country: 'Egypt',
      };
    }

    const body: CreateOrderBody = {
      items: this.cart.getItemsForOrder(),
      paymentMethod: this.paymentMethod(),
      deliveryFee: this.deliveryFee(),
      email: this.email().trim(),
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phone: this.phone().trim(),
      shippingAddress: shippingAddr,
      billingAddress: billingAddr,
      specialInstructions: this.specialInstructions().trim() || undefined,
      shippingMethod: this.selectedShippingMethod(),
      emailNews: this.emailNews(),
      textNews: this.textNews(),
    };

    this.ordersService.createOrder(body).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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

  /** Get the display name (en) for a governorate id */
  private getGovernorateName(id: string): string {
    const gov = this.governorates().find((g) => g.id === id);
    return gov ? (gov.name.en ?? id) : id;
  }
}
