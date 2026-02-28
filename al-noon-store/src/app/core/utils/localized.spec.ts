import { describe, it, expect } from 'vitest';
import { getLocalized, getLocalizedSlug } from './localized';
import type { LocalizedText } from '../types/api.types';

describe('localized', () => {
  describe('getLocalizedSlug', () => {
    it('returns empty string for null or undefined', () => {
      expect(getLocalizedSlug(null, 'en')).toBe('');
      expect(getLocalizedSlug(undefined, 'en')).toBe('');
    });

    it('returns string when slug is a string', () => {
      expect(getLocalizedSlug('wool-cape', 'en')).toBe('wool-cape');
    });

    it('returns en/ar by locale when slug is { en, ar }', () => {
      expect(getLocalizedSlug({ en: 'wool-cape', ar: 'كاب-صوف' }, 'en')).toBe('wool-cape');
      expect(getLocalizedSlug({ en: 'wool-cape', ar: 'كاب-صوف' }, 'ar')).toBe('كاب-صوف');
    });

    it('falls back across locales when one missing', () => {
      expect(getLocalizedSlug({ en: 'only-en' }, 'ar')).toBe('only-en');
      expect(getLocalizedSlug({ ar: 'only-ar' }, 'en')).toBe('only-ar');
    });
  });

  describe('getLocalized', () => {
    it('returns empty string for null or undefined', () => {
      expect(getLocalized(null, 'en')).toBe('');
      expect(getLocalized(undefined, 'en')).toBe('');
    });

    it('returns empty string for non-object', () => {
      expect(getLocalized('string' as never, 'en')).toBe('');
      expect(getLocalized(123 as never, 'en')).toBe('');
    });

    it('returns value for requested locale when present', () => {
      expect(getLocalized({ en: 'Hello', ar: 'مرحبا' }, 'en')).toBe('Hello');
      expect(getLocalized({ en: 'Hello', ar: 'مرحبا' }, 'ar')).toBe('مرحبا');
    });

    it('falls back to en when requested locale key is missing', () => {
      expect(getLocalized({ en: 'Hello' } as unknown as LocalizedText, 'ar')).toBe('Hello');
    });

    it('falls back to ar when en key is missing', () => {
      expect(getLocalized({ ar: 'مرحبا' } as unknown as LocalizedText, 'en')).toBe('مرحبا');
    });

    it('returns empty string when no matching value', () => {
      expect(getLocalized({ en: '', ar: '' }, 'en')).toBe('');
    });
  });
});
