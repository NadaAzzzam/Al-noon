describe('Home Page', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getHome');
    cy.intercept('GET', '**/i18n/**', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/api/settings*', { success: true, data: { settings: {} } }).as('getSettings');
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

  it('should have footer with quick links', () => {
    cy.get('footer, .footer, app-footer').should('exist');
  });

  it('should navigate to catalog when catalog link clicked', () => {
    cy.get('a.section-link').first().scrollIntoView().click();
    cy.url().should('include', '/catalog');
  });
});
