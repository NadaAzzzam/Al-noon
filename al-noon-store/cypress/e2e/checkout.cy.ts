/// <reference types="cypress" />
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

  it('should submit checkout with discount code when applied', () => {
    cy.intercept('POST', '**/checkout', (req) => {
      const body = req.body;
      if (body?.discountCode === 'SAVE10') {
        req.reply({
          statusCode: 201,
          body: {
            success: true,
            message: 'Order placed successfully',
            data: { order: { id: 'ord-1', items: [], total: 90, status: 'PENDING' } },
          },
        });
      } else {
        req.reply({ statusCode: 400, body: { success: false, message: 'Missing discount' } });
      }
    }).as('checkout');
    cy.visit('/checkout', { onBeforeLoad: (w) => w.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems)) });
    cy.get('.discount-input').type('SAVE10');
    cy.get('.discount-btn').first().click();
    cy.get('.discount-applied, .discount-btn-remove').should('exist');
    cy.get('button[type="submit"]').first().click();
    cy.wait('@checkout');
    cy.url().should('include', 'order-confirmation');
  });

  it('should show error and clear applied when checkout returns invalid discount', () => {
    cy.intercept('POST', '**/checkout', {
      statusCode: 400,
      body: { success: false, message: 'Invalid discount code' },
    }).as('checkout');
    cy.visit('/checkout', { onBeforeLoad: (w) => w.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems)) });
    cy.get('.discount-input').type('BADCODE');
    cy.get('.discount-btn').first().click();
    cy.get('.discount-applied, .discount-btn-remove').should('exist');
    cy.get('button[type="submit"]').first().click();
    cy.wait('@checkout');
    cy.get('.error-block, .error-msg, .discount-error').should('exist').and('contain.text', 'Invalid');
    cy.get('.discount-applied').should('not.exist');
  });

  it('should disable submit button during checkout (double-click prevention)', () => {
    cy.intercept('POST', '**/checkout', {
      delay: 1500,
      statusCode: 201,
      body: {
        success: true,
        data: { order: { id: 'ord-1', items: [], total: 100, status: 'PENDING' } },
      },
    }).as('checkout');
    cy.visit('/checkout', { onBeforeLoad: (w) => w.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems)) });
    cy.get('button[type="submit"]').first().click();
    cy.get('button[type="submit"]').first().should('be.disabled');
    cy.wait('@checkout');
  });

  it('should show update cart link when checkout returns out-of-stock 400', () => {
    cy.intercept('POST', '**/checkout', {
      statusCode: 400,
      body: { success: false, message: 'Product X is out of stock' },
    }).as('checkout');
    cy.visit('/checkout', { onBeforeLoad: (w) => w.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems)) });
    cy.get('button[type="submit"]').first().click();
    cy.wait('@checkout');
    cy.get('.error-block').should('exist');
    cy.get('.error-update-cart, a[href*="cart"]').should('exist');
  });
});
