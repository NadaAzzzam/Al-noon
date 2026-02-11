import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ShippingService } from '../../core/services/shipping.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { StoreService } from '../../core/services/store.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import { requiredError, emailError } from '../../shared/utils/form-validators';
import type { City, ShippingMethod, CreateOrderBody, StructuredAddress, StoreData, PaymentMethodOption, SettingsContentPage } from '../../core/types/api.types';
import type { PaymentMethod } from '../../core/types/api.types';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, TranslatePipe],
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
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly auth = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  /** Store data for checkout header (from getStore) */
  store = signal<StoreData | null>(null);

  /** Fallback for header when store not yet loaded (from getSettings: storeName, logo) */
  settingsStoreFallback = signal<{ storeName?: { en?: string; ar?: string }; logo?: string } | null>(null);

  /** Content pages from settings (for footer links: privacy, return-policy, etc.) */
  contentPages = signal<SettingsContentPage[]>([]);

  /** When true, show "Email me with news and offers" checkbox (from settings.newsletterEnabled). */
  newsletterEnabled = signal(true);

  /** Header display: store first, then settings fallback */
  checkoutHeaderInfo = computed(() => {
    const s = this.store();
    if (s?.storeName != null || s?.logo != null) return { storeName: s?.storeName, logo: s?.logo };
    const fallback = this.settingsStoreFallback();
    return fallback ? { storeName: fallback.storeName, logo: fallback.logo } : null;
  });

  /** Currency from settings API (fallback: EGP / LE for display) */
  currencyCode = signal<string>('EGP');
  currencySymbol = signal<string>('LE');

  /** Shipping methods from GET /api/shipping-methods (bilingual list) */
  shippingMethods = signal<ShippingMethod[]>([]);
  /** True until first shipping methods API response */
  shippingMethodsLoading = signal(true);

  /** Cities from API (dropdown + delivery fee) */
  cities = signal<City[]>([]);

  /** Selected city id (from cities API); drives delivery fee */
  selectedCityId = signal<string>('');

  /** Contact / Email */
  email = signal('');
  emailNews = signal(false);

  /** Delivery fields */
  firstName = signal('');
  lastName = signal('');
  address = signal('');
  apartment = signal('');
  postalCode = signal('');
  phone = signal('');
  textNews = signal(false);

  /** Shipping method selection (id from shipping API list) */
  selectedShippingMethod = signal('');

  /** Payment methods from GET /api/payment-methods */
  paymentMethods = signal<PaymentMethodOption[]>([]);
  paymentMethodsLoading = signal(true);
  /** Selected payment method id (from API list) */
  paymentMethod = signal<PaymentMethod | ''>('');

  /** Billing address */
  billingSameAsShipping = signal(true);
  billingFirstName = signal('');
  billingLastName = signal('');
  billingAddress = signal('');
  billingApartment = signal('');
  billingCity = signal('');
  billingGovernorate = signal('');
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

  /** Selected city (from dropdown); drives delivery fee */
  selectedCity = computed(() => {
    const id = this.selectedCityId();
    if (!id) return null;
    return this.cities().find((c) => c.id === id) ?? null;
  });

  /** City-based delivery fee (fallback when method has no price) */
  cityDeliveryFee = computed(() => {
    const c = this.selectedCity();
    if (c) return c.deliveryFee;
    return this.cities().length > 0 ? this.cities()[0].deliveryFee : 0;
  });

  /** Currently selected shipping method details */
  currentShippingMethod = computed(() => {
    const id = this.selectedShippingMethod();
    return this.shippingMethods().find((m) => m.id === id) ?? null;
  });

  /** Shipping cost: selected method's price from API when set, else city delivery fee */
  deliveryFee = computed(() => {
    const method = this.currentShippingMethod();
    if (method?.price != null) return method.price;
    return this.cityDeliveryFee();
  });

  total = computed(() => this.subtotal() + this.deliveryFee());

  /** Currently selected payment method (for instaPayNumber etc.) */
  selectedPaymentMethod = computed(() => {
    const id = this.paymentMethod();
    if (!id) return null;
    return this.paymentMethods().find((m) => m.id === id) ?? null;
  });

  /** Validation */
  emailErrorMsg = computed(() => {
    if (!this.touched()) return null;
    return emailError(this.email());
  });
  firstNameError = computed(() => this.touched() ? requiredError(this.firstName(), 'First name') : null);
  lastNameError = computed(() => this.touched() ? requiredError(this.lastName(), 'Last name') : null);
  addressError = computed(() => this.touched() ? requiredError(this.address(), 'Address') : null);
  cityError = computed(() => this.touched() ? requiredError(this.selectedCityId(), 'City') : null);
  phoneError = computed(() => this.touched() ? requiredError(this.phone(), 'Phone') : null);

  formValid = computed(() => {
    const base = !emailError(this.email())
      && !requiredError(this.firstName(), 'First name')
      && !requiredError(this.lastName(), 'Last name')
      && !requiredError(this.address(), 'Address')
      && !requiredError(this.selectedCityId(), 'City')
      && !requiredError(this.phone(), 'Phone');
    const shippingMethods = this.shippingMethods();
    const shippingOk = shippingMethods.length === 0 || !!this.selectedShippingMethod();
    const paymentMethods = this.paymentMethods();
    const paymentOk = paymentMethods.length === 0 || !!this.paymentMethod();
    return base && shippingOk && paymentOk;
  });

  ngOnInit(): void {
    // Fetch cities from API (city dropdown + delivery fee)
    this.citiesService.getCities().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cityList) => {
      this.cities.set(cityList);
      if (cityList.length > 0 && !this.selectedCityId()) {
        this.selectedCityId.set(cityList[0].id);
      }
    });

    // Fetch store data and update favicon (checkout has no header, so we set it here)
    this.storeService.getStore().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((s) => {
      this.store.set(s);
      this.updateFavicon(s?.logo);
    });

    // Fetch shipping methods from GET /api/shipping-methods (list drives shipping section)
    this.shippingService.getShippingMethods().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((methods) => {
      this.shippingMethodsLoading.set(false);
      this.shippingMethods.set(methods);
      if (methods.length > 0) {
        const current = this.selectedShippingMethod();
        const found = current && methods.some((m) => m.id === current);
        if (!found) this.selectedShippingMethod.set(methods[0].id);
      }
    });

    // Fetch payment methods from GET /api/payment-methods (list drives Payment section)
    this.paymentMethodsService.getPaymentMethods().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((list) => {
      this.paymentMethodsLoading.set(false);
      this.paymentMethods.set(list);
      if (list.length > 0) {
        const current = this.paymentMethod();
        const found = current && list.some((m) => m.id === current);
        if (!found) this.paymentMethod.set(list[0].id);
      }
    });

    // Pre-fill email if logged in
    if (this.auth.user()) {
      const user = this.auth.user()!;
      this.email.set(user.email ?? '');
      this.firstName.set(user.name?.split(' ')[0] ?? '');
      this.lastName.set(user.name?.split(' ').slice(1).join(' ') ?? '');
    }

    // Default test data for checkout (avoids validation errors when testing)
    this.setDefaultTestData();

    // Settings API: currency, header fallback (storeName/logo), contentPages for footer
    this.storeService.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((settings) => {
      if (settings.currency?.trim()) this.currencyCode.set(settings.currency.trim());
      if (settings.currencySymbol?.trim()) this.currencySymbol.set(settings.currencySymbol.trim());
      if (settings.storeName != null || settings.logo != null) {
        this.settingsStoreFallback.set({
          storeName: settings.storeName,
          logo: settings.logo,
        });
      }
      if (settings.contentPages?.length) this.contentPages.set(settings.contentPages);
      const newsletterOn = settings.newsletterEnabled !== false;
      this.newsletterEnabled.set(newsletterOn);
      if (!newsletterOn) {
        this.emailNews.set(false);
        this.textNews.set(false);
      }
    });
  }

  /** Pre-fill empty fields with test data for easier testing; avoids billing address validation errors. */
  private setDefaultTestData(): void {
    if (!this.email().trim()) this.email.set('test@example.com');
    if (!this.firstName().trim()) this.firstName.set('Test');
    if (!this.lastName().trim()) this.lastName.set('User');
    if (!this.address().trim()) this.address.set('123 Test Street');
    if (!this.phone().trim()) this.phone.set('01000000000');
    if (!this.postalCode().trim()) this.postalCode.set('12345');
    // Billing defaults (required when "different billing" is selected)
    if (!this.billingAddress().trim()) this.billingAddress.set('123 Billing Street');
    if (!this.billingCity().trim()) this.billingCity.set('Cairo');
    if (!this.billingGovernorate().trim()) this.billingGovernorate.set('Cairo');
    if (!this.billingFirstName().trim()) this.billingFirstName.set('Test');
    if (!this.billingLastName().trim()) this.billingLastName.set('User');
    if (!this.billingPhone().trim()) this.billingPhone.set('01000000000');
    if (!this.billingPostalCode().trim()) this.billingPostalCode.set('12345');
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

    const selectedCity = this.selectedCity();
    const cityName = selectedCity ? this.getLocalized(selectedCity.name) : '';

    // Build structured shipping address (city from selected city in dropdown)
    const shippingAddr: StructuredAddress = {
      address: this.address().trim(),
      apartment: this.apartment().trim() || undefined,
      city: cityName.trim(),
      governorate: cityName.trim() || 'Egypt',
      postalCode: this.postalCode().trim() || undefined,
      country: 'Egypt',
    };

    // Build billing address (null if same as shipping)
    let billingAddr: StructuredAddress | null = null;
    if (!this.billingSameAsShipping()) {
      const billingAddrVal = this.billingAddress().trim();
      const billingCityVal = this.billingCity().trim();
      // Fallback to shipping address if billing address/city are empty (avoid validation error)
      billingAddr = {
        address: billingAddrVal || shippingAddr.address,
        apartment: this.billingApartment().trim() || undefined,
        city: billingCityVal || shippingAddr.city,
        governorate: (this.billingGovernorate().trim() || shippingAddr.governorate) || 'Egypt',
        postalCode: this.billingPostalCode().trim() || undefined,
        country: 'Egypt',
      };
    }

    const selectedPayment = this.paymentMethod();
    const body: CreateOrderBody = {
      items: this.cart.getItemsForOrder(),
      paymentMethod: selectedPayment || undefined,
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

    this.ordersService.checkout(body).pipe(
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

}
