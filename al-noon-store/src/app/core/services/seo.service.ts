import { Injectable, inject, Renderer2, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import type { SeoSettings, LocalizedText } from '../types/api.types';
import { getLocalized } from '../utils/localized';
import { LocaleService } from './locale.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly locale = inject(LocaleService);
  private readonly api = inject(ApiService);
  private readonly renderer: Renderer2;
  private jsonLdElement: HTMLScriptElement | null = null;

  /** Cached from layout when settings() is set; used for suffix, defaults, og, twitter. */
  private seoSettings: SeoSettings | null = null;
  private storeName: LocalizedText | undefined;

  constructor() {
    const factory = inject(RendererFactory2);
    this.renderer = factory.createRenderer(null, null);
  }

  /** Called from LayoutComponent effect when settings() is available. */
  setSeoSettings(seo: SeoSettings | null, storeName?: LocalizedText): void {
    this.seoSettings = seo ?? null;
    this.storeName = storeName;
  }

  setPage(config: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
    type?: string;
    /** When set, title/description come from API meta when not provided. */
    pageKind?: 'home' | 'catalog' | 'product';
  }): void {
    const lang = this.locale.getLocale();
    let title = config.title;
    let description = config.description;

    // Prefer API meta for this page when present (home/catalog)
    if (config.pageKind && this.seoSettings) {
      const meta = config.pageKind === 'home'
        ? this.seoSettings.homePageMeta
        : config.pageKind === 'catalog'
          ? this.seoSettings.catalogPageMeta
          : undefined;
      if (meta) {
        const apiTitle = meta.title ? getLocalized(meta.title, lang) : '';
        const apiDesc = meta.description ? getLocalized(meta.description, lang) : '';
        if (apiTitle) title = apiTitle;
        if (apiDesc) description = apiDesc;
      }
    }
    if (description == null && this.seoSettings?.defaultMetaDescription) {
      description = getLocalized(this.seoSettings.defaultMetaDescription, lang);
    }

    const suffix = this.resolveTitleSuffix(config.type, lang);
    const fullTitle = title ? `${title}${suffix}` : (getLocalized(this.storeName, lang) || 'Al-Noon');
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }

    const ogImage = config.ogImage ?? (this.seoSettings?.ogImage ? this.api.imageUrl(this.seoSettings.ogImage) : undefined);
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
    }

    if (config.type) {
      this.meta.updateTag({ property: 'og:type', content: config.type });
    }
    const twitterCard = this.seoSettings?.twitterCard?.trim();
    if (twitterCard) {
      this.meta.updateTag({ name: 'twitter:card', content: twitterCard });
    }
    if (this.seoSettings?.defaultMetaKeywords) {
      const keywords = getLocalized(this.seoSettings.defaultMetaKeywords, lang);
      if (keywords) this.meta.updateTag({ name: 'keywords', content: keywords });
    }

    if (config.canonicalUrl) {
      let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = this.renderer.createElement('link');
        this.renderer.setAttribute(link, 'rel', 'canonical');
        this.renderer.appendChild(this.doc.head, link);
      }
      this.renderer.setAttribute(link, 'href', config.canonicalUrl);
    }
  }

  private resolveTitleSuffix(type: string | undefined, lang: string): string {
    if (type === 'product' && this.seoSettings?.productPageMeta?.titleSuffix) {
      const s = getLocalized(this.seoSettings.productPageMeta.titleSuffix, lang as 'en' | 'ar');
      return s ? ` ${s.trim()}` : '';
    }
    const name = getLocalized(this.storeName, lang as 'en' | 'ar');
    return name ? ` | ${name}` : ' | Al-Noon';
  }

  setProductJsonLd(product: {
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency?: string;
    availability?: string;
    averageRating?: number;
    ratingCount?: number;
  }): void {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency ?? 'EGP',
        availability: product.availability ?? 'https://schema.org/InStock',
      },
    };

    if (product.description) schema['description'] = product.description;
    if (product.image) schema['image'] = product.image;

    if (product.averageRating && product.ratingCount) {
      schema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.ratingCount,
      };
    }

    this.removeJsonLd();
    this.jsonLdElement = this.renderer.createElement('script');
    this.renderer.setAttribute(this.jsonLdElement!, 'type', 'application/ld+json');
    this.jsonLdElement!.textContent = JSON.stringify(schema);
    this.renderer.appendChild(this.doc.head, this.jsonLdElement);
  }

  removeJsonLd(): void {
    if (this.jsonLdElement) {
      this.jsonLdElement.remove();
      this.jsonLdElement = null;
    }
  }
}
