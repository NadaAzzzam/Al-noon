import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Locale = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly translate = inject(TranslateService);
  private readonly localeSignal = signal<Locale>(this.loadStored());
  readonly locale = this.localeSignal.asReadonly();
  readonly isRtl = computed(() => this.localeSignal() === 'ar');
  readonly lang = computed(() => this.localeSignal());

  constructor() {
    this.translate.use(this.localeSignal());
    if (typeof document !== 'undefined' && document.documentElement) {
      const loc = this.localeSignal();
      document.documentElement.dir = loc === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = loc;
    }
  }

  private loadStored(): Locale {
    if (typeof localStorage === 'undefined') return 'en';
    const stored = localStorage.getItem('al_noon_locale') as Locale | null;
    return stored === 'ar' || stored === 'en' ? stored : 'en';
  }

  setLocale(loc: Locale): void {
    this.localeSignal.set(loc);
    this.translate.use(loc);
    try {
      localStorage.setItem('al_noon_locale', loc);
    } catch {}
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dir = loc === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = loc;
    }
  }

  getLocale(): Locale {
    return this.localeSignal();
  }
}
