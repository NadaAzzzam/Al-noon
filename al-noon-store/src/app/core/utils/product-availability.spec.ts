import { describe, it, expect } from 'vitest';
import {
  getAvailableSizesForColor,
  getAvailableColorsForSize,
  isVariantAvailable,
  getVariantStock,
} from './product-availability';
import type { Product } from '../types/api.types';

describe('product-availability', () => {
  const productWithVariants: Product = {
    id: '1',
    name: { en: 'Test', ar: 'اختبار' },
    sizes: ['S', 'M', 'L'],
    colors: ['Red', 'Blue'],
    stock: 10,
    availability: {
      variants: [
        { color: 'Red', size: 'S', stock: 5, outOfStock: false },
        { color: 'Red', size: 'M', stock: 0, outOfStock: true },
        { color: 'Blue', size: 'S', stock: 3, outOfStock: false },
        { color: 'Blue', size: 'L', stock: 2, outOfStock: false },
      ],
    },
  } as Product;

  const productWithoutVariants: Product = {
    id: '2',
    name: { en: 'Simple', ar: 'بسيط' },
    sizes: ['S', 'M'],
    colors: ['Black'],
    stock: 5,
  } as Product;

  describe('getAvailableSizesForColor', () => {
    it('returns empty array when product is null', () => {
      expect(getAvailableSizesForColor(null, 'Red')).toEqual([]);
    });

    it('returns all sizes when color is null (no variant filter)', () => {
      expect(getAvailableSizesForColor(productWithVariants, null)).toEqual(['S', 'M', 'L']);
    });

    it('returns sizes with stock for the given color', () => {
      expect(getAvailableSizesForColor(productWithVariants, 'Red')).toEqual(['S']);
      expect(getAvailableSizesForColor(productWithVariants, 'Blue')).toEqual(['S', 'L']);
    });

    it('returns all product sizes when no variants', () => {
      expect(getAvailableSizesForColor(productWithoutVariants, 'Black')).toEqual(['S', 'M']);
    });
  });

  describe('getAvailableColorsForSize', () => {
    it('returns empty array when product is null', () => {
      expect(getAvailableColorsForSize(null, 'S')).toEqual([]);
    });

    it('returns all colors when size is null', () => {
      expect(getAvailableColorsForSize(productWithVariants, null)).toEqual(['Red', 'Blue']);
    });

    it('returns colors with stock for the given size', () => {
      expect(getAvailableColorsForSize(productWithVariants, 'S')).toEqual(['Red', 'Blue']);
      expect(getAvailableColorsForSize(productWithVariants, 'L')).toEqual(['Blue']);
    });

    it('returns all product colors when no variants', () => {
      expect(getAvailableColorsForSize(productWithoutVariants, 'S')).toEqual(['Black']);
    });
  });

  describe('isVariantAvailable', () => {
    it('returns false when product is null', () => {
      expect(isVariantAvailable(null, 'Red', 'S')).toBe(false);
    });

    it('returns false when color or size is null', () => {
      expect(isVariantAvailable(productWithVariants, null, 'S')).toBe(false);
      expect(isVariantAvailable(productWithVariants, 'Red', null)).toBe(false);
    });

    it('returns true for in-stock variant', () => {
      expect(isVariantAvailable(productWithVariants, 'Red', 'S')).toBe(true);
      expect(isVariantAvailable(productWithVariants, 'Blue', 'S')).toBe(true);
    });

    it('returns false for out-of-stock variant', () => {
      expect(isVariantAvailable(productWithVariants, 'Red', 'M')).toBe(false);
    });

    it('returns false for non-existent variant', () => {
      expect(isVariantAvailable(productWithVariants, 'Red', 'L')).toBe(false);
    });
  });

  describe('getVariantStock', () => {
    it('returns 0 when product is null', () => {
      expect(getVariantStock(null, 'Red', 'S')).toBe(0);
    });

    it('returns variant stock when variant exists', () => {
      expect(getVariantStock(productWithVariants, 'Red', 'S')).toBe(5);
      expect(getVariantStock(productWithVariants, 'Blue', 'S')).toBe(3);
    });

    it('returns 0 for out-of-stock variant', () => {
      expect(getVariantStock(productWithVariants, 'Red', 'M')).toBe(0);
    });

    it('returns product stock when no variants', () => {
      expect(getVariantStock(productWithoutVariants, 'Black', 'S')).toBe(5);
    });
  });
});
