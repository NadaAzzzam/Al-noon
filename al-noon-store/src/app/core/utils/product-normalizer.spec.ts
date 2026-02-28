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

  it('handles missing optional fields (category, discountPrice, media)', () => {
    const raw = { id: '1', name: { en: 'Minimal', ar: '' } } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.id).toBe('1');
    expect(result.category).toBeUndefined();
    expect(result.discountPrice).toBeUndefined();
    expect(result.images).toEqual([]);
  });

  it('drops null discountPrice (treats as absent)', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      discountPrice: null,
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.discountPrice).toBeUndefined();
  });

  it('drops non-number discountPrice (unexpected type)', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      discountPrice: '99' as unknown as number,
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.discountPrice).toBeUndefined();
  });

  it('passes through extra unknown fields (API version change)', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      extraField: 'ignored',
      newApiField: 123,
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.id).toBe('1');
    const r = result as Record<string, unknown>;
    expect(r['extraField']).toBe('ignored');
    expect(r['newApiField']).toBe(123);
  });

  it('maps metaTitle to seoTitle when seoTitle is absent', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      metaTitle: { en: 'SEO Title | Store', ar: 'عنوان | متجر' },
    } as ProductApiShape & { _id?: string; metaTitle?: { en?: string; ar?: string } };
    const result = normalizeProductFromApi(raw);
    expect(result.seoTitle).toEqual({ en: 'SEO Title | Store', ar: 'عنوان | متجر' });
  });

  it('maps metaDescription to seoDescription when seoDescription is absent', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      metaDescription: { en: 'SEO description', ar: 'وصف' },
    } as ProductApiShape & { _id?: string; metaDescription?: { en?: string; ar?: string } };
    const result = normalizeProductFromApi(raw);
    expect(result.seoDescription).toEqual({ en: 'SEO description', ar: 'وصف' });
  });

  it('normalizes tags from array', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      tags: ['Elegant', 'Summer', 'New'],
    } as ProductApiShape & { _id?: string; tags?: string[] };
    const result = normalizeProductFromApi(raw);
    expect(result.tags).toEqual(['Elegant', 'Summer', 'New']);
  });

  it('normalizes tags from comma-separated string', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      tags: 'Elegant, Summer , New',
    } as ProductApiShape & { _id?: string; tags?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.tags).toEqual(['Elegant', 'Summer', 'New']);
  });

  it('omits tags when empty or absent', () => {
    const raw = { id: '1', name: { en: 'Test', ar: '' } } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);
    expect(result.tags).toBeUndefined();
  });

  it('prefers seoTitle over metaTitle when both present', () => {
    const raw = {
      id: '1',
      name: { en: 'Test', ar: '' },
      seoTitle: { en: 'Preferred' },
      metaTitle: { en: 'Ignored' },
    } as ProductApiShape & { _id?: string; metaTitle?: { en?: string; ar?: string } };
    const result = normalizeProductFromApi(raw);
    expect(result.seoTitle).toEqual({ en: 'Preferred' });
  });

  it('handles full product detail API response with media, availability, formattedDetails', () => {
    const raw = {
      _id: '69a25d919035177dfc00b737',
      name: { en: 'Melton Abaya', ar: 'عباية ميلتون' },
      description: { en: 'Elegant melton fabric abaya for winter.', ar: 'عباية أنيقة من قماش ميلتون للشتاء.' },
      category: {
        _id: '69a25d919035177dfc00b6fe',
        name: { en: 'Abayas', ar: 'عبايات' },
        status: 'visible',
      },
      price: 2100,
      images: [
        '/uploads/products/seed-scarf1.jpg',
        '/uploads/products/seed-scarf2.jpg',
      ],
      imageColors: ['Black', 'Black'],
      media: {
        default: { type: 'image', url: '/uploads/products/seed-scarf1.jpg' },
        hover: { type: 'image', url: '/uploads/products/seed-scarf2.jpg' },
        previewVideo: { type: 'video', url: '/uploads/products/videos/seed-product-sample.mp4' },
      },
      stock: 12,
      status: 'ACTIVE',
      isNewArrival: true,
      sizes: ['S', 'M', 'L'],
      colors: ['Black', 'Grey'],
      details: { en: 'Quality fabric. Care as per label.', ar: 'قماش عالي الجودة. العناية حسب البطاقة.' },
      metaTitle: { en: 'Melton Abaya | Al-noon', ar: 'عباية ميلتون | النون' },
      metaDescription: { en: 'Elegant melton fabric abaya for winter.', ar: 'عباية أنيقة من قماش ميلتون للشتاء.' },
      availability: {
        variantsSource: 'estimated',
        colors: [
          { color: 'Black', available: true, outOfStock: false, hasImage: true, imageUrl: '/uploads/products/seed-scarf1.jpg' },
          { color: 'Grey', available: true, outOfStock: false, hasImage: true, imageUrl: '/uploads/products/seed-fabric2.jpg' },
        ],
        sizes: [
          { size: 'S', available: true, outOfStock: false },
          { size: 'M', available: true, outOfStock: false },
          { size: 'L', available: true, outOfStock: false },
        ],
        variants: [
          { color: 'Black', size: 'S', stock: 2, outOfStock: false },
          { color: 'Black', size: 'M', stock: 2, outOfStock: false },
          { color: 'Black', size: 'L', stock: 2, outOfStock: false },
        ],
      },
      inStock: true,
      formattedDetails: {
        en: [{ type: 'paragraph', text: 'Quality fabric. Care as per label.' }],
        ar: [{ type: 'paragraph', text: 'قماش عالي الجودة. العناية حسب البطاقة.' }],
      },
    } as ProductApiShape & { _id?: string };
    const result = normalizeProductFromApi(raw);

    expect(result.id).toBe('69a25d919035177dfc00b737');
    expect(result.name).toEqual({ en: 'Melton Abaya', ar: 'عباية ميلتون' });
    expect(result.price).toBe(2100);
    expect(result.images).toContain('/uploads/products/seed-scarf1.jpg');
    expect(result.images).toContain('/uploads/products/seed-scarf2.jpg');
    expect(result.media?.default?.url).toBe('/uploads/products/seed-scarf1.jpg');
    expect(result.media?.hover?.url).toBe('/uploads/products/seed-scarf2.jpg');
    expect(result.media?.previewVideo?.url).toBe('/uploads/products/videos/seed-product-sample.mp4');
    expect(result.category?.id).toBe('69a25d919035177dfc00b6fe');
    expect(result.category?.name).toEqual({ en: 'Abayas', ar: 'عبايات' });
    expect(result.sizes).toEqual(['S', 'M', 'L']);
    expect(result.colors).toEqual(['Black', 'Grey']);
    expect(result.inStock).toBe(true);
    expect(result.availability?.variantsSource).toBe('estimated');
    expect(result.availability?.colors).toHaveLength(2);
    expect(result.availability?.variants).toHaveLength(3);
    expect(result.formattedDetails?.en).toHaveLength(1);
    expect(result.formattedDetails?.en?.[0]).toEqual({ type: 'paragraph', text: 'Quality fabric. Care as per label.' });
    expect(result.seoTitle).toEqual({ en: 'Melton Abaya | Al-noon', ar: 'عباية ميلتون | النون' });
    expect(result.seoDescription?.en).toBe('Elegant melton fabric abaya for winter.');
  });
});
