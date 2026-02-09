import type { LocalizedText } from '../types/api.types';
import type { Locale } from '../services/locale.service';

export function getLocalized(obj: LocalizedText | undefined | null, locale: Locale): string {
  if (!obj || typeof obj !== 'object') return '';
  const text = obj[locale] ?? obj.en ?? obj.ar;
  return typeof text === 'string' ? text : '';
}
