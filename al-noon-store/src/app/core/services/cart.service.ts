import { Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

const STORAGE_KEY = 'al_noon_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this.itemsSignal.asReadonly();
  readonly count = computed(() =>
    this.itemsSignal().reduce((sum, i) => sum + i.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch {}
    return [];
  }

  private persist(items: CartItem[]): void {
    this.itemsSignal.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  add(item: CartItem): void {
    const list = [...this.itemsSignal()];
    const idx = list.findIndex((i) => i.productId === item.productId);
    if (idx >= 0) list[idx].quantity += item.quantity;
    else list.push({ ...item });
    this.persist(list);
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    const list = this.itemsSignal().map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    this.persist(list);
  }

  remove(productId: string): void {
    this.persist(this.itemsSignal().filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.persist([]);
  }

  getItemsForOrder(): { product: string; quantity: number; price: number }[] {
    return this.itemsSignal().map((i) => ({
      product: i.productId,
      quantity: i.quantity,
      price: i.price,
    }));
  }
}
