import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { NewsletterService } from '../../core/services/newsletter.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import { emailError } from '../../shared/utils/form-validators';
import type { StoreData } from '../../core/types/api.types';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly newsletterService = inject(NewsletterService);
  readonly locale = inject(LocaleService);

  store = signal<StoreData | null>(null);
  newsletterEmail = signal('');
  newsletterMessage = signal<'idle' | 'success' | 'error' | 'already'>('idle');
  currentYear = new Date().getFullYear();

  newsletterValid = computed(() => !emailError(this.newsletterEmail()));
  currentLocale = computed(() => this.locale.getLocale());

  getLocalized(obj: { en?: string; ar?: string } | undefined | null): string {
    if (!obj || typeof obj !== 'object') return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  ngOnInit(): void {
    this.storeService.getStore().subscribe((s) => this.store.set(s));
  }

  submitNewsletter(): void {
    if (!this.newsletterValid()) return;
    this.newsletterMessage.set('idle');
    this.newsletterService.subscribe(this.newsletterEmail().trim()).subscribe({
      next: () => {
        this.newsletterMessage.set('success');
        this.newsletterEmail.set('');
      },
      error: (e: { alreadySubscribed?: boolean }) => {
        this.newsletterMessage.set(e?.alreadySubscribed ? 'already' : 'error');
      },
    });
  }
}
