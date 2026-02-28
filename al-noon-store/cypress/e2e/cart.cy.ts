describe('Cart', () => {
  const cartItems = [
    { productId: '1', quantity: 1, price: 99.99, name: 'Test Product' },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should display empty cart when no items', () => {
    cy.visit('/cart', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('al_noon_cart');
      },
    });
    cy.get('app-root').should('exist');
    cy.get('.empty-state').should('exist');
  });

  it('should allow adding special instructions when cart has items', () => {
    cy.visit('/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('details summary').first().click();
    cy.get('.cart-instructions textarea').should('exist').type('Gift wrap please');
  });
});
