import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../../core/services/orders.service';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleService } from '../../../core/services/locale.service';
import type { Order } from '../../../core/types/api.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  readonly locale = inject(LocaleService);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.ordersService.getOrders({ limit: 50 }).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
