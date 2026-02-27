describe('Contact Page', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should load contact page', () => {
    cy.visit('/contact');
    cy.get('app-root').should('exist');
  });

  it('should display contact form', () => {
    cy.visit('/contact');
    cy.get('form').should('exist');
  });

  it('should submit contact form', () => {
    cy.intercept('POST', '**/store/contact', { success: true }).as('submitContact');
    cy.visit('/contact');
    cy.get('input[name="name"], input[placeholder*="name" i]').first().type('Test User');
    cy.get('input[name="email"], input[type="email"]').first().type('test@example.com');
    cy.get('textarea, input[name="message"]').first().type('Test message');
    cy.get('form').find('button[type="submit"]').click();
    cy.wait('@submitContact');
  });
});
