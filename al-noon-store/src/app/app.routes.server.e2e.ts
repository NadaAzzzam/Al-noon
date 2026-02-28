import { RenderMode, ServerRoute } from '@angular/ssr';

/** Client-only rendering for e2e tests (no SSR, so Cypress API intercepts work). */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Client },
];
