import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.hasToasts()) {
      <div class="toast-container" role="alert" aria-live="polite">
        @for (t of toast.toasts(); track t.id) {
          <div class="toast" [class]="'toast-' + t.type">
            <span class="toast-message">{{ t.message }}</span>
            <button class="toast-close" (click)="toast.dismiss(t.id)" aria-label="Close">&times;</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: calc(var(--header-height, 72px) + 16px);
      inset-inline-end: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 6px;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-border, #e8e6e3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      animation: toast-in 0.3s ease;
      font-size: 0.9rem;
    }
    .toast-success { border-inline-start: 4px solid var(--color-success, #27ae60); }
    .toast-error { border-inline-start: 4px solid var(--color-error, #e74c3c); }
    .toast-info { border-inline-start: 4px solid var(--color-accent, #2c2c2c); }
    .toast-message { flex: 1; }
    .toast-close {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--color-text-muted, #5c5c5c);
      padding: 0 4px;
      line-height: 1;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `],
})
export class ToastComponent {
  readonly toast = inject(ToastService);
}
