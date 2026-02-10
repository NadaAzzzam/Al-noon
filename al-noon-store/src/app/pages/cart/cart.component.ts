import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, BreadcrumbComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly api = inject(ApiService);
  items = this.cart.items;
  subtotal = this.cart.subtotal;

  updateQty(productId: string, qty: number, variant?: string): void {
    this.cart.setQuantity(productId, qty, variant);
  }

  remove(productId: string, variant?: string): void {
    this.cart.remove(productId, variant);
  }
}
