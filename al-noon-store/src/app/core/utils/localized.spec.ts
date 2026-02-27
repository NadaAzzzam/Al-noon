import { describe, it, expect } from 'vitest';
import { getLocalized } from './localized';
import type { LocalizedText } from '../types/api.types';

describe('localized', () => {
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
