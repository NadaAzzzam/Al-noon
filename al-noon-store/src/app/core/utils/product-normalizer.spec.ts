import { describe, it, expect } from 'vitest';
import { normalizeProductFromApi } from './product-normalizer';
import type { ProductApiShape } from '../types/api.types';

describe('product-normalizer', () => {
  it('normalizes _id to id', () => {
    const raw = { _id: 'abc123', name: { en: 'Test', ar: 'اختبار' } } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.id).toBe('abc123');
  });

  it('uses viewImage for images when present', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: 'اختبار' },
      viewImage: 'https://example.com/img.jpg',
      hoverImage: 'https://example.com/hover.jpg',
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.images).toContain('https://example.com/img.jpg');
    expect(result.images).toContain('https://example.com/hover.jpg');
  });

  it('normalizes category from string', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: 'اختبار' },
      category: 'cat-1',
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.category?.id).toBe('cat-1');
  });

  it('preserves discountPrice when number', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: 'اختبار' },
      discountPrice: 99.5,
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.discountPrice).toBe(99.5);
  });
});
