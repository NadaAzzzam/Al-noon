describe('Navigation', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should navigate to home', () => {
    cy.visit('/');
    cy.url().should('include', '/');
  });

  it('should navigate to catalog', () => {
    cy.visit('/');
    cy.get('a[href="/catalog"], a[routerlink="/catalog"]').first().click();
    cy.url().should('include', '/catalog');
  });

  it('should navigate to cart', () => {
    cy.visit('/cart');
    cy.url().should('include', '/cart');
  });

  it('should navigate to contact', () => {
    cy.visit('/contact');
    cy.url().should('include', '/contact');
  });

  it('should navigate to login', () => {
    cy.visit('/account/login');
    cy.url().should('include', '/account/login');
  });

  it('should navigate to register', () => {
    cy.visit('/account/register');
    cy.url().should('include', '/account/register');
  });
});
