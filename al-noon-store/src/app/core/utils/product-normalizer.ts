import type { Product, ProductApiShape, ProductCategory } from '../types/api.types';

/**
 * Build images array: use full API images[] when present (product detail); else viewImage/hoverImage or media.default/hover for cards.
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
    if (media.default?.url) urls.push(media.default.url);
    if (media.hover?.url && media.hover.url !== media.default?.url) urls.push(media.hover.url);
    if (urls.length) return urls;
  }
  return [];
}

/**
 * Build videos array: prefer API shape video, else media.previewVideo, else videos[].
 */
function videosFromMedia(raw: ProductApiShape): string[] {
  if (raw.video) return [raw.video];
  const url = raw.media?.previewVideo?.url;
  if (url) return [url];
  return Array.isArray(raw.videos) ? raw.videos : [];
}

/**
 * Normalize category: ensure id is set (API may send _id).
 */
function normalizeCategory(cat: (ProductCategory & { _id?: string }) | undefined): ProductCategory | undefined {
  if (!cat) return undefined;
  const id = String(cat.id ?? cat._id ?? '');
  return { ...cat, id };
}

/**
 * Normalize raw product from API to client Product shape:
 * - _id -> id
 * - viewImage/hoverImage (or media.default/hover) -> images[] and media
 * - video (or media.previewVideo) -> videos[]
 * - category._id -> category.id
 */
export function normalizeProductFromApi(raw: ProductApiShape & { _id?: string }): Product {
  const id = String(raw.id ?? raw._id ?? '');
  const images = imagesFromMedia(raw);
  const videos = videosFromMedia(raw);
  const category = normalizeCategory(raw.category);

  const { _id, media, images: _img, videos: _vid, viewImage, hoverImage, video, ...rest } = raw;
  void _img;
  void _vid;

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
    ...(mediaNormalized ? { media: mediaNormalized } : {}),
    ...(videos.length ? { videos } : {}),
    ...(category ? { category } : {}),
  } as Product;
}
