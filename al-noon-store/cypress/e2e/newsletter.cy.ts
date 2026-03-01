/// <reference types="cypress" />
/**
 * Newsletter subscription business scenario.
 */
describe('Newsletter Subscription', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/store/home*', { fixture: 'home.json' }).as('getHome');
    cy.intercept('GET', '**/api/settings*', { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should display newsletter form in footer on home page', () => {
    cy.visit('/en');
    cy.wait('@getHome');
    cy.get('footer').should('exist');
    cy.get('.newsletter-section, .newsletter-form').should('exist');
  });

  it('should subscribe successfully with valid email', () => {
    cy.intercept('POST', '**/newsletter/subscribe', {
      statusCode: 200,
      body: { success: true, message: 'Subscribed successfully' },
    }).as('subscribe');

    cy.visit('/en');
    cy.wait('@getHome');
    cy.get('.newsletter-form input[type="email"]').type('newuser@example.com');
    cy.get('.newsletter-submit, .newsletter-form button[type="submit"]').click();
    cy.wait('@subscribe');
    cy.get('.newsletter-msg.success, .success').should('exist');
  });

  it('should show validation error for invalid email format', () => {
    cy.visit('/en');
    cy.wait('@getHome');
    cy.get('.newsletter-form input[type="email"]').type('invalid');
    cy.get('.newsletter-submit, .newsletter-form button[type="submit"]').click();
    cy.get('.newsletter-form').should('exist');
    cy.get('.field-error, .newsletter-msg.field-error').should('exist');
  });
});
