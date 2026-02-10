import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersService } from '../../../core/services/orders.service';
import { ApiService } from '../../../core/services/api.service';
import { LocaleService } from '../../../core/services/locale.service';
import { TranslatePipe } from '@ngx-translate/core';
import type { Order, StructuredAddress } from '../../../core/types/api.types';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  order = signal<Order | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.ordersService.getOrder(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }

  /** Format shipping address — handles both structured object and flat string */
  formatAddress(addr: string | StructuredAddress | null | undefined): string {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.address,
      addr.apartment,
      addr.city,
      addr.governorate,
      addr.postalCode,
      addr.country,
    ].filter(Boolean);
    return parts.join(', ');
  }
}
