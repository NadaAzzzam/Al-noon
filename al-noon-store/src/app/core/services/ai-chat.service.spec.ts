import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AiChatService } from './ai-chat.service';

describe('AiChatService', () => {
  let service: AiChatService;
  let httpMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn(), post: vi.fn() };
    TestBed.configureTestingModule({
      providers: [AiChatService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(AiChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSettings', () => {
    it('should return normalized settings from success wrapper', async () => {
      httpMock.get.mockReturnValue(
        of({
          success: true,
          data: {
            enabled: true,
            greeting: { en: 'Hello', ar: 'مرحبا' },
            suggestedQuestions: [{ en: 'Question?', ar: 'سؤال؟' }],
          },
        })
      );
      const settings = await firstValueFrom(service.getSettings());
      expect(settings.enabled).toBe(true);
      expect(settings.greeting.en).toBe('Hello');
      expect(settings.greeting.ar).toBe('مرحبا');
      expect(settings.suggestedQuestions).toHaveLength(1);
      expect(settings.suggestedQuestions![0].en).toBe('Question?');
    });

    it('should return default settings on HTTP error', async () => {
      httpMock.get.mockReturnValue(throwError(() => new Error('Network error')));
      const settings = await firstValueFrom(service.getSettings());
      expect(settings.enabled).toBe(false);
      expect(settings.greeting).toEqual({ en: '', ar: '' });
      expect(settings.suggestedQuestions).toEqual([]);
    });

    it('should handle flat response shape (no success wrapper)', async () => {
      httpMock.get.mockReturnValue(
        of({ enabled: true, greeting: { en: 'Hi' }, suggestedQuestions: [] })
      );
      const settings = await firstValueFrom(service.getSettings());
      expect(settings.enabled).toBe(true);
      expect(settings.greeting.en).toBe('Hi');
    });
  });

  describe('chat', () => {
    it('should return normalized chat response', async () => {
      const body = { message: 'Hello', locale: 'en' as const };
      httpMock.post.mockReturnValue(
        of({
          success: true,
          data: {
            sessionId: 'sess-123',
            response: 'Hi! How can I help?',
            productCards: [],
          },
        })
      );
      const res = await firstValueFrom(service.chat(body));
      expect(res.sessionId).toBe('sess-123');
      expect(res.response).toBe('Hi! How can I help?');
      expect(res.productCards).toEqual([]);
      expect(httpMock.post).toHaveBeenCalledWith('ai/chat', body);
    });

    it('should normalize product cards with _id to id', async () => {
      httpMock.post.mockReturnValue(
        of({
          success: true,
          data: {
            sessionId: 's1',
            response: 'Here are products',
            productCards: [{ _id: 'prod-1', name: 'Product', productUrl: '/p/1' }],
          },
        })
      );
      const res = await firstValueFrom(service.chat({ message: 'x' }));
      expect(res.productCards).toHaveLength(1);
      expect(res.productCards![0].id).toBe('prod-1');
      expect(res.productCards![0].name).toBe('Product');
    });

    it('should throw on invalid/malformed response', async () => {
      httpMock.post.mockReturnValue(of({}));
      await expect(firstValueFrom(service.chat({ message: 'test' }))).rejects.toThrow();
    });

    it('should throw on response missing sessionId or response', async () => {
      httpMock.post.mockReturnValue(
        of({ data: { sessionId: 's1' } }) // missing response
      );
      await expect(firstValueFrom(service.chat({ message: 'test' }))).rejects.toThrow();
    });

    it('should propagate HTTP errors', async () => {
      const err = Object.assign(new Error('Server error'), { status: 500 });
      httpMock.post.mockReturnValue(throwError(() => err));
      await expect(firstValueFrom(service.chat({ message: 'test' }))).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('security - response handling', () => {
    it('should pass through response text without modifying (UI escapes via text binding)', async () => {
      const xssPayload = '<script>alert("xss")</script><img onerror="alert(1)" src=x>';
      httpMock.post.mockReturnValue(
        of({
          success: true,
          data: {
            sessionId: 's1',
            response: xssPayload,
            productCards: [],
          },
        })
      );
      const res = await firstValueFrom(service.chat({ message: 'test' }));
      expect(res.response).toBe(xssPayload);
      // Service does not sanitize - that is intentional: the UI must use safe text binding.
      // We verify the raw string is passed; ChatbotComponent uses {{ msg.text }} (no innerHTML).
    });

    it('should reject non-string response', async () => {
      httpMock.post.mockReturnValue(
        of({ data: { sessionId: 's1', response: 12345, productCards: [] } })
      );
      await expect(firstValueFrom(service.chat({ message: 'test' }))).rejects.toThrow();
    });

    it('should filter out null and handle malformed product card entries', async () => {
      httpMock.post.mockReturnValue(
        of({
          success: true,
          data: {
            sessionId: 's1',
            response: 'Ok',
            productCards: [null, {}, { id: 'valid', name: 'Item', productUrl: '/' }],
          },
        })
      );
      const res = await firstValueFrom(service.chat({ message: 'test' }));
      // null filtered; {} becomes card with id=''; valid card kept
      expect(res.productCards!.length).toBeGreaterThanOrEqual(1);
      const valid = res.productCards!.find((c) => c.id === 'valid');
      expect(valid).toBeDefined();
      expect(valid!.name).toBe('Item');
    });
  });
});
