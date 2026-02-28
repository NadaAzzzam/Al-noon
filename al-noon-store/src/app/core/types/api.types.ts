/**
 * Store API types. Keep in sync with backend OpenAPI spec.
 * Regenerate schema types: npm run generate:api-types (from BE) or npm run generate:api-types:local (from spec.json).
 * Raw OpenAPI-generated types: see api.schema.ts (paths, components).
 */
import type { components } from './api.schema';
/** Generic API success response (list endpoints may include pagination + appliedFilters). */
export interface ApiSuccess<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: Pagination;
  /** Present on list endpoints that support filters. */
  appliedFilters?: Record<string, unknown>;
}

/** Generic API error response (matches OpenAPI ApiError) */
export interface ApiError {
  success: false;
  message: string;
  code?: string | null;
  data: object | null;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Health */
export interface HealthData {
  status: string;
  dbConnected: boolean;
}

/** Store – localized text (OpenAPI LocalizedString) */
export interface LocalizedText {
  en: string;
  ar: string;
}

/** BE sends label; FE uses title. Store service normalizes label → title. */
export interface StoreQuickLink {
  title: LocalizedText;
  /** Backend may send label instead of title */
  label?: LocalizedText;
  url: string;
  order?: number;
}

export interface StoreSocialLink {
  platform: string;
  url: string;
}

export interface HomeCollection {
  title: LocalizedText;
  image?: string;
  /** Optional video URL; when present, show video instead of image */
  video?: string;
  /** Image to show on hover (image swap); ignored when video is shown */
  hoverImage?: string;
  url: string;
  /** Category id/slug for catalog filter; used to build url when url is empty or to link to category */
  categoryId?: string;
  order?: number;
}

export interface StoreHero {
  images?: string[];
  videos?: string[];
  title?: LocalizedText;
  subtitle?: LocalizedText;
  ctaLabel?: LocalizedText;
  ctaUrl?: string;
}

/** BE returns _id, message, customerName; FE uses id, comment. Store service normalizes. */
export interface StoreFeedback {
  id: string;
  product?: { name?: LocalizedText };
  rating?: number;
  /** Display text (normalized from BE message) */
  comment?: string;
  /** Backend field name */
  message?: string;
  customerName?: string;
  approved?: boolean;
  image?: string;
}

export interface StoreData {
  storeName: LocalizedText;
  logo?: string;
  quickLinks: StoreQuickLink[];
  socialLinks: StoreSocialLink[];
  newsletterEnabled: boolean;
  homeCollections: HomeCollection[];
  hero: StoreHero;
  heroEnabled: boolean;
  newArrivalsLimit: number;
  /** New arrival products from GET /api/store/home (data.home.newArrivals). */
  newArrivals?: Product[];
  newArrivalsSectionImages?: string[];
  newArrivalsSectionVideos?: string[];
  ourCollectionSectionImages?: string[];
  ourCollectionSectionVideos?: string[];
  feedbackSectionEnabled: boolean;
  feedbackDisplayLimit: number;
  feedbacks: StoreFeedback[];
}

/** Content page */
export interface ContentPage {
  slug: string;
  title: LocalizedText;
  content: LocalizedText;
}

/** Auth */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  token: string;
  user: AuthUser;
}

/** Product */

/** API media object (OpenAPI ProductMediaItem): type, url, optional alt/durationSeconds */
export interface ProductMediaItem {
  type: 'image' | 'video' | 'gif';
  url: string;
  alt?: string | null;
  durationSeconds?: number | null;
}

export interface ProductMedia {
  default?: ProductMediaItem;
  hover?: ProductMediaItem;
  previewVideo?: ProductMediaItem;
}

export interface ProductCategory {
  id: string;
  name: LocalizedText;
  status?: string;
  _id?: string;
}

/** API may return imageColors as string[] (URLs) or { color?, imageUrl? }[] */
export interface ProductImageColor {
  color?: string;
  imageUrl?: string;
}

/** Variant stock (color/size combination). */
export interface ProductVariantStock {
  color?: string;
  size?: string;
  stock: number;
  outOfStock?: boolean;
}

/** Per-color availability (GET product with variant support). Includes color-specific image when hasImage is true. */
export interface ProductAvailabilityColor {
  color: string;
  available: boolean;
  outOfStock: boolean;
  /** Number of sizes in stock for this color. */
  availableSizeCount?: number;
  /** True when at least one image is linked to this color via imageColors. */
  hasImage?: boolean;
  /** First image URL for this color when hasImage is true. */
  imageUrl?: string;
}

/** Per-size availability (GET product with variant support). */
export interface ProductAvailabilitySize {
  size: string;
  available: boolean;
  outOfStock: boolean;
}

/** Variant availability (colors, sizes, and per-variant stock). */
export interface ProductAvailabilityInfo {
  /** Total number of sizes that are available (in stock) for this product. */
  availableSizeCount?: number;
  /** e.g. "estimated" when variants are derived from product stock; omitted when variants are explicit. */
  variantsSource?: string;
  colors?: ProductAvailabilityColor[];
  sizes?: ProductAvailabilitySize[];
  /** Per color+size stock. Use this for filtering; product.variants at root may be empty. */
  variants?: ProductVariantStock[];
}

/** Rich text block for formattedDetails (title, paragraph, list). */
export type FormattedDetailBlock =
  | { type: 'title'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

/** Formatted product details by locale (e.g. en, ar). */
export type FormattedDetails = Record<string, FormattedDetailBlock[]>;

/** Raw product from API (may have _id, media, or viewImage/hoverImage/video). */
export interface ProductApiShape extends Omit<Product, 'id' | 'images' | 'videos' | 'category'> {
  _id?: string;
  id?: string;
  /** New API: media.default, media.hover, media.previewVideo. Old API may still send images. */
  media?: ProductMedia;
  images?: string[];
  videos?: string[];
  /** Single-home / product APIs: main image (required in API), hover image, optional video. */
  viewImage?: string;
  hoverImage?: string;
  video?: string;
  /** API may send category as string (id) or populated object (OpenAPI ProductListItem/ProductData). */
  category?: string | components['schemas']['ProductCategoryRef'] | (ProductCategory & { _id?: string });
}

/** Product (normalized for client). API uses _id; normalized to id. Media normalized to images/videos. */
export interface Product {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  discountPrice?: number;
  images: string[];
  /** When present, catalog/card uses media.default for main image and media.hover on hover (previewVideo ignored in card). */
  media?: ProductMedia;
  /** Top-level product API shape: viewImage (main), hoverImage (hover), video (optional). Normalizer maps these to images/media/videos. */
  viewImage?: string;
  hoverImage?: string;
  video?: string;
  /** API may return string[] (URLs) or { color?, imageUrl? }[] */
  imageColors?: (string | ProductImageColor)[];
  videos?: string[];
  stock: number;
  /** Products API: low stock = ACTIVE (visible); out of stock = INACTIVE (hidden). */
  status: string;
  isNewArrival?: boolean;
  sizes?: string[];
  /** API: string[]; may also be LocalizedText */
  sizeDescriptions?: LocalizedText | string[];
  colors?: string[];
  details?: LocalizedText;
  /** Parsed rich text (title/paragraph/list blocks) when API provides it. */
  formattedDetails?: FormattedDetails;
  stylingTip?: LocalizedText;
  category?: ProductCategory;
  /** Variant availability (colors/sizes/variants with stock). Real variant data lives in availability.variants. */
  availability?: ProductAvailabilityInfo;
  /** API: effective price to display (discount applied). When present, use instead of computing from discountPrice/price. */
  effectivePrice?: number;
  /** API: whether product has any stock (any variant or global stock > 0). Use for sold-out badge when present. */
  inStock?: boolean;
  /** API: preferred type for default media (e.g. "video", "image"). */
  defaultMediaType?: string;
  /** API: preferred type for hover media (e.g. "image", "video"). */
  hoverMediaType?: string;
  /** URL-friendly identifier for product (e.g. melton-abaya). Use for links and canonical when present. */
  slug?: string;
  /** Product-level SEO meta when API provides. Overrides name/description for meta tags. */
  seoTitle?: LocalizedText;
  seoDescription?: LocalizedText;
  /** Canonical URL for product page (full URL). When set, used for canonical link. */
  canonicalUrl?: string;
  /** Present on list when ratings exist (OpenAPI) */
  averageRating?: number | null;
  ratingCount?: number | null;
  soldQty?: number | null;
  /** Product tags (e.g. "Elegant", "Summer") for display and filtering. */
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

/** Sort values from GET /api/products/filters/sort (e.g. BEST_SELLING, CREATED_DESC, PRICE_ASC). */
export type ProductSort =
  | 'BEST_SELLING'
  | 'CREATED_DESC'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'TITLE_ASC'
  | 'TITLE_DESC'
  | 'MANUAL';

export type ProductAvailability = 'inStock' | 'outOfStock' | 'all';

/** Option for filter dropdowns (GET /api/products/filters/availability, GET /api/products/filters/sort) */
export interface ProductFilterOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

/** List products query (GET /products: status is ACTIVE | INACTIVE) */
export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  /** Lookup by slug (e.g. for resolving slug→id before GET /products/:id) */
  slug?: string;
  /** Use ACTIVE for storefront. API convention: low stock = ACTIVE, out of stock = INACTIVE. */
  status?: 'ACTIVE' | 'INACTIVE';
  category?: string;
  newArrival?: boolean;
  availability?: ProductAvailability;
  color?: string;
  /** Filter by tags (comma-separated); passed to API as-is. */
  tags?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  minRating?: number;
}

/** Echo of list products query params applied (OpenAPI ProductListAppliedFilters). */
export interface ProductsListAppliedFilters {
  sort?: ProductSort;
  availability?: ProductAvailability;
  tags?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | null;
  category?: string | null;
  search?: string | null;
  newArrival?: boolean | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  color?: string | null;
  minRating?: number | null;
}

export interface ProductsListResponse {
  data: Product[];
  pagination: Pagination;
  appliedFilters?: ProductsListAppliedFilters;
}

/** Category status (OpenAPI: visible | hidden; store may filter by PUBLISHED as alias for visible) */
export type CategoryStatus = 'visible' | 'hidden' | 'PUBLISHED';

/** Category (OpenAPI CategoryData: API may send _id; normalize to id in services) */
export interface Category {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  status: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

/** City (API may send _id; normalize to id in services) */
export interface City {
  id: string;
  name: LocalizedText;
  deliveryFee: number;
  _id?: string;
}

/** ═══ Structured Address (checkout form & order) ═══ */
export interface StructuredAddress {
  address: string;
  apartment?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country?: string; // always "Egypt" (default)
}

/** ═══ Shipping Method (GET /api/shipping-methods) ═══ */
export interface ShippingMethod {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  estimatedDays: string;
  /** Price for this method (EGP); may be 0. When set, checkout can show it instead of or with city delivery fee. */
  price?: number;
}

/** Raw shipping method from API (has _id, estimatedDays as { min, max }, price). */
export interface ShippingMethodRaw {
  _id?: string;
  id?: string;
  name?: LocalizedText;
  description?: LocalizedText;
  estimatedDays?: string | { min?: number; max?: number };
  price?: number;
  enabled?: boolean;
  order?: number;
  [key: string]: unknown;
}

/** ═══ Governorate (GET /api/governorates) ═══ */
export interface Governorate {
  id: string;
  name: LocalizedText;
}

/** Order */
export type PaymentMethod = 'COD' | 'INSTAPAY';

/** Payment method option from GET /api/payment-methods (id + localized name + optional instaPayNumber) */
export interface PaymentMethodOption {
  id: PaymentMethod;
  name: LocalizedText;
  /** InstaPay transfer number (when id is INSTAPAY) */
  instaPayNumber?: string;
}

/** GET /api/payment-methods response */
export interface PaymentMethodsApiResponse {
  success: true;
  data: { paymentMethods: PaymentMethodOption[] };
}

export interface OrderItemInput {
  product: string;
  quantity: number;
  price: number;
}

/** New structured request body for POST /api/orders */
export interface CreateOrderBody {
  items: OrderItemInput[];
  paymentMethod?: PaymentMethod;
  deliveryFee?: number;
  /** New structured fields */
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  shippingAddress?: string | StructuredAddress;
  billingAddress?: StructuredAddress | null;
  specialInstructions?: string;
  shippingMethod?: string;
  emailNews?: boolean;
  textNews?: boolean;
  /** Discount/promo code; validated and applied server-side when BE supports it */
  discountCode?: string;
  /** Legacy guest checkout fields (still accepted by BE) */
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

/** API OrderItem has product: string (id) or populated Product; we normalize to Product in services. */
export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface OrderPayment {
  method?: string;
  status?: string;
  instaPayProofUrl?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  /** User ID when authenticated; null for guest checkout (OpenAPI OrderData) */
  user?: string | null;
  items: OrderItem[];
  total: number;
  deliveryFee?: number | null;
  status: OrderStatus | string;
  paymentMethod?: PaymentMethod | null;
  /** New: structured address; legacy: flat string. Union for backwards compat. */
  shippingAddress?: string | StructuredAddress | null;
  billingAddress?: StructuredAddress | null;
  payment?: OrderPayment | null;
  createdAt?: string;
  updatedAt?: string;
  /** New structured fields from API */
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  specialInstructions?: string | null;
  shippingMethod?: string | null;
  emailNews?: boolean;
  textNews?: boolean;
  /** Present when order was placed as guest checkout (BE returns these) */
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
}

/** Client shape for list orders (after mapping from API) */
export interface OrdersListResponse {
  data: Order[];
  pagination: Pagination;
}

/** Newsletter */
export interface NewsletterSubscribeBody {
  email: string;
}

/** 409 when email already subscribed (OpenAPI NewsletterConflictResponse) */
export interface NewsletterConflictResponse {
  success: false;
  message: string;
  code?: string;
  data: object | null;
  alreadySubscribed: true;
}

/** Contact (OpenAPI submitStoreContact: required email only) */
/** Request body for POST /api/store/contact (Contact Us form). */
export interface ContactBody {
  name: string;
  email: string;
  phone?: string;
  comment: string;
}

/** AI Chat */
export interface AiSettings {
  enabled: boolean;
  greeting: LocalizedText;
  suggestedQuestions: { en: string; ar: string }[];
}

export interface AiChatRequest {
  message: string;
  sessionId?: string;
  locale?: 'en' | 'ar';
}

/** AI product card (OpenAPI: name may be LocalizedText) */
export interface AiProductCard {
  id: string;
  /** API may return LocalizedText; display layer can use localized pipe */
  name: string | LocalizedText;
  image?: string;
  productUrl: string;
}

export interface AiChatResponse {
  sessionId: string;
  response: string;
  productCards?: AiProductCard[];
}

// ----- API response wrappers (OpenAPI spec shapes; map in services) -----

/** GET /orders – PaginatedOrdersResponse (OpenAPI: data = array of orders, pagination at root) */
export interface PaginatedOrdersApiResponse {
  success: true;
  /** BE returns data as Order[] (not data.orders); service accepts both. */
  data: Order[] | { orders: Order[]; pagination?: Pagination };
  pagination?: Pagination;
  message?: string;
}

/** GET/POST /orders/:id – OrderResponse */
export interface OrderApiResponse {
  success: true;
  data: { order: Order };
  message?: string;
}

/** GET /cities – CitiesResponse */
export interface CitiesApiResponse {
  success: true;
  data: { cities: City[] };
}

/** GET /cities/:id – CityResponse */
export interface CityApiResponse {
  success: true;
  data: { city: City };
}

/** GET /categories – CategoriesResponse */
export interface CategoriesApiResponse {
  success: true;
  data: { categories: Category[] };
}

/**
 * Raw home payload from GET /api/store/home (data.home).
 * Flat object: all former store fields + home-only fields (announcementBar, promoBanner,
 * newArrivalsLimit, homeCollectionsDisplayLimit, section images/videos).
 * GET /api/store was removed; store data is now returned only via store/home.
 * newArrivals items match ProductListItem: price, discountPrice, media, sizes, colors, etc.
 */
export interface StoreHomeData {
  storeName?: LocalizedText;
  logo?: string;
  quickLinks?: unknown;
  socialLinks?: unknown;
  newsletterEnabled?: boolean;
  hero?: StoreHero;
  heroEnabled?: boolean;
  newArrivalsLimit?: number;
  homeCollectionsDisplayLimit?: number;
  /** Product list items (price, discountPrice, media); normalized via normalizeProductFromApi. */
  newArrivals?: (ProductApiShape & { _id?: string })[];
  newArrivalsSectionImages?: string[];
  newArrivalsSectionVideos?: string[];
  ourCollectionSectionImages?: string[];
  ourCollectionSectionVideos?: string[];
  homeCollections?: unknown;
  feedbackSectionEnabled?: boolean;
  feedbackDisplayLimit?: number;
  feedbacks?: unknown;
  announcementBar?: { text?: LocalizedText; enabled?: boolean; backgroundColor?: string };
  promoBanner?: { enabled?: boolean; image?: string; title?: LocalizedText; subtitle?: LocalizedText; ctaLabel?: LocalizedText; ctaUrl?: string };
  [key: string]: unknown;
}

/** Alias for raw data.home shape (flat StoreHomeData). */
export type HomeDataRaw = StoreHomeData;

/** Normalized home data for the app (store and newArrivals normalized). */
export interface HomeData {
  store: StoreData;
  hero: StoreHero;
  heroEnabled: boolean;
  newArrivals: Product[];
  homeCollections: HomeCollection[];
  feedbackSectionEnabled: boolean;
  feedbackDisplayLimit: number;
  feedbacks: StoreFeedback[];
  announcementBar?: HomeDataRaw['announcementBar'];
  promoBanner?: HomeDataRaw['promoBanner'];
}

/** GET /store/home – response envelope. */
export interface HomeApiResponse {
  success: true;
  data: { home: HomeDataRaw };
  message?: string;
}

/** GET /store/page/:slug – PageResponse */
export interface PageApiResponse {
  success: true;
  data: { page: ContentPage };
}

/** Raw GET /api/products/:id – response shape (data.product + optional availability, formattedDetails). */
export interface ProductDetailData {
  product: ProductApiShape & { _id?: string };
  availability?: ProductAvailabilityInfo;
  formattedDetails?: FormattedDetails;
}

/** GET /api/products/:id – ProductResponse (single product detail). */
export interface ProductApiResponse {
  success: true;
  data: ProductDetailData | { product: Product & { _id?: string } };
  message?: string;
}

/** Raw GET /api/products/:id/related – array of product list items (same shape as list; includes discountPrice). */
export type RelatedProductsApiResponse = ApiSuccess<(ProductApiShape & { _id?: string })[]>;

/** GET /shipping-methods – ShippingMethodsResponse */
export interface ShippingMethodsApiResponse {
  success: true;
  data: ShippingMethod[];
}

/** GET /governorates – GovernoratesResponse */
export interface GovernoratesApiResponse {
  success: true;
  data: Governorate[];
}

/** GET /api/settings – announcement bar and other app settings */
export interface AnnouncementBarSettings {
  text?: LocalizedText;
  enabled?: boolean;
  /** Hex e.g. "#1a1a2e" or "linear-gradient(...)" */
  backgroundColor?: string;
}

/** SEO page meta (title + description per locale) from GET /api/settings seoSettings */
export interface SeoPageMeta {
  title?: LocalizedText;
  description?: LocalizedText;
}

/** Product page SEO: title suffix appended to product name (e.g. " - Al-noon Store") */
export interface SeoProductPageMeta {
  titleSuffix?: LocalizedText;
}

/** SEO settings from GET /api/settings (data.settings.seoSettings) */
export interface SeoSettings {
  homePageMeta?: SeoPageMeta;
  catalogPageMeta?: SeoPageMeta;
  productPageMeta?: SeoProductPageMeta;
  ogImage?: string;
  twitterCard?: string;
  defaultMetaDescription?: LocalizedText;
  defaultMetaKeywords?: LocalizedText;
}

/** Stock display thresholds from BE: when to show "low stock" vs "stock available" messages */
export interface StockDisplaySettings {
  /** Show "low stock" when 0 < stock <= this (BE-driven, e.g. 5) */
  lowStockThreshold?: number;
  /** Show "stock available" when lowStockThreshold < stock <= this (BE-driven, e.g. 10) */
  stockInfoThreshold?: number;
}

/** Content page item in GET /api/settings (data.settings.contentPages). */
export interface SettingsContentPage {
  slug: string;
  title?: LocalizedText;
}

/** Normalized settings consumed by the app (from GET /api/settings via StoreService.getSettings()). */
export interface Settings {
  storeName?: LocalizedText;
  logo?: string;
  announcementBar?: AnnouncementBarSettings;
  /** Social links as object (e.g. { facebook, instagram }). */
  socialLinks?: Record<string, string>;
  /** When false, hide social links in header/footer. Default true when not set. */
  showSocialLinks?: boolean;
  newsletterEnabled?: boolean;
  /** Content pages (privacy, return-policy, shipping-policy, about, contact). */
  contentPages?: SettingsContentPage[];
  stockDisplay?: StockDisplaySettings;
  /** Currency code (e.g. EGP); used for price display. */
  currency?: string;
  /** Currency symbol/prefix (e.g. LE); used for price display. */
  currencySymbol?: string;
  /** SEO meta (home/catalog/product page meta, og image, twitter card, defaults). */
  seoSettings?: SeoSettings;
}

/**
 * Raw GET /api/settings response: data.settings (BE returns data: { settings: SettingsRaw }).
 * Verified shape: storeName, logo, announcementBar, socialLinks, newsletterEnabled,
 * contentPages[], currency, currencySymbol. Optional: lowStockThreshold, stockInfoThreshold.
 */
export interface SettingsRaw {
  storeName?: LocalizedText;
  logo?: string;
  announcementBar?: AnnouncementBarSettings;
  /** Social links as object (e.g. { facebook: string, instagram: string }). */
  socialLinks?: Record<string, string>;
  /** When false, hide social links in header/footer. Default true when not set. */
  showSocialLinks?: boolean;
  newsletterEnabled?: boolean;
  /** Content pages (privacy, return-policy, shipping-policy, about, contact). */
  contentPages?: SettingsContentPage[];
  /** At root level in API (not under stockDisplay). */
  lowStockThreshold?: number;
  stockInfoThreshold?: number;
  /** Currency code (e.g. EGP). */
  currency?: string;
  /** Currency symbol/prefix (e.g. LE). */
  currencySymbol?: string;
  /** SEO settings (homePageMeta, catalogPageMeta, productPageMeta, ogImage, twitterCard, etc.). */
  seoSettings?: SeoSettings;
  [key: string]: unknown;
}

export interface SettingsApiResponse {
  success: true;
  data: { settings: SettingsRaw };
  message?: string;
}

// ----- Schema-derived API response types (source: api.schema.ts; use for HTTP response typing) -----
export type SchemaProductListItem = components['schemas']['ProductListItem'];
export type SchemaProductData = components['schemas']['ProductData'];
export type SchemaStoreHomeResponse = components['schemas']['StoreHomeResponse'];
export type SchemaPaginatedProductsResponse = components['schemas']['PaginatedProductsResponse'];
export type SchemaProductResponse = components['schemas']['ProductResponse'];
export type SchemaRelatedProductsResponse = components['schemas']['RelatedProductsResponse'];
export type SchemaProductListAppliedFilters = components['schemas']['ProductListAppliedFilters'];
