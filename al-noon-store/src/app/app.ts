import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { LocaleService } from './core/services/locale.service';
import { TranslateService } from '@ngx-translate/core';
import { ChatbotComponent } from './shared/chatbot/chatbot.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly locale = inject(LocaleService);
  private readonly translate = inject(TranslateService);

  ngOnInit(): void {
    this.auth.loadProfile().subscribe({
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
