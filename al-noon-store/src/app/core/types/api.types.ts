/** Generic API success response */
export interface ApiSuccess<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: Pagination;
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

export interface StoreQuickLink {
  title: LocalizedText;
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

export interface StoreFeedback {
  id: string;
  product?: { name?: LocalizedText };
  rating?: number;
  comment?: string;
  approved?: boolean;
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
export interface ProductCategory {
  id: string;
  name: LocalizedText;
  status?: string;
}

/** API may return imageColors as string[] (URLs) or { color?, imageUrl? }[] */
export interface ProductImageColor {
  color?: string;
  imageUrl?: string;
}

/** Product (OpenAPI ProductData). API uses _id; normalized to id in client. */
export interface Product {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  discountPrice?: number;
  images: string[];
  /** API may return string[] (URLs) or { color?, imageUrl? }[] */
  imageColors?: (string | ProductImageColor)[];
  videos?: string[];
  stock: number;
  status: string;
  isNewArrival?: boolean;
  sizes?: string[];
  /** API: string[]; may also be LocalizedText */
  sizeDescriptions?: LocalizedText | string[];
  colors?: string[];
  details?: LocalizedText;
  stylingTip?: LocalizedText;
  category?: ProductCategory;
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

/** List products query (OpenAPI: status may be DRAFT | PUBLISHED on some endpoints) */
export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'PUBLISHED';
  category?: string;
  newArrival?: boolean;
  availability?: ProductAvailability;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  minRating?: number;
}

export interface ProductsListResponse {
  data: Product[];
  pagination: Pagination;
}

/** Category (OpenAPI: status DRAFT | PUBLISHED) */
export interface Category {
  id: string;
  name: LocalizedText;
  status: string;
}

/** City */
export interface City {
  id: string;
  name: LocalizedText;
  deliveryFee: number;
}

/** Order */
export type PaymentMethod = 'COD' | 'INSTAPAY';

export interface OrderItemInput {
  product: string;
  quantity: number;
  price: number;
}

export interface CreateOrderBody {
  items: OrderItemInput[];
  paymentMethod?: PaymentMethod;
  shippingAddress?: string;
  deliveryFee?: number;
}

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

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  status: string;
  paymentMethod?: PaymentMethod;
  shippingAddress?: string;
  payment?: OrderPayment;
  createdAt?: string;
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

/** Contact */
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

/** GET /orders – PaginatedOrdersResponse */
export interface PaginatedOrdersApiResponse {
  success: true;
  data: { orders: Order[]; pagination: Pagination };
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
