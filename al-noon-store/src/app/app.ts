import { Component, OnInit, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { StoreService } from './core/services/store.service';
import { LocaleService } from './core/services/locale.service';
import { TranslateService } from '@ngx-translate/core';
import { ChatbotComponent } from './shared/chatbot/chatbot.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly storeService = inject(StoreService);
  private readonly locale = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Indices for snow-drop particles (single full-screen layer, no repeat) */
  readonly dropIndices = Array.from({ length: 35 }, (_, i) => i);

  /**
   * Optional emojis for the snow-drop animation.
   * When set (non-empty), these emojis fall instead of the default shapes.
   * Example: ramadanEmojis = ['🌙', '⭐', '✨', '🕌'];
   * Leave empty to use the default crescent/star/dot shapes.
   */
  ramadanEmojis: string[] = ['🌙', '⭐', '✨'];

  /** Ramadan shape per particle: crescent, star, or dot (used when ramadanEmojis is empty) */
  getShape(i: number): 'crescent' | 'star' | 'dot' {
    const shapes: ('crescent' | 'star' | 'dot')[] = ['crescent', 'star', 'dot'];
    return shapes[i % 3];
  }

  /** Emoji for drop at index i (cycles through ramadanEmojis); used when ramadanEmojis is set */
  getEmoji(i: number): string {
    if (!this.ramadanEmojis.length) return '';
    return this.ramadanEmojis[i % this.ramadanEmojis.length];
  }

  ngOnInit(): void {
    this.storeService.getSettings().pipe(take(1)).subscribe();
    this.auth.loadProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { },
      error: () => { },
    });
    const lang = this.locale.getLocale();
    this.translate.use(lang);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }
}
