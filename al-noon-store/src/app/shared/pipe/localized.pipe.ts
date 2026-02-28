import { Pipe, PipeTransform } from '@angular/core';
import type { LocalizedText } from '../../core/types/api.types';
import type { Locale } from '../../core/services/locale.service';
import { LocaleService } from '../../core/services/locale.service';

@Pipe({ name: 'localized', standalone: true, pure: false })
export class LocalizedPipe implements PipeTransform {
  constructor(private readonly locale: LocaleService) {}

  transform(value: LocalizedText | string | undefined | null, lang?: 'en' | 'ar'): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value !== 'object') return '';
    const l = lang ?? this.locale.getLocale();
    return (value[l] ?? value.en ?? value.ar ?? '') as string;
  }
}
