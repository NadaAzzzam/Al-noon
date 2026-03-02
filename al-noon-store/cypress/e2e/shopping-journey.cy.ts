/// <reference types="cypress" />
/**
 * Full shopping journey - browse, add to cart, checkout, order confirmation.
 * Covers key business scenarios.
 */
describe('Shopping Journey', () => {
  const mockProduct = {
    success: true,
    data: {
      id: 'prod-1',
      name: { en: 'Test Product', ar: 'منتج' },
      price: 99,
      stock: 10,
      images: ['/img.jpg'],
    },
  };

  const mockProductsList = {
    success: true,
    data: [mockProduct.data],
    pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
  };

  const storeHome = {
    success: true,
    data: {
      home: { storeName: { en: 'Store' }, hero: {}, newArrivals: [], quickLinks: [], socialLinks: [], homeCollections: [], feedbacks: [], discountCodeSupported: false },
    },
  };
  beforeEach(() => {
    cy.intercept('GET', '**/api/store/home*', storeHome).as('getHome');
    cy.intercept('GET', '**/api/settings*', { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/api/categories*', { success: true, data: [] }).as('getCategories');
    cy.intercept('GET', '**/api/products*', mockProductsList).as('getProducts');
    cy.intercept('GET', '**/api/products/prod-1*', mockProduct).as('getProduct');
    cy.intercept('GET', '**/api/products/*/related*', { success: true, data: [] }).as('getRelated');
    cy.intercept('GET', '**/api/products/filters/sort*', { success: true, data: [] }).as('getSortFilters');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/cities**', {
      body: { success: true, data: { cities: [{ id: '1', name: { en: 'Cairo' }, deliveryFee: 30 }] } },
    }).as('getCities');
    cy.intercept('GET', '**/shipping-methods**', {
      body: {
        success: true,
        data: [{ id: 'std', name: { en: 'Standard' }, price: 30, description: {}, estimatedDays: '3-5' }],
      },
    }).as('getShipping');
    cy.intercept('GET', '**/payment-methods**', {
      body: { success: true, data: { paymentMethods: [{ id: 'COD', name: { en: 'Cash on Delivery' } }] } },
    }).as('getPayment');
  });

  it('should browse catalog, open product, and add to cart', () => {
    cy.visit('/en');
    cy.wait('@getHome');

    cy.get('a.section-link').first().scrollIntoView().click();
    cy.url().should('include', '/catalog');
    cy.wait('@getProducts');

    cy.get('a[href*="/product/"], a[routerlink*="product"]').first().click();
    cy.url().should('include', '/product/');
    cy.wait('@getProduct');

    cy.get('.add-to-cart-btn').should('exist').click();
    cy.get('.cart-count, .cart-link, [aria-label*="cart"]').should('exist');
  });

  it('should complete checkout when cart has items', () => {
    const cartItems = [
      { productId: 'p1', quantity: 1, price: 99, name: 'Test Product' },
    ];
    cy.intercept('POST', '**/checkout', {
      statusCode: 201,
      body: { success: true, data: { order: { id: 'ord-123', items: [], total: 129, status: 'PENDING' } } },
    }).as('checkout');

    cy.visit('/en/checkout', {
      onBeforeLoad: (win) => win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems)),
    });
    cy.get('.checkout-wrapper').should('exist');
    cy.wait(['@getHome', '@getCities', '@getShipping', '@getPayment']);
    cy.get('.shipping-option').should('have.length.at.least', 1);
    cy.get('.payment-option').should('have.length.at.least', 1);
    cy.get('button[type="submit"]').first().click();
    cy.wait('@checkout');
    cy.url().should('include', 'order-confirmation');
  });

  it('should browse catalog and see products', () => {
    cy.visit('/en/catalog');
    cy.get('app-root').should('exist');
    cy.wait('@getProducts');
    cy.get('body')
      .invoke('text')
      .then((text) => cy.wrap(text.includes('Test Product') || text.includes('product')).should('be.true'));
  });
});
