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
    cy.intercept('GET', '**/store/**', { body: { success: true, data: {} } }).as('getStore');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should load product detail page and show product info', () => {
    cy.visit('/product/1');
    cy.wait('@getProduct', { timeout: 10000 });
    cy.get('.product-detail').should('exist');
    cy.get('body').should('contain.text', 'Test Product');
  });

  it('should display price', () => {
    cy.visit('/product/1');
    cy.wait('@getProduct', { timeout: 10000 });
    cy.get('.product-detail .price, .current-price, .current').should('exist');
  });

  it('should display add to cart when in stock', () => {
    cy.visit('/product/1');
    cy.wait('@getProduct', { timeout: 10000 });
    cy.get('.add-to-cart-btn').should('exist');
  });

  it('should handle invalid product ID gracefully', () => {
    cy.intercept('GET', '**/products/invalid-id*', { statusCode: 404 }).as('getProduct404');
    cy.visit('/product/invalid-id');
    cy.wait('@getProduct404');
    cy.get('app-root').should('exist');
  });
});
