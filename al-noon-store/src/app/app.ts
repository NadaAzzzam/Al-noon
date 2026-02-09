import { Component, OnInit, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { LocaleService } from './core/services/locale.service';
import { TranslateService } from '@ngx-translate/core';
import { ChatbotComponent } from './shared/chatbot/chatbot.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.auth.loadProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {},
      error: () => {},
    });
    const lang = this.locale.getLocale();
    this.translate.use(lang);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }
}
