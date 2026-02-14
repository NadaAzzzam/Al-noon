import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { StoreService } from '../../core/services/store.service';
import { SeoService } from '../../core/services/seo.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import { getLocalized } from '../../core/utils/localized';
import type { ContentPage } from '../../core/types/api.types';

function stripHtml(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() + '…' : text;
}

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [TranslatePipe, LocalizedPipe],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(StoreService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);

  page = signal<ContentPage | null>(null);
  notFound = signal(false);
  loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        this.page.set(null);
        this.notFound.set(false);
        if (!slug) {
          this.loading.set(false);
          this.notFound.set(true);
          return of(null);
        }
        this.loading.set(true);
        return this.storeService.getPage(slug);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (p) => {
        this.loading.set(false);
        if (p) {
          this.page.set(p);
          const lang = this.locale.getLocale();
          const title = getLocalized(p.title, lang);
          const contentStr = getLocalized(p.content, lang);
          this.seo.setPage({
            title: title || p.slug,
            description: contentStr ? stripHtml(contentStr) : undefined,
          });
        } else if (!this.notFound()) {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
