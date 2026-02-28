import { Injectable, signal, computed } from '@angular/core';
import type { LocalizedText } from '../types/api.types';

export interface CartItem {
  productId: string;
  /** Variant key (e.g. "S-M (till 75kg)") so the same product in different sizes are separate lines */
  variant?: string;
  quantity: number;
  price: number;
  /** Product name in en and ar; supports legacy string for backward compat with existing cart data */
  name?: string | LocalizedText;
  image?: string;
}

const STORAGE_KEY = 'al_noon_cart';
const INSTRUCTIONS_KEY = 'al_noon_cart_instructions';

/** Unique key per cart line: productId + variant */
function itemKey(item: { productId: string; variant?: string }): string {
  return item.variant ? `${item.productId}__${item.variant}` : item.productId;
}

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

  /** Cart drawer open state (shared so header, product-detail etc. can open it) */
  readonly drawerOpen = signal(false);

  /** Special instructions for the order */
  readonly specialInstructions = signal(this.loadInstructions());

  openDrawer(): void {
    this.drawerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleDrawer(): void {
    if (this.drawerOpen()) this.closeDrawer();
    else this.openDrawer();
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as CartItem[];
    } catch {}
    return [];
  }

  private loadInstructions(): string {
    try {
      return localStorage.getItem(INSTRUCTIONS_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private persist(items: CartItem[]): void {
    this.itemsSignal.set(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }

  setSpecialInstructions(value: string): void {
    this.specialInstructions.set(value);
    try {
      localStorage.setItem(INSTRUCTIONS_KEY, value);
    } catch {}
  }

  add(item: CartItem, maxStock?: number): { success: boolean; message?: string } {
    const list = [...this.itemsSignal()];
    const key = itemKey(item);
    const idx = list.findIndex((i) => itemKey(i) === key);

    if (idx >= 0) {
      const newQty = list[idx].quantity + item.quantity;
      // Validate against max stock if provided
      if (maxStock !== undefined && newQty > maxStock) {
        return {
          success: false,
          message: `Cannot add more items. Only ${maxStock} available in stock.`
        };
      }
      list[idx] = { ...list[idx], quantity: newQty };
    } else {
      // Validate initial quantity against max stock
      if (maxStock !== undefined && item.quantity > maxStock) {
        return {
          success: false,
          message: `Cannot add ${item.quantity} items. Only ${maxStock} available in stock.`
        };
      }
      list.push({ ...item });
    }

    this.persist(list);
    return { success: true };
  }

  setQuantity(productId: string, quantity: number, variant?: string, maxStock?: number): { success: boolean; message?: string } {
    const key = itemKey({ productId, variant });
    if (quantity < 1) {
      this.remove(productId, variant);
      return { success: true };
    }

    // Validate against max stock if provided
    if (maxStock !== undefined && quantity > maxStock) {
      return {
        success: false,
        message: `Cannot set quantity to ${quantity}. Only ${maxStock} available in stock.`
      };
    }

    const list = this.itemsSignal().map((i) =>
      itemKey(i) === key ? { ...i, quantity } : i
    );
    this.persist(list);
    return { success: true };
  }

  remove(productId: string, variant?: string): void {
    const key = itemKey({ productId, variant });
    this.persist(this.itemsSignal().filter((i) => itemKey(i) !== key));
  }

  clear(): void {
    this.persist([]);
    this.setSpecialInstructions('');
  }

  getItemsForOrder(): { product: string; quantity: number; price: number }[] {
    return this.itemsSignal().map((i) => ({
      product: i.productId,
      quantity: i.quantity,
      price: i.price,
    }));
  }

  /** Get current quantity in cart for a specific product and variant */
  getItemQuantity(productId: string, variant?: string): number {
    const key = itemKey({ productId, variant });
    const item = this.itemsSignal().find((i) => itemKey(i) === key);
    return item?.quantity ?? 0;
  }
}
