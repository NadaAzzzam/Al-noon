import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal(
      'localStorage',
      {
        getItem: (key: string) => localStorageMock[key] ?? null,
        setItem: (key: string, value: string) => {
          localStorageMock[key] = value;
        },
        removeItem: (key: string) => {
          delete localStorageMock[key];
        },
        clear: () => {
          Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]);
        },
        length: 0,
        key: () => null,
      }
    );
    service = new CartService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty cart', () => {
    expect(service.items()).toEqual([]);
    expect(service.count()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  it('should add item to cart', () => {
    const result = service.add({
      productId: 'p1',
      quantity: 2,
      price: 100,
      name: 'Product 1',
    });
    expect(result.success).toBe(true);
    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].productId).toBe('p1');
    expect(service.items()[0].quantity).toBe(2);
    expect(service.count()).toBe(2);
    expect(service.subtotal()).toBe(200);
  });

  it('should merge quantity when adding same product', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    service.add({ productId: 'p1', quantity: 3, price: 100 });
    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].quantity).toBe(5);
  });

  it('should treat different variants as separate items', () => {
    service.add({ productId: 'p1', variant: 'S', quantity: 1, price: 100 });
    service.add({ productId: 'p1', variant: 'M', quantity: 2, price: 100 });
    expect(service.items()).toHaveLength(2);
  });

  it('should respect maxStock when adding', () => {
    const result = service.add(
      { productId: 'p1', quantity: 5, price: 100 },
      3
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain('Only 3 available');
  });

  it('should remove item', () => {
    service.add({ productId: 'p1', quantity: 1, price: 100 });
    service.remove('p1');
    expect(service.items()).toHaveLength(0);
  });

  it('should set quantity', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    const result = service.setQuantity('p1', 5);
    expect(result.success).toBe(true);
    expect(service.getItemQuantity('p1')).toBe(5);
  });

  it('should remove item when setting quantity to 0', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    service.setQuantity('p1', 0);
    expect(service.items()).toHaveLength(0);
  });

  it('should clear cart', () => {
    service.add({ productId: 'p1', quantity: 1, price: 100 });
    service.setSpecialInstructions('Gift wrap');
    service.clear();
    expect(service.items()).toHaveLength(0);
    expect(service.specialInstructions()).toBe('');
  });

  it('should open and close drawer', () => {
    const bodySpy = vi.spyOn(document.body.style, 'overflow', 'set');
    service.openDrawer();
    expect(service.drawerOpen()).toBe(true);
    expect(bodySpy).toHaveBeenCalledWith('hidden');
    service.closeDrawer();
    expect(service.drawerOpen()).toBe(false);
    expect(bodySpy).toHaveBeenCalledWith('');
  });

  it('should get items for order', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    const items = service.getItemsForOrder();
    expect(items).toEqual([{ product: 'p1', quantity: 2, price: 100 }]);
  });

  it('should remove item when setQuantity is 0 or negative', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    service.setQuantity('p1', 0);
    expect(service.items()).toHaveLength(0);
    service.add({ productId: 'p2', quantity: 1, price: 50 });
    service.setQuantity('p2', -1);
    expect(service.items()).toHaveLength(0);
  });
});
