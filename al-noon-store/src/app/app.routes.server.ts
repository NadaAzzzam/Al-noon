import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * All routes use SSR for SEO. The server serves static assets (e.g. /i18n/*.json)
 * so TranslateHttpLoader works at runtime. Prerender can be re-enabled for
 * static routes once a server-capable i18n loader is used (e.g. fs-based on Node).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Server },
];
