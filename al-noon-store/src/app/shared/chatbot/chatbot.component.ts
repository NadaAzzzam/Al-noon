import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AiChatService } from '../../core/services/ai-chat.service';
import { LocaleService } from '../../core/services/locale.service';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule } from '@ngx-translate/core';
import type { AiSettings, AiChatResponse } from '../../core/types/api.types';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  productCards?: AiChatResponse['productCards'];
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotComponent implements OnInit {
  private readonly aiService = inject(AiChatService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  readonly api = inject(ApiService);

  settings = signal<AiSettings | null>(null);
  open = signal(false);
  messages = signal<ChatMessage[]>([]);
  input = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  sessionId = signal<string | null>(null);

  ngOnInit(): void {
    this.aiService.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((s) => {
      this.settings.set(s);
      if (s.enabled && s.greeting) {
        const greeting = this.getLocalized(s.greeting);
        if (greeting) this.messages.set([{ role: 'assistant', text: greeting }]);
      }
    });
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  /** Product card name (API may return string or LocalizedText) */
  getCardName(card: { name: string | { en?: string; ar?: string } }): string {
    return typeof card.name === 'string' ? card.name : this.getLocalized(card.name);
  }

  toggle(): void {
    this.open.update((v) => !v);
    this.error.set(null);
  }

  sendSuggested(q: string): void {
    this.input.set(q);
    this.send();
  }

  send(): void {
    const text = this.input().trim();
    if (!text || this.loading()) return;
    this.input.set('');
    this.error.set(null);
    this.messages.update((list) => [...list, { role: 'user', text }]);
    this.loading.set(true);
    const lang = this.locale.getLocale();
    this.aiService
      .chat({
        message: text,
        sessionId: this.sessionId() ?? undefined,
        locale: lang,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.sessionId.set(res.sessionId);
          this.messages.update((list) => [
            ...list,
            {
              role: 'assistant',
              text: res.response,
              productCards: res.productCards,
            },
          ]);
          this.loading.set(false);
        },
        error: (err) => {
          const msg =
            err?.status === 429
              ? 'Too many requests. Please try again later.'
              : err?.status === 502
                ? 'AI is temporarily unavailable.'
                : err?.status === 400
                  ? 'AI chat is disabled.'
                  : err?.message ?? 'Something went wrong.';
          this.error.set(msg);
          this.loading.set(false);
        },
      });
  }
}
