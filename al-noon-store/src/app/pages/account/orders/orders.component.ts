import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizedPathService } from '../../../core/services/localized-path.service';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersService } from '../../../core/services/orders.service';
import { TranslatePipe } from '@ngx-translate/core';
import { PriceFormatPipe } from '../../../shared/pipe/price.pipe';
import { LocaleService } from '../../../core/services/locale.service';
import type { Order } from '../../../core/types/api.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslatePipe, PriceFormatPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  readonly pathService = inject(LocalizedPathService);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.ordersService.getOrders({ limit: 50 }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
