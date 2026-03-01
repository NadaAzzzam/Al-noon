/// <reference types="cypress" />
describe('Orders Page (requires auth)', () => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
  const mockOrders = {
    success: true,
    data: [{ id: 'ord-1', _id: 'ord-1', status: 'PENDING', total: 150, items: [], createdAt: new Date().toISOString() }],
    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/auth/profile', {
      success: true,
      data: { user: mockUser },
    }).as('getProfile');
    cy.intercept('GET', '**/api/orders*', mockOrders).as('getOrders');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/store/**', { body: { success: true, data: {} } }).as('getStore');

    cy.visit('/en/account/orders', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('al_noon_auth_session', '1');
      },
    });
  });

  it('should load orders page when authenticated', () => {
    cy.wait('@getProfile');
    cy.wait('@getOrders');
    cy.get('app-root').should('exist');
  });

  it('should redirect when not authenticated', () => {
    cy.visit('/en/account/orders', {
      onBeforeLoad(win) {
        win.sessionStorage.removeItem('al_noon_auth_session');
      },
    });
    cy.url().should('not.include', '/account/orders');
  });
});
