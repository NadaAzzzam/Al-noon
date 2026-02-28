import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { ChatbotComponent } from './chatbot.component';
import { AiChatService } from '../../core/services/ai-chat.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';

describe('ChatbotComponent', () => {
  let fixture: ComponentFixture<ChatbotComponent>;
  let aiServiceMock: { getSettings: ReturnType<typeof vi.fn>; chat: ReturnType<typeof vi.fn> };
  let chatSubject: Subject<unknown>;

  beforeEach(async () => {
    chatSubject = new Subject();
    aiServiceMock = {
      getSettings: vi.fn().mockReturnValue(
        of({
          enabled: true,
          greeting: { en: 'Hi there!', ar: 'مرحبا' },
          suggestedQuestions: [{ en: 'Show products', ar: 'عرض المنتجات' }],
        })
      ),
      chat: vi.fn().mockReturnValue(chatSubject.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [ChatbotComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: AiChatService, useValue: aiServiceMock },
        { provide: LocaleService, useValue: { getLocale: () => 'en' } },
        { provide: ApiService, useValue: { imageUrl: (p: string) => (p ? `/img/${p}` : '') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
  });

  afterEach(() => {
    chatSubject.complete();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should fetch AI settings on init', () => {
    fixture.detectChanges();
    expect(aiServiceMock.getSettings).toHaveBeenCalled();
  });

  describe('security - XSS prevention', () => {
    it('should sanitize potentially malicious content (no script execution)', () => {
      // [innerHTML] with Angular sanitizer strips <script> and event handlers
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);

      const xssPayload = '<script>document.location="evil.com"</script><img onerror="alert(1)" src=x>';
      fixture.componentInstance.messages.set([
        { role: 'user', text: 'hello' },
        { role: 'assistant', text: xssPayload },
      ]);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const assistantMsg = el.querySelector('.message.assistant .message-text');
      expect(assistantMsg).toBeTruthy();
      // Angular sanitizer removes script tags and dangerous attributes
      expect(assistantMsg!.querySelector('script')).toBeNull();
      expect(assistantMsg!.querySelector('img[onerror]')).toBeNull();
    });
  });

  describe('send', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not call chat API when input is empty', () => {
      fixture.componentInstance.input.set('');
      fixture.componentInstance.send();
      expect(aiServiceMock.chat).not.toHaveBeenCalled();
    });

    it('should not call chat API when input is only whitespace', () => {
      fixture.componentInstance.input.set('   ');
      fixture.componentInstance.send();
      expect(aiServiceMock.chat).not.toHaveBeenCalled();
    });

    it('should not send when loading', () => {
      fixture.componentInstance.input.set('hello');
      fixture.componentInstance.loading.set(true);
      fixture.componentInstance.send();
      expect(aiServiceMock.chat).not.toHaveBeenCalled();
    });

    it('should call chat with trimmed message and locale', () => {
      fixture.componentInstance.input.set('  Show me products  ');
      fixture.componentInstance.send();
      expect(aiServiceMock.chat).toHaveBeenCalledWith({
        message: 'Show me products',
        sessionId: undefined,
        locale: 'en',
      });
    });

    it('should show friendly message on 429 (rate limit)', () => {
      fixture.componentInstance.input.set('test');
      fixture.componentInstance.send();
      chatSubject.error({ status: 429 });
      fixture.detectChanges();
      expect(fixture.componentInstance.error()).toBe(
        'Too many requests. Please try again later.'
      );
    });

    it('should show friendly message on 502', () => {
      fixture.componentInstance.input.set('test');
      fixture.componentInstance.send();
      chatSubject.error({ status: 502 });
      fixture.detectChanges();
      expect(fixture.componentInstance.error()).toBe('AI is temporarily unavailable.');
    });

    it('should show friendly message on 400', () => {
      fixture.componentInstance.input.set('test');
      fixture.componentInstance.send();
      chatSubject.error({ status: 400 });
      fixture.detectChanges();
      expect(fixture.componentInstance.error()).toBe('AI chat is disabled.');
    });

    it('should store sessionId from response', () => {
      fixture.componentInstance.input.set('test');
      fixture.componentInstance.send();
      chatSubject.next({
        sessionId: 'session-abc',
        response: 'Here is the answer',
        productCards: [],
      });
      chatSubject.complete();
      fixture.detectChanges();
      expect(fixture.componentInstance.sessionId()).toBe('session-abc');
    });
  });
});
