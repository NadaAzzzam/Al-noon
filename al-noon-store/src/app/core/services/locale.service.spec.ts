import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LocaleService } from './locale.service';

describe('LocaleService', () => {
  let service: LocaleService;

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    vi.stubGlobal('document', {
      documentElement: { dir: '', lang: '' },
    });
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [LocaleService],
    });
    service = TestBed.inject(LocaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return en as default locale when localStorage is empty', () => {
    expect(service.getLocale()).toBe('en');
  });

  it('should set and persist locale', () => {
    service.setLocale('ar');
    expect(service.getLocale()).toBe('ar');
    expect(service.isRtl()).toBe(true);
    expect(service.lang()).toBe('ar');
  });

  it('should set en and have isRtl false', () => {
    service.setLocale('en');
    expect(service.isRtl()).toBe(false);
  });
});
