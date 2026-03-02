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

  it('should use cached store on second call without force', () => {
    const mockData = { success: true, data: { home: { storeName: { en: 'Test' }, hero: {}, newArrivals: [] } } };
    let callCount = 0;
    service.getStore().subscribe(() => callCount++);
    const req1 = httpMock.expectOne((r) => r.url.includes('store/home'));
    req1.flush(mockData);

    service.getStore().subscribe();
    expect(callCount).toBe(1);
    httpMock.expectNone((r) => r.url.includes('store/home'));
  });

  it('should refetch store when force=true', () => {
    const mockData = { success: true, data: { home: { storeName: { en: 'Test' }, hero: {}, newArrivals: [] } } };
    service.getStore().subscribe();
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);

    service.getStore(true).subscribe();
    const req2 = httpMock.expectOne((r) => r.url.includes('store/home'));
    req2.flush(mockData);
  });

  it('should get page when data has page in object', () => {
    service.getPage('about').subscribe((p) => {
      expect(p).toBeDefined();
      expect(p?.title).toEqual({ en: 'About', ar: '' });
    });
    const req = httpMock.expectOne((r) => r.url.includes('store/page'));
    req.flush({
      success: true,
      data: {
        page: { title: { en: 'About', ar: '' }, content: { en: '' }, slug: { en: 'about', ar: '' } },
      },
    });
  });

  it('should get settings and update settings signal', () => {
    const mockData = {
      success: true,
      data: {
        settings: {
          storeName: 'My Store',
          lowStockThreshold: 3,
          stockInfoThreshold: 8,
        },
      },
    };
    service.getSettings().subscribe((s) => {
      expect(s.storeName).toBe('My Store');
    });
    httpMock.expectOne((r) => r.url.includes('settings')).flush(mockData);
    expect(service.settings()?.storeName).toBe('My Store');
  });

  it('should get page when data is page object at top level', () => {
    service.getPage('terms').subscribe((p) => {
      expect(p?.title).toEqual({ en: 'Terms', ar: '' });
    });
    const req = httpMock.expectOne((r) => r.url.includes('store/page'));
    req.flush({
      success: true,
      data: { title: { en: 'Terms', ar: '' }, content: { en: '' }, slug: { en: 'terms', ar: '' } },
    });
  });

  it('should not emit page when success is false', async () => {
    let emitted = false;
    service.getPage('x').subscribe({ next: () => (emitted = true) });
    httpMock.expectOne((r) => r.url.includes('store/page')).flush({ success: false });
    await new Promise((r) => setTimeout(r, 0));
    expect(emitted).toBe(false);
  });

  it('should handle getStore with socialLinks and quickLinks', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [],
          socialLinks: { Facebook: 'https://fb.com', Instagram: 'https://ig.com' },
          quickLinks: [{ label: { en: 'Contact', ar: '' }, url: 'contact' }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.socialLinks?.length).toBeGreaterThan(0);
      expect(s.quickLinks?.length).toBeGreaterThan(0);
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle nested store in home response', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'Nested' },
          hero: {},
          store: { storeName: { en: 'Inner' }, quickLinks: [], logo: null },
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.storeName).toBeDefined();
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle getStore with homeCollections and feedbacks', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [],
          homeCollections: [{ title: { en: 'Abayas', ar: '' }, url: 'products/abayas', image: '/a.jpg' }],
          feedbacks: [{ _id: 'f1', message: 'Great', rating: 5 }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.homeCollections?.length).toBeGreaterThan(0);
      expect(s.feedbacks?.length).toBeGreaterThan(0);
      expect(s.homeCollections?.[0].url).toContain('catalog');
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle quickLinks with absolute URL', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [],
          quickLinks: [{ title: { en: 'External', ar: '' }, url: 'https://example.com/page' }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.quickLinks?.[0].url).toBe('https://example.com/page');
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle newArrivals in store response', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [{ _id: 'p1', name: { en: 'Product' }, price: 100, status: 'ACTIVE', images: [] }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect((s as { newArrivals?: unknown[] }).newArrivals?.length).toBe(1);
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle socialLinks as array', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [],
          socialLinks: [{ platform: 'Twitter', url: 'https://twitter.com' }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.socialLinks?.length).toBe(1);
      expect(s.socialLinks?.[0].platform).toBe('Twitter');
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });

  it('should handle homeCollection with single segment category', () => {
    const mockData = {
      success: true,
      data: {
        home: {
          storeName: { en: 'S' },
          hero: {},
          newArrivals: [],
          homeCollections: [{ title: { en: 'Capes', ar: '' }, url: 'capes', categoryId: 'capes-id' }],
        },
      },
    };
    service.getStore().subscribe((s) => {
      expect(s.homeCollections?.[0].url).toContain('category=');
    });
    httpMock.expectOne((r) => r.url.includes('store/home')).flush(mockData);
  });
});
