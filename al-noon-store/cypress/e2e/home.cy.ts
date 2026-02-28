describe('Home Page', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getHome');
    cy.intercept('GET', '**/i18n/**', { body: {} }).as('getI18n');
    cy.visit('/en');
    cy.wait('@getHome', { timeout: 10000 });
  });

  it('should load home page', () => {
    cy.get('app-root').should('exist');
  });

  it('should display store title', () => {
    cy.get('h1, [data-testid="store-title"], .hero-title, header').first().should('be.visible');
  });

  it('should have navigation links', () => {
    cy.get('a[href*="/catalog"], a[routerlink*="catalog"]').should('exist');
  });
});
