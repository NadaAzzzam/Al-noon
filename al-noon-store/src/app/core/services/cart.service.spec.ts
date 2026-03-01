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
    // Ensure document.body exists (CI may run without full DOM)
    if (!document.body) {
      const body = document.createElement('body');
      (document as { body: HTMLElement }).body = body;
    }
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

  it('should respect maxStock when setQuantity exceeds availability', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    const result = service.setQuantity('p1', 9999, undefined, 5);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Only 5 available');
    expect(service.getItemQuantity('p1')).toBe(2);
  });

  it('should persist special instructions to localStorage', () => {
    service.add({ productId: 'p1', quantity: 1, price: 100 });
    service.setSpecialInstructions('Handle with care');
    expect(service.specialInstructions()).toBe('Handle with care');
    expect(localStorageMock['al_noon_cart_instructions']).toBe('Handle with care');
  });

  it('should compute subtotal correctly for multiple items', () => {
    service.add({ productId: 'p1', quantity: 2, price: 100 });
    service.add({ productId: 'p2', quantity: 3, price: 50 });
    expect(service.subtotal()).toBe(350);
    expect(service.count()).toBe(5);
  });

  it('should get item quantity for variant', () => {
    service.add({ productId: 'p1', variant: 'S', quantity: 2, price: 100 });
    expect(service.getItemQuantity('p1', 'S')).toBe(2);
    expect(service.getItemQuantity('p1', 'M')).toBe(0);
    expect(service.getItemQuantity('p1')).toBe(0);
  });

  describe('business scenarios', () => {
    it('should reject adding more than stock when merging quantities', () => {
      service.add({ productId: 'p1', quantity: 2, price: 100 });
      const result = service.add({ productId: 'p1', quantity: 2, price: 100 }, 3);
      expect(result.success).toBe(false);
      expect(service.getItemQuantity('p1')).toBe(2);
    });

    it('should allow updating quantity within stock limit', () => {
      service.add({ productId: 'p1', quantity: 2, price: 100 });
      const result = service.setQuantity('p1', 3, undefined, 5);
      expect(result.success).toBe(true);
      expect(service.getItemQuantity('p1')).toBe(3);
    });

    it('should toggle drawer open/close', () => {
      if (!document.body) {
        (document as { body: HTMLElement }).body = document.createElement('body');
      }
      expect(service.drawerOpen()).toBe(false);
      service.toggleDrawer();
      expect(service.drawerOpen()).toBe(true);
      service.toggleDrawer();
      expect(service.drawerOpen()).toBe(false);
    });

    it('should return getItemsForOrder with variant products', () => {
      service.add({ productId: 'p1', variant: 'M', quantity: 1, price: 150 });
      const items = service.getItemsForOrder();
      expect(items).toEqual([{ product: 'p1', quantity: 1, price: 150 }]);
    });
  });

  describe('localized product name (en/ar)', () => {
    it('should add and persist item with LocalizedText name', () => {
      const result = service.add({
        productId: 'p1',
        quantity: 1,
        price: 100,
        name: { en: 'Wool Cape', ar: 'كاب صوف' },
        image: 'uploads/cape.jpg',
      });
      expect(result.success).toBe(true);
      const items = service.items();
      expect(items).toHaveLength(1);
      expect(items[0].name).toEqual({ en: 'Wool Cape', ar: 'كاب صوف' });
      expect(items[0].image).toBe('uploads/cape.jpg');
    });

    it('should persist LocalizedText name to localStorage', () => {
      service.add({
        productId: 'p1',
        quantity: 1,
        price: 100,
        name: { en: 'Wool Cape', ar: 'كاب صوف' },
      });
      const stored = JSON.parse(localStorageMock['al_noon_cart']);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toEqual({ en: 'Wool Cape', ar: 'كاب صوف' });
    });

    it('should load cart with LocalizedText name from storage', () => {
      const cartWithLocalizedName = [
        {
          productId: 'p1',
          quantity: 2,
          price: 100,
          name: { en: 'Abaya', ar: 'عباية' },
          variant: undefined,
        },
      ];
      localStorageMock['al_noon_cart'] = JSON.stringify(cartWithLocalizedName);
      service = new CartService();
      const items = service.items();
      expect(items).toHaveLength(1);
      expect(items[0].name).toEqual({ en: 'Abaya', ar: 'عباية' });
    });

    it('should support legacy string name (backward compat)', () => {
      const cartWithLegacyName = [
        {
          productId: 'p1',
          quantity: 1,
          price: 99.99,
          name: 'Test Product',
          variant: undefined,
        },
      ];
      localStorageMock['al_noon_cart'] = JSON.stringify(cartWithLegacyName);
      service = new CartService();
      const items = service.items();
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Test Product');
    });

    it('should merge quantity and preserve LocalizedText name when adding same product', () => {
      service.add({
        productId: 'p1',
        quantity: 1,
        price: 100,
        name: { en: 'Wool Cape', ar: 'كاب صوف' },
      });
      service.add({
        productId: 'p1',
        quantity: 2,
        price: 100,
        name: { en: 'Wool Cape', ar: 'كاب صوف' },
      });
      const items = service.items();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
      expect(items[0].name).toEqual({ en: 'Wool Cape', ar: 'كاب صوف' });
    });
  });
});
