import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { BackToTopComponent } from '../shared/components/back-to-top/back-to-top.component';
import { StoreService } from '../core/services/store.service';
import { LocaleService } from '../core/services/locale.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BackToTopComponent],
  template: `
    <!-- Infinite sliding announcement banner -->
    <div class="announcement-bar">
      <div class="announcement-track">
        @for (i of [1,2,3,4]; track i) {
          <span class="announcement-item">
            ✨ {{ bannerText() }} &nbsp;&bull;&nbsp;
            🌙 {{ 'Ramadan Kareem' }} &nbsp;&bull;&nbsp;
            🎉 {{ bannerText() }} &nbsp;&bull;&nbsp;
            🌙 {{ 'Ramadan Kareem' }} &nbsp;&bull;&nbsp;
          </span>
        }
      </div>
    </div>
    <app-header />
    <main class="main">
      <router-outlet />
    </main>
    <app-footer />
    <app-back-to-top />
  `,
  styles: [`
    :host {
      --announcement-height: 36px;
    }

    .main {
      min-height: calc(100vh - var(--header-height) - 200px);
    }

    /* ── Infinite sliding announcement banner (sticky like header) ── */
    .announcement-bar {
      position: sticky;
      top: 0;
      z-index: 101;
      background: linear-gradient(90deg, #1a1a2e, #16213e, #0f3460, #16213e, #1a1a2e);
      background-size: 200% 100%;
      animation: announcement-bg 8s linear infinite;
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

    @keyframes announcement-bg {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
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

  bannerText = signal('Free Shipping on Orders Over 500 EGP');

  ngOnInit(): void {
    this.storeService.getStore().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
      const lang = this.locale.getLocale();
      const name = s?.storeName?.[lang] || s?.storeName?.en || 'Al-Noon';
      this.bannerText.set(lang === 'ar'
        ? `شحن مجاني للطلبات فوق ٥٠٠ جنيه — ${name}`
        : `Free Shipping on Orders Over 500 EGP — ${name}`
      );
    });
  }
}
