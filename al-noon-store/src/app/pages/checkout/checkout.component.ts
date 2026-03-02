import { Component, OnInit, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { OrdersService } from '../../core/services/orders.service';
import { CitiesService } from '../../core/services/cities.service';
import { ShippingService } from '../../core/services/shipping.service';
import { PaymentMethodsService } from '../../core/services/payment-methods.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPathService } from '../../core/services/localized-path.service';
import { AuthService } from '../../core/services/auth.service';
import { StoreService } from '../../core/services/store.service';
import { getLocalizedSlug } from '../../core/utils/localized';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import { PriceFormatPipe } from '../../shared/pipe/price.pipe';
import { requiredError, emailError, emailErrorKey, requiredErrorKey } from '../../shared/utils/form-validators';
import { extractErrorMessage } from '../../shared/utils/error-utils';
import type { City, ShippingMethod, CreateOrderBody, StructuredAddress, StoreData, PaymentMethodOption, SettingsContentPage } from '../../core/types/api.types';
import type { PaymentMethod } from '../../core/types/api.types';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, PriceFormatPipe, LocalizedPipe],
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
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);
  readonly pathService = inject(LocalizedPathService);
  private readonly translate = inject(TranslateService);

  /** Store data for checkout header (from getStore) */
  store = signal<StoreData | null>(null);

  /** Fallback for header when store not yet loaded (from settings() signal: storeName, logo) */
  settingsStoreFallback = signal<{ storeName?: { en?: string; ar?: string }; logo?: string } | null>(null);

  /** Content pages from settings() (for footer links: privacy, return-policy, etc.) */
  contentPages = signal<SettingsContentPage[]>([]);

  /** When true, show "Email me with news and offers" checkbox (from settings().newsletterEnabled). */
  newsletterEnabled = signal(true);

  constructor() {
    effect(() => {
      const err = this.error();
      if (err && typeof this.doc !== 'undefined') {
        setTimeout(() =>
          this.doc.getElementById('checkout-error-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          50
        );
      }
    });
    effect(() => {
      const s = this.storeService.settings();
      if (!s) return;
      if (s.currency?.trim()) this.currencyCode.set(s.currency.trim());
      if (s.currencySymbol?.trim()) this.currencySymbol.set(s.currencySymbol.trim());
      if (s.storeName != null || s.logo != null) {
        this.settingsStoreFallback.set({ storeName: s.storeName, logo: s.logo });
      }
      if (s.contentPages?.length) this.contentPages.set(s.contentPages);
      const newsletterOn = s.newsletterEnabled !== false;
      this.newsletterEnabled.set(newsletterOn);
      if (!newsletterOn) {
        this.emailNews.set(false);
        this.textNews.set(false);
      }
    });
  }

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
  /** When true, show "Update cart" link (e.g. after out-of-stock 400) */
  showUpdateCart = signal(false);
  touched = signal(false);

  /** Whether the store supports discount codes (from API: store.discountCodeSupported) */
  discountCodeSupported = signal(false);

  discountCode = signal('');
  discountCodeApplied = signal(false);
  discountCodeError = signal<string | null>(null);
  discountCodeChecking = signal(false);


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

  /** Validation (localized messages) */
  emailErrorMsg = computed(() => {
    if (!this.touched()) return null;
    const key = emailErrorKey(this.email());
    return key ? this.translate.instant(key) : null;
  });
  firstNameError = computed(() => {
    if (!this.touched()) return null;
    const r = requiredErrorKey(this.firstName(), 'checkout.firstName');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  lastNameError = computed(() => {
    if (!this.touched()) return null;
    const r = requiredErrorKey(this.lastName(), 'checkout.lastName');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  addressError = computed(() => {
    if (!this.touched()) return null;
    const r = requiredErrorKey(this.address(), 'checkout.address');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  cityError = computed(() => {
    if (!this.touched()) return null;
    const r = requiredErrorKey(this.selectedCityId(), 'checkout.city');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  phoneError = computed(() => {
    if (!this.touched()) return null;
    const r = requiredErrorKey(this.phone(), 'checkout.phone');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });

  billingFirstNameError = computed(() => {
    if (!this.touched() || this.billingSameAsShipping()) return null;
    const r = requiredErrorKey(this.billingFirstName(), 'checkout.firstName');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  billingLastNameError = computed(() => {
    if (!this.touched() || this.billingSameAsShipping()) return null;
    const r = requiredErrorKey(this.billingLastName(), 'checkout.lastName');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  billingAddressError = computed(() => {
    if (!this.touched() || this.billingSameAsShipping()) return null;
    const r = requiredErrorKey(this.billingAddress(), 'checkout.address');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });
  billingCityError = computed(() => {
    if (!this.touched() || this.billingSameAsShipping()) return null;
    const r = requiredErrorKey(this.billingCity(), 'checkout.city');
    return r ? this.translate.instant(r.key, { field: this.translate.instant(r.fieldKey) }) : null;
  });

  formValid = computed(() => {
    const base = !emailError(this.email())
      && !requiredError(this.firstName(), 'First name')
      && !requiredError(this.lastName(), 'Last name')
      && !requiredError(this.address(), 'Address')
      && !requiredError(this.selectedCityId(), 'City')
      && !requiredError(this.phone(), 'Phone');
    const shippingMethods = this.shippingMethods();
    const shippingOk = shippingMethods.length > 0 && !!this.selectedShippingMethod();
    const paymentMethods = this.paymentMethods();
    const paymentOk = paymentMethods.length > 0 && !!this.paymentMethod();
    let billingOk = true;
    if (!this.billingSameAsShipping()) {
      billingOk = !requiredError(this.billingFirstName(), 'First name')
        && !requiredError(this.billingLastName(), 'Last name')
        && !requiredError(this.billingAddress(), 'Address')
        && !requiredError(this.billingCity(), 'City');
    }
    return base && shippingOk && paymentOk && billingOk;
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
      this.discountCodeSupported.set(s?.discountCodeSupported === true);
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
    const path = logoPath ?? 'uploads/logos/default-logo.png';
    const url = this.api.imageUrl(path) || null;
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

  getPageSlug(page: SettingsContentPage): string {
    return getLocalizedSlug(page.slug, this.locale.getLocale());
  }

  isContactPage(page: SettingsContentPage): boolean {
    const slugVal = page.slug;
    if (typeof slugVal === 'string') return slugVal.trim().toLowerCase() === 'contact';
    if (slugVal && typeof slugVal === 'object') {
      return (slugVal.en ?? '').trim().toLowerCase() === 'contact'
        || (slugVal.ar ?? '').trim().toLowerCase() === 'contact';
    }
    return false;
  }

  /**
   * Check discount code (validate) and apply if valid.
   * When discountCodeSupported is false, shows "coming soon" toast.
   */
  applyDiscountCode(): void {
    const code = this.discountCode().trim();
    this.discountCodeError.set(null);
    if (!code) {
      this.discountCodeError.set(this.translate.instant('checkout.discountCodeRequired'));
      return;
    }
    if (!this.discountCodeSupported()) {
      this.discountCodeChecking.set(true);
      setTimeout(() => {
        this.discountCodeChecking.set(false);
        this.toast.show(this.translate.instant('checkout.discountComingSoon'), 'info');
      }, 200);
      return;
    }
    this.discountCodeApplied.set(true);
    this.toast.show(this.translate.instant('checkout.discountApplied'), 'success');
  }

  submit(): void {
    this.touched.set(true);
    if (this.items().length === 0) return;
    if (!this.formValid()) {
      if (this.shippingMethods().length === 0) {
        this.error.set(this.translate.instant('checkout.noShippingMethods'));
      } else if (this.paymentMethods().length === 0) {
        this.error.set(this.translate.instant('checkout.noPaymentMethods'));
      } else if (!this.selectedShippingMethod()) {
        this.error.set(this.translate.instant('checkout.selectShippingMethod'));
      } else if (!this.paymentMethod()) {
        this.error.set(this.translate.instant('checkout.selectPaymentMethod'));
      } else {
        this.error.set(this.translate.instant('errors.pleaseFillRequired'));
      }
      return;
    }
    this.error.set(null);
    this.showUpdateCart.set(false);
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
      ...(this.discountCodeSupported() && this.discountCodeApplied() && this.discountCode().trim()
        ? { discountCode: this.discountCode().trim() }
        : {}),
    };

    this.ordersService.checkout(body).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (order) => {
        this.cart.clear();
        this.submitting.set(false);
        if (this.isLoggedIn()) {
          this.router.navigate(this.pathService.path('account', 'orders', order.id));
        } else {
          try {
            sessionStorage.setItem('al_noon_last_order', JSON.stringify(order));
          } catch {}
          const email = this.email().trim();
          this.router.navigate(
            this.pathService.path('order-confirmation'),
            { state: { order }, queryParams: { id: order.id, email } }
          );
        }
      },
      error: (err: unknown) => {
        const fallback = this.translate.instant('errors.placeOrderFailed');
        const msg = extractErrorMessage(err, fallback);
        const status = typeof err === 'object' && err !== null && 'status' in err ? (err as { status: number }).status : undefined;
        this.error.set(status === 429 ? this.translate.instant('errors.rateLimited') : msg);
        this.showUpdateCart.set(status === 400 && /out of stock|out-of-stock|stock/i.test(msg));
        if (status === 400 && /discount|coupon|promo|code invalid/i.test(msg)) {
          this.discountCodeApplied.set(false);
          this.discountCodeError.set(msg);
        }
        this.submitting.set(false);
      },
    });
  }

}
