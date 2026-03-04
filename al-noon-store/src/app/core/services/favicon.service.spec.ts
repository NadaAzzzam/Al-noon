import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { FaviconService } from './favicon.service';
import { ApiService } from './api.service';

describe('FaviconService', () => {
  let service: FaviconService;
  let createdLink: { setAttribute: ReturnType<typeof vi.fn>; getAttribute: ReturnType<typeof vi.fn> };
  let mockDoc: {
    head: { appendChild: ReturnType<typeof vi.fn>; childNodes: unknown[] };
    querySelector: ReturnType<typeof vi.fn>;
    createElement: ReturnType<typeof vi.fn>;
  };
  let imageUrlSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createdLink = {
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    };
    mockDoc = {
      head: { appendChild: vi.fn(), childNodes: [] },
      querySelector: vi.fn().mockReturnValue(null),
      createElement: vi.fn((tagName: string) => createdLink),
    };
    imageUrlSpy = vi.fn((path: string) => (path ? `https://api.test/${path}` : ''));

    TestBed.configureTestingModule({
      providers: [
        FaviconService,
        { provide: DOCUMENT, useValue: mockDoc },
        { provide: ApiService, useValue: { imageUrl: imageUrlSpy } },
      ],
    });
    service = TestBed.inject(FaviconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create link element and set href when no existing icon link', () => {
    service.setFavicon('uploads/logos/store.png');
    expect(mockDoc.querySelector).toHaveBeenCalledWith('link[rel="icon"]');
    expect(mockDoc.createElement).toHaveBeenCalledWith('link');
    expect(mockDoc.head.appendChild).toHaveBeenCalledWith(createdLink);
    expect(createdLink.setAttribute).toHaveBeenCalledWith('rel', 'icon');
    expect(createdLink.setAttribute).toHaveBeenCalledWith('type', 'image/x-icon');
    expect(createdLink.setAttribute).toHaveBeenCalledWith('href', 'https://api.test/uploads/logos/store.png');
    expect(imageUrlSpy).toHaveBeenCalledWith('uploads/logos/store.png');
  });

  it('should use default logo path when logoPath is null', () => {
    service.setFavicon(null);
    expect(imageUrlSpy).toHaveBeenCalledWith('uploads/logos/default-logo.png');
  });

  it('should use default logo path when logoPath is undefined', () => {
    service.setFavicon(undefined);
    expect(imageUrlSpy).toHaveBeenCalledWith('uploads/logos/default-logo.png');
  });

  it('should update existing link when icon link already exists', () => {
    const existingLink = { setAttribute: vi.fn() };
    mockDoc.querySelector.mockReturnValue(existingLink);

    service.setFavicon('custom/logo.png');

    expect(mockDoc.createElement).not.toHaveBeenCalled();
    expect(mockDoc.head.appendChild).not.toHaveBeenCalled();
    expect(existingLink.setAttribute).toHaveBeenCalledWith('href', 'https://api.test/custom/logo.png');
    expect(imageUrlSpy).toHaveBeenCalledWith('custom/logo.png');
  });

  it('should not set href when imageUrl returns empty string', () => {
    imageUrlSpy.mockReturnValue('');
    service.setFavicon('uploads/logos/any.png');
    expect(imageUrlSpy).toHaveBeenCalled();
    expect(mockDoc.createElement).not.toHaveBeenCalled();
    expect(mockDoc.head.appendChild).not.toHaveBeenCalled();
  });
});
