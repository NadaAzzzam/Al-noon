import type { Product, ProductApiShape, ProductCategory } from '../types/api.types';

/**
 * Build images array: image URLs only (for cart/order thumbnails, SEO).
 * Uses full API images[] when present; else viewImage/hoverImage; else media.default/hover where type === 'image'.
 */
function imagesFromMedia(raw: ProductApiShape): string[] {
  if (Array.isArray(raw.images) && raw.images.length > 0) return raw.images;
  if (raw.viewImage) {
    const urls = [raw.viewImage];
    if (raw.hoverImage && raw.hoverImage !== raw.viewImage) urls.push(raw.hoverImage);
    return urls;
  }
  const media = raw.media;
  if (media) {
    const urls: string[] = [];
    if (media.default?.type === 'image' && media.default.url) urls.push(media.default.url);
    if (media.hover?.type === 'image' && media.hover.url && media.hover.url !== urls[0]) urls.push(media.hover.url);
    if (urls.length) return urls;
  }
  return [];
}

/**
 * Build videos array: all video URLs from default, hover, previewVideo, and legacy video/videos[].
 */
function videosFromMedia(raw: ProductApiShape): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (url: string | undefined) => {
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  };
  const media = raw.media;
  if (media?.default?.type === 'video' && media.default.url) add(media.default.url);
  if (media?.hover?.type === 'video' && media.hover.url) add(media.hover.url);
  if (media?.previewVideo?.url) add(media.previewVideo.url);
  if (raw.video) add(raw.video);
  if (Array.isArray(raw.videos)) raw.videos.forEach(add);
  return out;
}

/** Category as returned by API: string id, or object with _id/id and optional name, status (OpenAPI ProductCategoryRef). */
type ApiCategoryRef =
  | (ProductCategory & { _id?: string })
  | { _id?: string; name?: { en?: string; ar?: string }; status?: string }
  | string;

/**
 * Normalize category: ensure id is set (API may send _id, id, or category as string id).
 */
function normalizeCategory(cat: ApiCategoryRef | undefined): ProductCategory | undefined {
  if (cat == null) return undefined;
  if (typeof cat === 'string') {
    const id = cat.trim();
    return id ? { id, name: { en: '', ar: '' } } : undefined;
  }
  const id = String((cat as { id?: string; _id?: string }).id ?? (cat as { _id?: string })._id ?? '');
  return { ...cat, id } as ProductCategory;
}

/**
 * Normalize raw product from API to client Product shape:
 * - _id -> id
 * - discountPrice from API (list/detail/related/home) -> discountPrice (number or omitted; null dropped)
 * - viewImage/hoverImage (or media.default/hover) -> images[] and media
 * - video (or media.previewVideo) -> videos[]
 * - category._id -> category.id
 */
export function normalizeProductFromApi(raw: ProductApiShape & { _id?: string }): Product {
  const id = String(raw.id ?? raw._id ?? '');
  const images = imagesFromMedia(raw);
  const videos = videosFromMedia(raw);
  const category = normalizeCategory(raw.category);

  const {
    _id,
    media,
    images: _img,
    videos: _vid,
    viewImage,
    hoverImage,
    video,
    discountPrice: rawDiscountPrice,
    ...rest
  } = raw;
  void _img;
  void _vid;

  const discountPrice =
    rawDiscountPrice != null && typeof rawDiscountPrice === 'number' ? rawDiscountPrice : undefined;

  const mediaNormalized =
    media ??
    (raw.viewImage || raw.hoverImage
      ? {
        default: raw.viewImage ? { type: 'image' as const, url: raw.viewImage } : undefined,
        hover: raw.hoverImage ? { type: 'image' as const, url: raw.hoverImage } : undefined,
        previewVideo: raw.video ? { type: 'video' as const, url: raw.video } : undefined,
      }
      : undefined);

  return {
    ...rest,
    id,
    images,
    ...(discountPrice !== undefined ? { discountPrice } : {}),
    ...(mediaNormalized ? { media: mediaNormalized } : {}),
    ...(videos.length ? { videos } : {}),
    ...(category ? { category } : {}),
    ...(raw['availability'] ? { availability: raw['availability'] } : {}),
    ...(raw['formattedDetails'] ? { formattedDetails: raw['formattedDetails'] } : {}),
  } as Product;
}
