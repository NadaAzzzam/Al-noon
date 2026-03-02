/// <reference types="cypress" />
describe('Order Detail Page (requires auth)', () => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
  const mockOrder = {
    id: 'ord-1',
    status: 'PENDING',
    total: 150,
    items: [{ productId: '1', quantity: 1, price: 100, product: { id: '1', name: { en: 'Product' } } }],
    deliveryFee: 35,
    shippingAddress: { address: '123 St', city: 'Cairo' },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/auth/profile', {
      success: true,
      data: { user: mockUser },
    }).as('getProfile');
    cy.intercept('GET', '**/api/orders/ord-1*', { success: true, data: { order: mockOrder } }).as('getOrder');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/store/home*', {
      body: { success: true, data: { home: { storeName: { en: 'Store' }, hero: {}, newArrivals: [], quickLinks: [], socialLinks: [], homeCollections: [], feedbacks: [] } } },
    }).as('getStore');

    cy.visit('/en/account/orders/ord-1', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('al_noon_auth_session', '1');
      },
    });
  });

  it('should load order detail when authenticated', () => {
    cy.wait('@getProfile');
    cy.wait('@getOrder');
    cy.get('app-root').should('exist');
  });

  it('should display order info', () => {
    cy.wait('@getProfile');
    cy.wait('@getOrder');
    cy.get('body').should('contain.text', 'Product');
  });
});
