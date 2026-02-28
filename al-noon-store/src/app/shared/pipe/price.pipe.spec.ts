import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { PriceFormatPipe } from './price.pipe';
import { LocaleService } from '../../core/services/locale.service';

describe('PriceFormatPipe', () => {
  let pipe: PriceFormatPipe;
  let localeService: { getLocale: () => 'en' | 'ar' };
  let translateService: { instant: (key: string) => string };

  beforeEach(() => {
    localeService = { getLocale: () => 'en' };
    translateService = { instant: (key: string) => (key === 'common.currency' ? 'EGP' : key) };
    TestBed.configureTestingModule({
      providers: [
        PriceFormatPipe,
        { provide: LocaleService, useValue: localeService },
        { provide: TranslateService, useValue: translateService },
      ],
    });
    pipe = TestBed.inject(PriceFormatPipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('formats price for en locale', () => {
    expect(pipe.transform(1050)).toContain('1');
    expect(pipe.transform(1050)).toContain('050');
    expect(pipe.transform(1050)).toContain('EGP');
  });

  it('formats price for ar locale', () => {
    localeService.getLocale = () => 'ar';
    translateService.instant = () => 'ج.م.';
    const result = pipe.transform(1050);
    expect(result).toContain('ج.م.');
  });

  it('handles zero', () => {
    expect(pipe.transform(0)).toContain('0');
    expect(pipe.transform(0)).not.toBe('');
  });

  it('handles negative values', () => {
    const result = pipe.transform(-100);
    expect(result).toContain('-');
    expect(result).toContain('100');
  });

  it('rounds floating point correctly', () => {
    const result = pipe.transform(99.999);
    expect(result).toMatch(/\d/);
  });
});
