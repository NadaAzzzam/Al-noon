import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { ApiService } from '../../core/services/api.service';
import { LocaleService } from '../../core/services/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import type { Product } from '../../core/types/api.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cart = inject(CartService);
  readonly api = inject(ApiService);
  readonly locale = inject(LocaleService);

  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  selectedImageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);
  added = signal(false);

  images = computed(() => {
    const p = this.product();
    if (!p) return [];
    const list = p.images ?? [];
    const byColor = p.imageColors?.map((c) => (typeof c === 'string' ? c : c.imageUrl)).filter(Boolean) as string[] | undefined;
    return byColor?.length ? byColor : list;
  });

  currentPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'undefined' || id === '') return;
    this.productsService.getProduct(id).subscribe({
      next: (p) => this.product.set(p),
      error: () => this.product.set(null),
    });
    this.productsService.getRelated(id).subscribe((list) => this.related.set(list));
  }

  addToCart(): void {
    const p = this.product();
    if (!p || p.stock < 1) return;
    const price = this.currentPrice();
    this.cart.add({
      productId: p.id,
      quantity: this.quantity(),
      price,
      name: this.getLocalized(p.name),
      image: p.images?.[0],
    });
    this.added.set(true);
    setTimeout(() => this.added.set(false), 2000);
  }

  getLocalized(obj: { en?: string; ar?: string } | undefined): string {
    if (!obj) return '';
    const lang = this.locale.getLocale();
    return (obj[lang] ?? obj.en ?? obj.ar ?? '') as string;
  }
}
