describe('Contact Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should load contact page', () => {
    cy.visit('/en/contact');
    cy.get('app-root').should('exist');
  });

  it('should display contact form', () => {
    cy.visit('/en/contact');
    cy.get('form').should('exist');
  });

  it('should submit contact form', () => {
    cy.intercept('POST', '**/store/contact', { success: true }).as('submitContact');
    cy.visit('/en/contact');
    cy.get('.contact-form input[type="text"]').first().type('Test User');
    cy.get('.contact-form input[type="email"]').first().type('test@example.com');
    cy.get('.contact-form textarea').type('Test message');
    cy.get('.contact-form button[type="submit"]').click();
    cy.wait('@submitContact');
  });
});
