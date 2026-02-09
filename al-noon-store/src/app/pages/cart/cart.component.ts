import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly api = inject(ApiService);
  items = this.cart.items;
  subtotal = this.cart.subtotal;

  updateQty(productId: string, qty: number): void {
    this.cart.setQuantity(productId, qty);
  }

  remove(productId: string): void {
    this.cart.remove(productId);
  }
}
