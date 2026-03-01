import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StoreService],
    });
    service = TestBed.inject(StoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch store home', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'Test Store' },
          hero: { images: [] },
          newArrivals: [],
        },
      },
    };

    service.getStore().subscribe((s) => {
      expect(s.storeName).toBeDefined();
    });

    const req = httpMock.expectOne((r) => r.url.includes('store/home'));
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should fetch settings', () => {
    const mockData = {
      success: true,
      data: {
        settings: {
          storeName: 'Store',
          seoSettings: null,
          contentPages: [],
          stockDisplay: {},
        },
      },
    };

    service.getSettings().subscribe((s) => {
      expect(s).toBeDefined();
      expect(s.storeName).toBe('Store');
    });

    const req = httpMock.expectOne((r) => r.url.includes('settings'));
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });

  it('should get page by slug', () => {
    service.getPage('privacy').subscribe((p) => {
      expect(p).toBeDefined();
    });

    const req = httpMock.expectOne((r) => r.url.includes('store/page'));
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { page: { title: { en: 'Privacy' }, content: { en: '' }, slug: { en: 'privacy' } } } });
  });
});
