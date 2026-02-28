/// <reference types="cypress" />
describe('Dynamic Page (Content Pages)', () => {
  const mockPage = {
    success: true,
    data: {
      slug: 'privacy',
      title: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
      content: { en: '<p>Privacy policy content here.</p>', ar: '<p>محتوى</p>' },
    },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/store/page/*', mockPage).as('getPage');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/store/**', { body: { success: true, data: {} } }).as('getStore');
  });

  it('should load page by slug', () => {
    cy.visit('/page/privacy');
    cy.wait('@getPage', { timeout: 10000 });
    cy.get('body').should('contain.text', 'Privacy');
  });

  it('should display page content', () => {
    cy.visit('/page/privacy');
    cy.wait('@getPage');
    cy.get('body').should('contain.text', 'policy');
  });

  it('should handle non-existent page', () => {
    cy.intercept('GET', '**/store/page/non-existent*', { statusCode: 404 }).as('getPage404');
    cy.visit('/page/non-existent');
    cy.wait('@getPage404');
    cy.get('app-root').should('exist');
  });
});
