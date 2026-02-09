import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="star-rating" [attr.aria-label]="rating() + ' out of 5 stars'" role="img">
      @for (star of stars(); track $index) {
        <span class="star" [class.filled]="star === 'full'" [class.half]="star === 'half'" [class.empty]="star === 'empty'" aria-hidden="true">&#9733;</span>
      }
      @if (showCount() && count() > 0) {
        <span class="rating-count">({{ count() }})</span>
      }
    </span>
  `,
  styles: [`
    .star-rating { display: inline-flex; align-items: center; gap: 1px; }
    .star { font-size: 0.9em; line-height: 1; }
    .star.filled { color: #d4a853; }
    .star.half { color: #d4a853; opacity: 0.6; }
    .star.empty { color: var(--color-border, #e8e6e3); }
    .rating-count { font-size: 0.85em; color: var(--color-text-muted, #5c5c5c); margin-inline-start: 4px; }
  `],
})
export class StarRatingComponent {
  rating = input<number>(0);
  showCount = input<boolean>(false);
  count = input<number>(0);

  stars = computed(() => {
    const r = Math.max(0, Math.min(5, this.rating()));
    const result: ('full' | 'half' | 'empty')[] = [];
    for (let i = 1; i <= 5; i++) {
      if (r >= i) result.push('full');
      else if (r >= i - 0.5) result.push('half');
      else result.push('empty');
    }
    return result;
  });
}
