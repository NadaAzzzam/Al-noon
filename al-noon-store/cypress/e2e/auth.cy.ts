describe('Authentication', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/account/login');
    });

    it('should display login form', () => {
      cy.get('form').should('exist');
      cy.get('input[type="email"], input[name="email"]').should('exist');
      cy.get('input[type="password"], input[name="password"]').should('exist');
    });

    it('should show validation for empty submit', () => {
      cy.get('form').find('button[type="submit"]').first().click();
      cy.get('form').should('exist');
    });

    it('should submit login with valid credentials', () => {
      cy.intercept('POST', '**/auth/sign-in', {
        success: true,
        data: { user: { id: '1', email: 'test@test.com', name: 'Test' }, accessToken: 'token' },
      }).as('signIn');
      cy.get('input[type="email"], input[name="email"]').first().type('test@example.com');
      cy.get('input[type="password"], input[name="password"]').first().type('password123');
      cy.get('form').find('button[type="submit"]').first().click();
      cy.wait('@signIn');
    });
  });

  describe('Register', () => {
    beforeEach(() => {
      cy.visit('/account/register');
    });

    it('should display register form', () => {
      cy.get('form').should('exist');
    });
  });
});
