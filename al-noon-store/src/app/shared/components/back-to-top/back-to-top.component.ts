import { Component, signal, ChangeDetectionStrategy, HostListener } from '@angular/core';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button class="back-to-top" (click)="scrollToTop()" aria-label="Back to top" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>
    }
  `,
  styles: [`
    .back-to-top {
      position: fixed;
      bottom: 24px;
      inset-inline-end: 24px;
      z-index: 900;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 1px solid var(--color-border, #e8e6e3);
      background: var(--color-surface, #fff);
      color: var(--color-text, #1a1a1a);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: opacity 0.3s, transform 0.3s;
      animation: fade-in 0.3s ease;
    }
    .back-to-top:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class BackToTopComponent {
  visible = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.visible.set(window.scrollY > 400);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
