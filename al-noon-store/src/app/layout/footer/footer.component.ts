import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { NewsletterService } from '../../core/services/newsletter.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslatePipe } from '@ngx-translate/core';
import { emailError } from '../../shared/utils/form-validators';
import type { StoreData, SettingsContentPage } from '../../core/types/api.types';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly newsletterService = inject(NewsletterService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);

  store = signal<StoreData | null>(null);
  /** Content pages from settings API (privacy, return-policy, shipping-policy, about, contact) */
  contentPages = signal<SettingsContentPage[]>([]);
  /** Newsletter section visibility from settings (fallback when store not loaded, e.g. checkout) */
  newsletterEnabledFromSettings = signal<boolean | null>(null);
  newsletterEmail = signal('');
  newsletterMessage = signal<'idle' | 'success' | 'error' | 'already'>('idle');
  newsletterLoading = signal(false);
  readonly currentYear = new Date().getFullYear();

  newsletterValid = computed(() => !emailError(this.newsletterEmail()));
  currentLocale = computed(() => this.locale.getLocale());

  socialLinks = computed(() => {
    const links = this.store()?.socialLinks;
    if (Array.isArray(links)) return links;
    if (links && typeof links === 'object' && !Array.isArray(links)) {
      return Object.entries(links).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    }
    return [];
  });

  quickLinks = computed(() => {
    const links = this.store()?.quickLinks;
    return Array.isArray(links) ? links : [];
  });

  /** Show newsletter section when enabled in store or in settings (settings used when store not loaded). */
  showNewsletterSection = computed(
    () => this.store()?.newsletterEnabled ?? this.newsletterEnabledFromSettings() ?? true
  );

  getLocalized(obj: { en?: string; ar?: string } | undefined | null): string {
    if (!obj || typeof obj !== 'object') return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  ngOnInit(): void {
    this.storeService.getStore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => this.store.set(s));
    this.storeService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((settings) => {
      if (settings.contentPages?.length) this.contentPages.set(settings.contentPages);
      this.newsletterEnabledFromSettings.set(settings.newsletterEnabled ?? null);
    });
  }

  submitNewsletter(event?: Event): void {
    event?.preventDefault();
    if (!this.newsletterValid()) return;
    this.newsletterMessage.set('idle');
    this.newsletterLoading.set(true);
    this.newsletterService.subscribe(this.newsletterEmail().trim()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.newsletterMessage.set('success');
        this.newsletterEmail.set('');
        this.newsletterLoading.set(false);
      },
      error: (e: { alreadySubscribed?: boolean }) => {
        this.newsletterMessage.set(e?.alreadySubscribed ? 'already' : 'error');
        this.newsletterLoading.set(false);
      },
    });
  }
}
