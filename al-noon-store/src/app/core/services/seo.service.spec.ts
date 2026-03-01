import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from './seo.service';
import { LocaleService } from './locale.service';
import { ApiService } from './api.service';

describe('SeoService', () => {
  let service: SeoService;
  let meta: Meta;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        SeoService,
        { provide: LocaleService, useValue: { getLocale: () => 'en' as const } },
        { provide: ApiService, useValue: { imageUrl: (path: string) => path } },
      ],
    });
    service = TestBed.inject(SeoService);
    meta = TestBed.inject(Meta);
    title = TestBed.inject(Title);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set page title and description', () => {
    service.setPage({ title: 'Test Page', description: 'Test desc' });
    expect(title.getTitle()).toContain('Test Page');
    const descTag = meta.getTag('name="description"');
    expect(descTag?.content).toBe('Test desc');
  });

  it('should set canonical URL when provided', () => {
    service.setPage({ title: 'T', canonicalUrl: 'https://example.com/page' });
    const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href') ?? link?.href).toContain('example.com/page');
  });
});
