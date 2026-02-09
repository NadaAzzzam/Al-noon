import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-wrapper" [attr.aria-label]="'Loading'" role="status">
      @for (item of items(); track $index) {
        @if (type() === 'card') {
          <div class="skeleton-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-text" style="width: 70%; height: 14px; margin-top: 12px;"></div>
            <div class="skeleton skeleton-text" style="width: 40%; height: 14px; margin-top: 8px;"></div>
          </div>
        } @else {
          <div class="skeleton skeleton-text" style="height: 16px; margin-bottom: 12px;" [style.width]="item % 2 === 0 ? '80%' : '60%'"></div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
    .skeleton-card { padding: 0; }
    .skeleton-image { width: 100%; aspect-ratio: 3/4; border-radius: 4px; }
    .skeleton-text { border-radius: 4px; }
    .skeleton {
      background: linear-gradient(90deg, var(--color-border, #e8e6e3) 25%, #f0eeeb 50%, var(--color-border, #e8e6e3) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class LoadingSkeletonComponent {
  type = input<'card' | 'text'>('card');
  count = input<number>(4);
  items = computed(() => Array.from({ length: this.count() }, (_, i) => i));
}
