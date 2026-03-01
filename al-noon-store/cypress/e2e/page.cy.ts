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
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/store/**', (req) => {
      if (req.url.includes('/store/page/')) {
        req.reply(mockPage);
      } else {
        req.reply({ body: { success: true, data: {} } });
      }
    }).as('getStore');
  });

  it('should load page by slug', () => {
    cy.visit('/en/page/privacy');
    cy.get('body', { timeout: 15000 }).should('contain.text', 'Privacy');
  });

  it('should display page content', () => {
    cy.visit('/en/page/privacy');
    cy.get('body', { timeout: 15000 }).should('contain.text', 'policy');
  });

  it('should handle non-existent page', () => {
    cy.intercept('GET', '**/store/page/non-existent*', { statusCode: 404 }).as('getPage404');
    cy.visit('/en/page/non-existent');
    cy.wait('@getPage404');
    cy.get('app-root').should('exist');
  });
});
