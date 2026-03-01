/// <reference types="cypress" />
describe('Layout', () => {
  beforeEach(() => {
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getHome');
    cy.intercept('GET', '**/i18n/**', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/api/settings*', { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/api/categories*', { success: true, data: [] }).as('getCategories');
  });

  it('should show back-to-top button when scrolled down', () => {
    cy.visit('/en');
    cy.wait('@getHome', { timeout: 10000 });
    cy.get('body').scrollTo('bottom');
    cy.get('.back-to-top, button[aria-label="Back to top"]', { timeout: 3000 }).should('be.visible');
  });

  it('should scroll to top when back-to-top clicked', () => {
    cy.visit('/en/catalog');
    cy.intercept('GET', '**/api/products*', {
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    });
    cy.get('body').scrollTo('bottom');
    cy.get('.back-to-top, button[aria-label="Back to top"]', { timeout: 3000 }).click();
    cy.window().its('scrollY').should('be.lt', 100);
  });

  it('should have header with logo and navigation', () => {
    cy.visit('/en');
    cy.get('header, .header, app-header').should('exist');
    cy.get('a[href*="/"], a[routerlink*="/"]').should('exist');
  });
});
