import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SanitizeHtmlPipe } from './sanitize-html.pipe';

describe('SanitizeHtmlPipe', () => {
  let pipe: SanitizeHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SanitizeHtmlPipe],
    });
    pipe = TestBed.inject(SanitizeHtmlPipe);
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('sanitizes safe HTML and preserves it', () => {
    const safe = '<p>Hello</p><ul><li>Item</li></ul>';
    const result = pipe.transform(safe);
    expect(result).toContain('<p>');
    expect(result).toContain('Hello');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item</li>');
  });

  it('strips script tags', () => {
    const dangerous = '<script>alert(1)</script><p>Hello</p>';
    const result = pipe.transform(dangerous);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips event handler attributes', () => {
    const dangerous = '<img src="x" onerror="alert(1)">';
    const result = pipe.transform(dangerous);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });
});
