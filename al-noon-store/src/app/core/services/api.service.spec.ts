import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ApiService] });
    service = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return apiUrl from environment', () => {
    expect(service.apiUrl).toBeDefined();
    expect(typeof service.apiUrl).toBe('string');
  });

  it('should return imageBaseUrl from environment', () => {
    expect(service.imageBaseUrl).toBeDefined();
    expect(typeof service.imageBaseUrl).toBe('string');
  });

  it('should return empty string for null/undefined path', () => {
    expect(service.imageUrl(null)).toBe('');
    expect(service.imageUrl(undefined)).toBe('');
    expect(service.imageUrl('')).toBe('');
  });

  it('should return path as-is when it starts with http', () => {
    const url = 'https://cdn.example.com/image.jpg';
    expect(service.imageUrl(url)).toBe(url);
    expect(service.imageUrl('http://other.com/img.png')).toBe('http://other.com/img.png');
  });

  it('should prepend base URL for relative paths', () => {
    const result = service.imageUrl('/uploads/products/img.jpg');
    expect(result).toContain('/uploads/products/img.jpg');
    expect(result).toMatch(/^https?:\/\//);
  });

  it('should add leading slash when path does not have one', () => {
    const result = service.imageUrl('uploads/products/img.jpg');
    expect(result).toContain('/uploads/products/img.jpg');
    expect(result).not.toContain('//uploads');
  });
});
