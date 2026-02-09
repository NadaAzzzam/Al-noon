import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../core/services/store.service';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../core/services/locale.service';
import { LocalizedPipe } from '../../shared/pipe/localized.pipe';
import type { ContentPage } from '../../core/types/api.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [CommonModule, TranslateModule, LocalizedPipe],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
})
export class PageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(StoreService);
  readonly locale = inject(LocaleService);
  private sub: Subscription | null = null;

  page = signal<ContentPage | null>(null);
  notFound = signal(false);
  loading = signal(true);

  private loadPage(slug: string | null): void {
    this.sub?.unsubscribe();
    this.page.set(null);
    this.notFound.set(false);
    if (!slug) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.loading.set(true);
    this.sub = this.storeService.getPage(slug).subscribe({
      next: (p) => {
        this.loading.set(false);
        this.page.set(p);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
      complete: () => {
        if (!this.page() && !this.notFound()) this.loading.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => this.loadPage(params.get('slug')));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
