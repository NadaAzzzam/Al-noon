import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { post: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ContactService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(ContactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit success when POST succeeds', async () => {
    httpMock.post.mockReturnValue(of({ success: true, message: 'Message sent' }));
    const res = await firstValueFrom(service.send({ name: 'Test', email: 't@t.com', comment: 'Hello' }));
    expect(res.message).toBe('Message sent');
  });

  it('should error when POST returns success: false', async () => {
    httpMock.post.mockReturnValue(of({ success: false }));
    await expect(
      firstValueFrom(service.send({ name: 'Test', email: 't@t.com', comment: 'Hello' }))
    ).rejects.toBeDefined();
  });

  it('should error on HTTP failure', async () => {
    httpMock.post.mockReturnValue(throwError(() => new Error('Network error')));
    await expect(
      firstValueFrom(service.send({ name: 'Test', email: 't@t.com', comment: 'Hello' }))
    ).rejects.toBeDefined();
  });
});
