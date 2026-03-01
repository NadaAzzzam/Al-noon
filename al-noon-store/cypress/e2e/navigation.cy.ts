describe('Navigation', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should redirect root to locale and navigate to home', () => {
    cy.visit('/');
    cy.url().should('match', /\/(en|ar)(\/|$)/);
  });

  it('should navigate to catalog', () => {
    cy.visit('/en');
    cy.get('a[href*="/catalog"], a[routerlink*="catalog"]').first().scrollIntoView().click({ force: true });
    cy.url().should('include', '/catalog');
  });

  it('should navigate to cart', () => {
    cy.visit('/en/cart');
    cy.url().should('include', '/cart');
  });

  it('should navigate to contact', () => {
    cy.visit('/en/contact');
    cy.url().should('include', '/contact');
  });

  it('should navigate to login', () => {
    cy.visit('/en/account/login');
    cy.url().should('include', '/account/login');
  });

  it('should navigate to register', () => {
    cy.visit('/en/account/register');
    cy.url().should('include', '/account/register');
  });
});
