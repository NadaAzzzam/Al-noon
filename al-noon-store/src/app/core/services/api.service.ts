import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  /** Base URL for API (e.g. http://localhost:3000/api) */
  get apiUrl(): string {
    return environment.apiUrl;
  }

  /** Origin for absolute image paths (e.g. /uploads/products/...) */
  get imageBaseUrl(): string {
    return environment.apiOrigin;
  }

  /** Resolve product or store image path to full URL */
  imageUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const base = this.imageBaseUrl.replace(/\/$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }
}
