import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BackToTopComponent } from '../shared/components/back-to-top/back-to-top.component';
import { StoreService } from '../core/services/store.service';
import { LocaleService } from '../core/services/locale.service';
import { getLocalized } from '../core/utils/localized';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BackToTopComponent],
  host: { '[class.announcement-visible]': 'announcementEnabled()' },
  template: `
    <!-- Infinite sliding announcement banner (from GET /api/settings) -->
    @if (announcementEnabled()) {
      <div class="announcement-bar" [style.background]="announcementBg()">
        <div class="announcement-track">
          @for (i of repeatedText; track i) {
            <span class="announcement-item">{{ bannerText() }} &nbsp;&bull;&nbsp; </span>
          }
        </div>
      </div>
    }
    <app-header />
    <main class="main">
      <router-outlet />
    </main>
    <app-footer />
    <app-back-to-top />
  `,
  styles: [`
    :host {
      --announcement-height: 0;
    }
    :host.announcement-visible {
      --announcement-height: 36px;
    }

    .main {
      min-height: calc(100vh - var(--header-height) - 200px);
    }

    /* ── Infinite sliding announcement banner (sticky like header); background set from API ── */
    .announcement-bar {
      position: sticky;
      top: 0;
      z-index: 101;
      color: #f5e6ca;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.04em;
      overflow: hidden;
      white-space: nowrap;
      height: var(--announcement-height);
      display: flex;
      align-items: center;
    }

    .announcement-track {
      display: inline-flex;
      animation: marquee 30s linear infinite;
      will-change: transform;
    }

    .announcement-item {
      display: inline-block;
      padding: 0 8px;
    }

    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    :host-context([dir='rtl']) .announcement-track {
      animation: marquee-rtl 30s linear infinite;
    }

    @keyframes marquee-rtl {
      0% { transform: translateX(0); }
      100% { transform: translateX(50%); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly locale = inject(LocaleService);
  private readonly destroyRef = inject(DestroyRef);

  /** Text repeated 3 times in the marquee (from API settings announcementBar.text) */
  repeatedText = [1, 2, 3];
  bannerText = signal('');
  announcementEnabled = signal(false);
  announcementBg = signal<string>('');

  ngOnInit(): void {
    this.storeService.getSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((settings) => {
      const bar = settings?.announcementBar;
      this.announcementEnabled.set(bar?.enabled === true);
      const lang = this.locale.getLocale();
      const text = getLocalized(bar?.text, lang);
      this.bannerText.set(text || '');
      const bg = bar?.backgroundColor?.trim();
      this.announcementBg.set(bg || 'linear-gradient(90deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e)');
    });
  }
}
