/** Generic API success response */
export interface ApiSuccess<T> {
  success: true;
  data?: T;
  message?: string;
  pagination?: Pagination;
}

/** Generic API error response */
export interface ApiError {
  success: false;
  message: string;
  code: string;
  data: null;
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

/** Store – localized text */
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

export interface ProductImageColor {
  color?: string;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  price: number;
  discountPrice?: number;
  images: string[];
  imageColors?: ProductImageColor[];
  videos?: string[];
  stock: number;
  status: string;
  isNewArrival?: boolean;
  sizes?: string[];
  sizeDescriptions?: LocalizedText;
  colors?: string[];
  details?: LocalizedText;
  stylingTip?: LocalizedText;
  category?: ProductCategory;
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

export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
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

export interface ProductsListResponse {
  data: Product[];
  pagination: Pagination;
}

/** Category */
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

export interface AiProductCard {
  id: string;
  name: string;
  image?: string;
  productUrl: string;
}

export interface AiChatResponse {
  sessionId: string;
  response: string;
  productCards?: AiProductCard[];
}
