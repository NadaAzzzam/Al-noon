import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NewsletterService } from './newsletter.service';

describe('NewsletterService', () => {
  let service: NewsletterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NewsletterService],
    });
    service = TestBed.inject(NewsletterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe successfully', () => {
    service.subscribe('user@example.com').subscribe({
      next: (r) => expect(r).toBeDefined(),
    });

    const req = httpMock.expectOne((r) => r.url.includes('newsletter/subscribe'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com' });
    req.flush({ success: true });
  });

  it('should handle already subscribed (409)', () => {
    service.subscribe('existing@example.com').subscribe({
      error: (e) => expect(e.alreadySubscribed).toBe(true),
    });

    const req = httpMock.expectOne((r) => r.url.includes('newsletter/subscribe'));
    req.flush({ code: 'CONFLICT' }, { status: 409, statusText: 'Conflict' });
  });
});
