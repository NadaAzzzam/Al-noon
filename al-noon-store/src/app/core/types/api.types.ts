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
  /** New arrival products from store API (e.g. GET /api/store). */
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

/** API media object: default, hover, previewVideo (each has type + url) */
export interface ProductMediaItem {
  type?: string;
  url?: string;
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

/** Per-color availability (GET product with variant support). */
export interface ProductAvailabilityColor {
  color: string;
  available: boolean;
  outOfStock: boolean;
}

/** Per-size availability (GET product with variant support). */
export interface ProductAvailabilitySize {
  size: string;
  available: boolean;
  outOfStock: boolean;
}

/** Variant availability (colors, sizes, and per-variant stock). */
export interface ProductAvailabilityInfo {
  colors?: ProductAvailabilityColor[];
  sizes?: ProductAvailabilitySize[];
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
  category?: ProductCategory & { _id?: string };
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
  /** Variant availability (colors/sizes/variants with stock). */
  availability?: ProductAvailabilityInfo;
  /** Present on list when ratings exist (OpenAPI) */
  averageRating?: number | null;
  ratingCount?: number | null;
  soldQty?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export type ProductSort =
  | 'newest'
  | 'priceAsc'
  | 'priceDesc'
  | 'nameAsc'
  | 'nameDesc'
  | 'bestSelling'
  | 'highestSelling'
  | 'lowSelling';

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
  /** Use ACTIVE for storefront. API convention: low stock = ACTIVE, out of stock = INACTIVE. */
  status?: 'ACTIVE' | 'INACTIVE';
  category?: string;
  newArrival?: boolean;
  availability?: ProductAvailability;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  minRating?: number;
}

export interface ProductsListAppliedFilters {
  sort?: string;
  availability?: string;
  status?: string;
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
}

/** ═══ Governorate (GET /api/governorates) ═══ */
export interface Governorate {
  id: string;
  name: LocalizedText;
}

/** Order */
export type PaymentMethod = 'COD' | 'INSTAPAY';

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

/** GET /store – StoreResponse (data may be nested under .store) */
export interface StoreApiResponse {
  success: true;
  data: StoreData | { store: StoreData };
}

/** Raw home payload from API (data.home). */
export interface HomeDataRaw {
  store: Record<string, unknown>;
  hero: StoreHero;
  heroEnabled: boolean;
  newArrivals: (ProductApiShape & { _id?: string })[];
  homeCollections: unknown;
  feedbackSectionEnabled: boolean;
  feedbackDisplayLimit: number;
  feedbacks: unknown;
  announcementBar?: { text?: LocalizedText; enabled?: boolean; backgroundColor?: string };
  promoBanner?: { enabled?: boolean; image?: string; title?: LocalizedText; subtitle?: LocalizedText; ctaLabel?: LocalizedText; ctaUrl?: string };
}

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

/** GET/POST/PUT /products/:id – ProductResponse */
export interface ProductApiResponse {
  success: true;
  data: { product: Product & { _id?: string } };
  message?: string;
}

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
