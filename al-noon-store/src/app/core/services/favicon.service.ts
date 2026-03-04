import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from './api.service';

/** Default logo path used when store/settings do not provide one. */
const DEFAULT_LOGO_PATH = 'uploads/logos/default-logo.png';

/**
 * Updates the document favicon from a backend logo path.
 * Used by the main layout (header) and by status pages (coming-soon, under-construction)
 * so the tab icon reflects the store logo from the API.
 */
@Injectable({ providedIn: 'root' })
export class FaviconService {
  private readonly doc = inject(DOCUMENT);
  private readonly api = inject(ApiService);

  /**
   * Set the page favicon from a logo path returned by the backend.
   * @param logoPath Path from store/settings (e.g. settings.logo or store.logo), or null/undefined to use default.
   */
  setFavicon(logoPath: string | undefined | null): void {
    const path = logoPath ?? DEFAULT_LOGO_PATH;
    const url = this.api.imageUrl(path) || null;
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (url) {
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'icon');
        link.setAttribute('type', 'image/x-icon');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', url);
    }
  }
}
