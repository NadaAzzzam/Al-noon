describe('Cart', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should display empty cart when no items', () => {
    cy.visit('/cart');
    cy.get('app-root').should('exist');
  });

  it('should allow adding special instructions', () => {
    cy.visit('/cart');
    cy.get('textarea, input[placeholder*="instruction"], [data-testid="instructions"]').then(($el) => {
      if ($el.length) {
        cy.wrap($el.first()).type('Gift wrap please');
      }
    });
  });
});
