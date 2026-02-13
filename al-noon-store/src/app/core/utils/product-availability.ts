import type { Product } from '../types/api.types';

/**
 * Get available sizes for a selected color.
 * When product has variants: returns sizes that have stock for that color.
 * When no variants: returns all product sizes (caller may use availability.sizes for out-of-stock).
 */
export function getAvailableSizesForColor(product: Product | null, color: string | null): string[] {
  if (!product?.sizes?.length || color == null) return product?.sizes ?? [];
  const variants = product.availability?.variants;
  if (variants?.length) {
    const sizes = variants
      .filter((v) => v.color === color && !v.outOfStock && v.stock > 0)
      .map((v) => v.size)
      .filter((s): s is string => !!s);
    return [...new Set(sizes)];
  }
  return product.sizes;
}

/**
 * Get available colors for a selected size.
 * When product has variants: returns colors that have stock for that size.
 * When no variants: returns all product colors (caller may use availability.colors for out-of-stock).
 */
export function getAvailableColorsForSize(product: Product | null, size: string | null): string[] {
  if (!product?.colors?.length || size == null) return product?.colors ?? [];
  const variants = product.availability?.variants;
  if (variants?.length) {
    const colors = variants
      .filter((v) => v.size === size && !v.outOfStock && v.stock > 0)
      .map((v) => v.color)
      .filter((c): c is string => !!c);
    return [...new Set(colors)];
  }
  return product.colors;
}

/**
 * Check if a color+size combination is available (in stock).
 */
export function isVariantAvailable(
  product: Product | null,
  color: string | null,
  size: string | null
): boolean {
  if (!product || color == null || size == null) return false;
  const variants = product.availability?.variants;
  if (variants?.length) {
    const v = variants.find((x) => x.color === color && x.size === size);
    return v ? !v.outOfStock && v.stock > 0 : false;
  }
  const colorOk = !product.availability?.colors?.find((c) => c.color === color)?.outOfStock;
  const sizeOk = !product.availability?.sizes?.find((s) => s.size === size)?.outOfStock;
  return colorOk && sizeOk && product.stock > 0;
}

/**
 * Get stock count for the selected variant (color+size).
 * Returns 0 when variant is out of stock or not found; otherwise variant.stock or product.stock.
 */
export function getVariantStock(
  product: Product | null,
  color: string | null,
  size: string | null
): number {
  if (!product) return 0;
  const variants = product.availability?.variants;
  if (variants?.length && color != null && size != null) {
    const v = variants.find((x) => x.color === color && x.size === size);
    if (v) return v.outOfStock ? 0 : Math.max(0, v.stock ?? 0);
  }
  return Math.max(0, product.stock ?? 0);
}
