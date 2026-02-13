import { Pipe, PipeTransform } from '@angular/core';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateService } from '@ngx-translate/core';

/**
 * Formats a price for the current locale.
 * - EN (LTR): currency before number, e.g. "EGP 1,050"
 * - AR (RTL): number then currency, e.g. "1,050 ج.م."
 */
@Pipe({ name: 'priceFormat', standalone: true, pure: false })
export class PriceFormatPipe implements PipeTransform {
  constructor(
    private readonly locale: LocaleService,
    private readonly translate: TranslateService
  ) { }

  transform(value: number | null | undefined, format?: string): string {
    if (value == null || Number.isNaN(value)) return '';
    const num = Number(value);
    const locale = this.locale.getLocale();
    const currency = this.translate.instant('common.currency');
    const useDecimals = format === '1.2-2' || (typeof format === 'string' && format.includes('.'));
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: useDecimals ? 2 : 0,
      maximumFractionDigits: 2,
    };
    const formatted = num.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en', options);
    if (locale === 'ar') {
      return `${formatted} ${currency}`;
    }
    return `${currency} ${formatted}`;
  }
}
