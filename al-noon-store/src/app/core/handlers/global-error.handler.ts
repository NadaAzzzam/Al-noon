import { ErrorHandler, Injectable, inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class GlobalErrorHandler extends ErrorHandler {
  private readonly platformId = inject(PLATFORM_ID);

  override handleError(error: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      console.error('Unhandled error:', error);
      // Optional: integrate with Sentry/LogRocket here
      // Sentry.captureException(error);
    }
    super.handleError(error);
  }
}
