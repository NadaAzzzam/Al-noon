import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../core/services/store.service';
import { getLocalizedSlug } from '../../core/utils/localized';
import { NewsletterService } from '../../core/services/newsletter.service';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPathService } from '../../core/services/localized-path.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { emailErrorKey } from '../../shared/utils/form-validators';
import type { StoreData, SettingsContentPage, StoreQuickLink } from '../../core/types/api.types';

/** Unified footer link from BE: contentPages (settings) + quickLinks (store/home), deduplicated. */
export interface FooterLink {
  title: string;
  url: string;
  external: boolean;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: '' },
})
export class FooterComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly newsletterService = inject(NewsletterService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  readonly locale = inject(LocaleService);
  readonly pathService = inject(LocalizedPathService);

  store = signal<StoreData | null>(null);
  /** Content pages from settings() signal */
  contentPages = computed<SettingsContentPage[]>(() => this.storeService.settings()?.contentPages ?? []);
  /** Unified footer links from BE: contentPages + quickLinks, deduplicated. No static/hardcoded data. */
  footerLinks = computed<FooterLink[]>(() => this.buildFooterLinks(this.quickLinks(), this.contentPages()));
  /** Newsletter section visibility from settings (fallback when store not loaded) */
  newsletterEnabledFromSettings = computed(() => this.storeService.settings()?.newsletterEnabled ?? null);
  /** When false, hide social links. From settings(); default true when not set. */
  showSocialLinksFromSettings = computed(() => this.storeService.settings()?.showSocialLinks ?? null);
  /** Social links from settings() (fallback when store has none). */
  socialLinksFromSettings = computed(() => this.storeService.settings()?.socialLinks ?? null);
  newsletterEmail = signal('');
  newsletterMessage = signal<'idle' | 'success' | 'error' | 'already'>('idle');
  newsletterLoading = signal(false);
  newsletterSubmitted = signal(false);
  readonly currentYear = new Date().getFullYear();

  newsletterValid = computed(() => !emailErrorKey(this.newsletterEmail()));
  newsletterEmailError = computed(() => {
    if (!this.newsletterSubmitted()) return null;
    const key = emailErrorKey(this.newsletterEmail());
    return key ? this.translate.instant(key) : null;
  });
  currentLocale = computed(() => this.locale.getLocale());

  /** Social links: from store first, fallback to settings(). */
  socialLinks = computed(() => {
    const fromStore = this.store()?.socialLinks;
    let storeList: { platform: string; url: string }[] = [];
    if (Array.isArray(fromStore)) storeList = fromStore;
    else if (fromStore && typeof fromStore === 'object')
      storeList = Object.entries(fromStore).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    if (storeList.length > 0) return storeList;
    const fromSettings = this.socialLinksFromSettings();
    if (fromSettings && typeof fromSettings === 'object')
      return Object.entries(fromSettings).map(([platform, url]) => ({ platform, url: String(url ?? '') }));
    return [];
  });

  showSocialSection = computed(
    () => (this.showSocialLinksFromSettings() !== false) && this.socialLinks().length > 0
  );

  quickLinks = computed(() => {
    const links = this.store()?.quickLinks;
    return Array.isArray(links) ? links : [];
  });

  showNewsletterSection = computed(
    () => this.store()?.newsletterEnabled ?? this.newsletterEnabledFromSettings() ?? true
  );

  /** Build unified footer links from BE data; dedupe by normalized URL. */
  private buildFooterLinks(quickLinks: StoreQuickLink[], contentPages: SettingsContentPage[]): FooterLink[] {
    const contentSlugs = new Set<string>();
    for (const p of contentPages) {
      const slugVal = p.slug;
      if (typeof slugVal === 'string' && slugVal.trim()) contentSlugs.add(slugVal.trim().toLowerCase());
      else if (slugVal && typeof slugVal === 'object') {
        if (slugVal.en?.trim()) contentSlugs.add(slugVal.en.trim().toLowerCase());
        if (slugVal.ar?.trim()) contentSlugs.add(slugVal.ar.trim().toLowerCase());
      }
    }
    const links: FooterLink[] = [];

    for (const link of quickLinks) {
      const url = (link.url ?? '').trim();
      if (!url) continue;
      const isExternal = url.startsWith('http://') || url.startsWith('https://');
      const title = this.getLocalized(link.title);
      if (!title) continue;

      if (isExternal) {
        links.push({ title, url, external: true });
        continue;
      }
      if (url === '/' || url === '/catalog') {
        links.push({ title, url, external: false });
        continue;
      }
      if (url === '/contact' || url.startsWith('/page/')) {
        const slug = url === '/contact' ? 'contact' : url.replace(/^\/page\//, '').toLowerCase();
        if (contentSlugs.has(slug)) continue;
      }
      links.push({ title, url, external: false });
    }

    for (const page of contentPages) {
      const slug = getLocalizedSlug(page.slug, this.locale.getLocale()).trim().toLowerCase();
      if (!slug) continue;
      const url = slug === 'contact' ? '/contact' : `/page/${slug}`;
      const title = this.getLocalized(page.title) || slug;
      links.push({ title, url, external: false });
    }

    return links;
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined | null): string {
    if (!obj || typeof obj !== 'object') return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  ngOnInit(): void {
    this.storeService.getStore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => this.store.set(s));
  }

  submitNewsletter(event?: Event): void {
    event?.preventDefault();
    this.newsletterSubmitted.set(true);
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
