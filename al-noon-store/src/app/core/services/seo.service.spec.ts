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

  it('should use seoSettings homePageMeta when pageKind is home', () => {
    service.setSeoSettings({
      homePageMeta: { title: { en: 'Home Title', ar: '' }, description: { en: 'Home desc', ar: '' } },
      defaultMetaDescription: { en: 'Default', ar: '' },
    });
    service.setPage({ pageKind: 'home' });
    expect(title.getTitle()).toContain('Home Title');
  });

  it('should use catalogPageMeta when pageKind is catalog', () => {
    service.setSeoSettings({
      catalogPageMeta: { title: { en: 'Catalog', ar: '' }, description: { en: 'Browse', ar: '' } },
    });
    service.setPage({ pageKind: 'catalog' });
    expect(title.getTitle()).toContain('Catalog');
  });

  it('should set product JSON-LD', () => {
    service.setProductJsonLd({
      name: 'Product',
      description: 'Desc',
      price: 99,
      availability: 'https://schema.org/InStock',
    });
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const json = JSON.parse(script!.textContent || '{}');
    expect(json['@type']).toBe('Product');
    expect(json.name).toBe('Product');
    expect(json.offers.price).toBe(99);
  });

  it('should use product titleSuffix when type is product', () => {
    service.setSeoSettings(
      { productPageMeta: { titleSuffix: { en: '| Shop', ar: '' } } },
      { en: 'Store', ar: '' }
    );
    service.setPage({ title: 'Widget', type: 'product' });
    expect(title.getTitle()).toContain('| Shop');
  });

  it('should use ogImage from seoSettings when not in config', () => {
    service.setSeoSettings({ ogImage: '/og.jpg' });
    service.setPage({ title: 'T' });
    const ogTag = meta.getTag('property="og:image"');
    expect(ogTag?.content).toContain('/og.jpg');
  });

  it('should use defaultMetaDescription when description not provided', () => {
    service.setSeoSettings({
      defaultMetaDescription: { en: 'Default description', ar: '' },
    });
    service.setPage({ title: 'T' });
    const descTag = meta.getTag('name="description"');
    expect(descTag?.content).toBe('Default description');
  });
});
