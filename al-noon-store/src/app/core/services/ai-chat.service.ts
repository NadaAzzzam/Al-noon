import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, ApiError, AiSettings, AiChatRequest, AiChatResponse, AiProductCard } from '../types/api.types';

const DEFAULT_SETTINGS: AiSettings = {
  enabled: false,
  greeting: { en: '', ar: '' },
  suggestedQuestions: [],
};

/** Normalize API response to AiSettings (handles both { success, data } and flat { enabled, greeting, suggestedQuestions }). */
function normalizeAiSettings(r: unknown): AiSettings {
  if (r && typeof r === 'object') {
    const obj = r as Record<string, unknown>;
    const data = (obj['success'] === true && obj['data'] && typeof obj['data'] === 'object')
      ? (obj['data'] as Record<string, unknown>)
      : obj;
    if (data && typeof data === 'object' && 'enabled' in data) {
      const rawGreeting = data['greeting'];
      const greeting = (rawGreeting && typeof rawGreeting === 'object')
        ? (rawGreeting as { en?: string; ar?: string })
        : { en: '', ar: '' };
      const rawQuestions = data['suggestedQuestions'];
      const suggestedQuestions: { en: string; ar: string }[] = Array.isArray(rawQuestions)
        ? (rawQuestions as { en?: string; ar?: string }[]).map((q) => ({
            en: q?.en ?? '',
            ar: q?.ar ?? '',
          }))
        : [];
      return {
        enabled: Boolean(data['enabled']),
        greeting: { en: greeting.en ?? '', ar: greeting.ar ?? '' },
        suggestedQuestions,
      };
    }
  }
  return DEFAULT_SETTINGS;
}

/** Normalize product cards so each has `id` (API may return _id). */
function normalizeProductCards(cards: unknown): AiProductCard[] {
  if (!Array.isArray(cards)) return [];
  return cards.map((c) => {
    if (!c || typeof c !== 'object') return null;
    const card = c as Record<string, unknown>;
    const id = String(card['id'] ?? card['_id'] ?? '');
    const name = card['name'] ?? '';
    const img = card['image'];
    const image = typeof img === 'string' ? img : undefined;
    const productUrl = typeof card['productUrl'] === 'string' ? card['productUrl'] : '';
    return { id, name, image, productUrl } as AiProductCard;
  }).filter((c): c is AiProductCard => c !== null);
}

/** Normalize API response to AiChatResponse (handles both { success, data } and flat body). */
function normalizeChatResponse(r: unknown): AiChatResponse {
  if (r && typeof r === 'object') {
    const obj = r as Record<string, unknown>;
    const data = (obj['success'] === true && obj['data'] && typeof obj['data'] === 'object')
      ? (obj['data'] as Record<string, unknown>)
      : obj;
    if (data && typeof data === 'object' && typeof data['sessionId'] === 'string' && typeof data['response'] === 'string') {
      return {
        sessionId: data['sessionId'] as string,
        response: data['response'] as string,
        productCards: normalizeProductCards(data['productCards']),
      };
    }
  }
  const err = r as ApiError | undefined;
  throw new Error(err?.['message'] ?? err?.['code'] ?? 'Invalid chat response');
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly http = inject(HttpClient);

  getSettings(): Observable<AiSettings> {
    return this.http.get<ApiSuccess<AiSettings> | AiSettings>('ai/settings').pipe(
      (o) =>
        new Observable<AiSettings>((sub) => {
          o.subscribe({
            next: (r) => sub.next(normalizeAiSettings(r)),
            error: () => sub.next(DEFAULT_SETTINGS),
            complete: () => sub.complete(),
          });
        })
    );
  }

  chat(body: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<ApiSuccess<AiChatResponse> | ApiError | AiChatResponse>('ai/chat', body).pipe(
      (o) =>
        new Observable<AiChatResponse>((sub) => {
          o.subscribe({
            next: (r) => {
              try {
                sub.next(normalizeChatResponse(r));
              } catch (e) {
                sub.error(e);
              }
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
