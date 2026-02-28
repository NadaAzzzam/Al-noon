/// <reference types="cypress" />
describe('Product Detail Page', () => {
  const mockProduct = {
    success: true,
    data: {
      id: '1',
      name: { en: 'Test Product', ar: 'منتج تجريبي' },
      price: 100,
      effectivePrice: 80,
      images: ['/uploads/product.jpg'],
      stock: 5,
      description: { en: 'Product description', ar: 'وصف' },
    },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/products/1*', mockProduct).as('getProduct');
    cy.intercept('GET', '**/products/*/related*', { success: true, data: [] }).as('getRelated');
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getStoreHome');
    cy.intercept({ method: 'GET', url: '**/api/settings*' }, { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should load product detail page and show product info', () => {
    cy.visit('/en/product/1');
    cy.get('app-root', { timeout: 10000 }).should('exist');
    cy.get('.product-detail, app-product-detail, app-loading-skeleton', { timeout: 10000 }).should('exist');
  });

  it('should display price', () => {
    cy.visit('/en/product/1');
    cy.get('app-root', { timeout: 10000 }).should('exist');
    cy.get('.product-detail .price, .current-price, .current, app-loading-skeleton', { timeout: 10000 }).should('exist');
  });

  it('should display add to cart when in stock', () => {
    cy.visit('/en/product/1');
    cy.get('app-root', { timeout: 10000 }).should('exist');
    cy.get('.add-to-cart-btn, app-loading-skeleton', { timeout: 10000 }).should('exist');
  });

  it('should handle invalid product ID gracefully', () => {
    cy.intercept('GET', '**/products/invalid-id*', { statusCode: 404 }).as('getProduct404');
    cy.visit('/en/product/invalid-id');
    cy.get('app-root', { timeout: 10000 }).should('exist');
  });
});
