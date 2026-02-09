import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import type { ContentPage } from '../../core/types/api.types';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, LocalizedPipe],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
})
export class PageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(StoreService);
  readonly locale = inject(LocaleService);

  page = signal<ContentPage | null>(null);
  notFound = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }
    this.storeService.getPage(slug).subscribe({
      next: (p) => this.page.set(p),
      error: () => this.notFound.set(true),
    });
  }
}
