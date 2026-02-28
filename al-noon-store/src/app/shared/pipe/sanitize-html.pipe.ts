import { Pipe, PipeTransform, inject } from '@angular/core';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Sanitizes HTML for safe binding to [innerHTML]. Strips script tags and dangerous attributes. */
@Pipe({ name: 'sanitizeHtml', standalone: true })
export class SanitizeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): string {
    if (value == null || value === '') return '';
    return this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
  }
}
