import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LocalizedPipe } from './localized.pipe';
import { LocaleService } from '../../core/services/locale.service';

describe('LocalizedPipe', () => {
  let pipe: LocalizedPipe;
  let localeService: { getLocale: () => 'en' | 'ar' };

  beforeEach(() => {
    localeService = { getLocale: () => 'en' };
    TestBed.configureTestingModule({
      providers: [
        LocalizedPipe,
        { provide: LocaleService, useValue: localeService },
      ],
    });
    pipe = TestBed.inject(LocalizedPipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns value for current locale', () => {
    expect(pipe.transform({ en: 'Hello', ar: 'مرحبا' })).toBe('Hello');
    localeService.getLocale = () => 'ar';
    expect(pipe.transform({ en: 'Hello', ar: 'مرحبا' })).toBe('مرحبا');
  });

  it('falls back to en when locale missing', () => {
    expect(pipe.transform({ en: 'Hello', ar: 'مرحبا' })).toBe('Hello');
  });
});
