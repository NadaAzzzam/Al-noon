import { Pipe, PipeTransform } from '@angular/core';
import type { LocalizedText } from '../../core/types/api.types';
import type { Locale } from '../../core/services/locale.service';
import { LocaleService } from '../../core/services/locale.service';

@Pipe({ name: 'localized', standalone: true })
export class LocalizedPipe implements PipeTransform {
  constructor(private readonly locale: LocaleService) {}

  transform(value: LocalizedText | undefined | null): string {
    if (!value || typeof value !== 'object') return '';
    const lang = this.locale.getLocale();
    return (value[lang] ?? value.en ?? value.ar ?? '') as string;
  }
}
