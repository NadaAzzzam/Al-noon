import type { Product, ProductApiShape, ProductCategory } from '../types/api.types';

/**
 * Build images array from API media object (default + hover image URLs).
 * Falls back to existing images array if no media.
 */
function imagesFromMedia(raw: ProductApiShape): string[] {
  const media = raw.media;
  if (media) {
    const urls: string[] = [];
    if (media.default?.url) urls.push(media.default.url);
    if (media.hover?.url && media.hover.url !== media.default?.url) urls.push(media.hover.url);
    if (urls.length) return urls;
  }
  return Array.isArray(raw.images) ? raw.images : [];
}

/**
 * Build videos array from API media.previewVideo.
 */
function videosFromMedia(raw: ProductApiShape): string[] {
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
 * - media.default/hover -> images[]
 * - media.previewVideo -> videos[]
 * - category._id -> category.id
 */
export function normalizeProductFromApi(raw: ProductApiShape & { _id?: string }): Product {
  const id = String(raw.id ?? raw._id ?? '');
  const images = imagesFromMedia(raw);
  const videos = videosFromMedia(raw);
  const category = normalizeCategory(raw.category);

  const { _id, media, images: _img, videos: _vid, ...rest } = raw;
  void _img;
  void _vid;

  return {
    ...rest,
    id,
    images,
    ...(media ? { media } : {}),
    ...(videos.length ? { videos } : {}),
    ...(category ? { category } : {}),
  } as Product;
}
