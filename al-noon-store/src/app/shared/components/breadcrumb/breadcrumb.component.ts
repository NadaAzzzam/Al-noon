import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol>
        @for (item of items(); track $index; let last = $last) {
          <li>
            @if (item.url && !last) {
              <a [routerLink]="item.url">{{ item.label }}</a>
            } @else {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            }
            @if (!last) { <span class="separator" aria-hidden="true">›</span> }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb { margin-bottom: 16px; font-size: 0.875rem; }
    ol { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 0; padding: 0; margin: 0; }
    li { display: flex; align-items: center; }
    a { color: var(--color-text-muted, #8a6070); text-decoration: none; }
    a:hover { text-decoration: underline; }
    span[aria-current] { color: var(--color-text, #2d1520); font-weight: 500; }
    .separator { display: inline-block; margin: 0 8px; color: var(--color-text-muted, #8a6070); }
    :host-context([dir='rtl']) .separator { transform: scaleX(-1); }
  `],
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
}
