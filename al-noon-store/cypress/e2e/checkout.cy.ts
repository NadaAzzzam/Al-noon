describe('Checkout', () => {
  const cartItems = [
    {
      productId: '1',
      quantity: 2,
      price: 99.99,
      name: 'Test Product',
      image: '/uploads/test.jpg',
    },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
    cy.intercept('GET', '**/cities**', {
      body: {
        success: true,
        data: [
          { id: '1', name: { en: 'Cairo', ar: 'القاهرة' }, deliveryFee: 50 },
        ],
      },
    }).as('cities');
    cy.intercept('GET', '**/shipping-methods**', {
      body: {
        success: true,
        data: [
          { id: 'std', name: { en: 'Standard', ar: 'عادي' }, price: 50, description: {} },
        ],
      },
    }).as('shipping');
    cy.intercept('GET', '**/payment-methods**', {
      body: {
        success: true,
        data: [
          { id: 'COD', name: { en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' } },
        ],
      },
    }).as('payment');
    cy.intercept('GET', '**/store/**', { body: { success: true, data: null } }).as('store');

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
  });

  it('should display checkout when cart has items', () => {
    cy.visit('/checkout', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('app-root').should('exist');
    cy.get('.checkout-wrapper, .checkout-form, form').should('exist');
  });

  it('should display discount code input and Apply button', () => {
    cy.visit('/checkout', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('.summary-discount').should('exist');
    cy.get('.discount-input').should('exist');
    cy.get('.discount-btn').should('exist').and('contain.text', 'Apply');
  });

  it('should apply discount code when user enters code and clicks Apply', () => {
    cy.visit('/checkout', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('.discount-input').type('SAVE10');
    cy.get('.discount-btn').click();
    cy.get('.discount-applied, .discount-btn-remove').should('exist');
  });

  it('should show empty state when cart is empty', () => {
    cy.visit('/checkout', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('al_noon_cart');
      },
    });
    cy.get('.checkout-empty').should('exist');
  });
});
