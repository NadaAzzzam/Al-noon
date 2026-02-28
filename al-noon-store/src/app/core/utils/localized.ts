import type { LocalizedText } from '../types/api.types';
import type { Locale } from '../services/locale.service';

export function getLocalized(obj: LocalizedText | undefined | null, locale: Locale): string {
  if (!obj || typeof obj !== 'object') return '';
  const text = obj[locale] ?? obj.en ?? obj.ar;
  return typeof text === 'string' ? text : '';
}

/** Resolve slug from BE slug: { en, ar } (or legacy string) by locale. */
export function getLocalizedSlug(
  slug: { en?: string; ar?: string } | string | undefined | null,
  locale: Locale
): string {
  if (!slug) return '';
  if (typeof slug === 'string') return slug;
  const text = slug[locale] ?? slug.en ?? slug.ar;
  return typeof text === 'string' ? text : '';
}
