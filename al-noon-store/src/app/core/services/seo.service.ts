import { Injectable, inject, Renderer2, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly renderer: Renderer2;
  private jsonLdElement: HTMLScriptElement | null = null;

  constructor() {
    const factory = inject(RendererFactory2);
    this.renderer = factory.createRenderer(null, null);
  }

  setPage(config: {
    title: string;
    description?: string;
    ogImage?: string;
    canonicalUrl?: string;
    type?: string;
  }): void {
    const fullTitle = config.title ? `${config.title} | Al-Noon` : 'Al-Noon';
    this.title.setTitle(fullTitle);
    this.meta.updateTag({ property: 'og:title', content: fullTitle });

    if (config.description) {
      this.meta.updateTag({ name: 'description', content: config.description });
      this.meta.updateTag({ property: 'og:description', content: config.description });
    }

    if (config.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: config.ogImage });
    }

    if (config.type) {
      this.meta.updateTag({ property: 'og:type', content: config.type });
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
