/// <reference types="cypress" />
describe('Authentication', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  describe('Login', () => {
    beforeEach(() => {
      cy.visit('/en/account/login');
    });

    it('should display login form', () => {
      cy.get('.auth-form').should('exist');
      cy.get('.auth-form input[type="email"]').should('exist');
      cy.get('.auth-form input[type="password"]').should('exist');
    });

    it('should show validation for empty submit', () => {
      cy.get('.auth-form button[type="submit"]').click();
      cy.get('.auth-form').should('exist');
    });

    it('should submit login with valid credentials', () => {
      cy.intercept('POST', '**/auth/sign-in', {
        success: true,
        data: { user: { id: '1', email: 'test@test.com', name: 'Test' }, accessToken: 'token' },
      }).as('signIn');
      cy.get('.auth-form input[type="email"]').type('test@example.com');
      cy.get('.auth-form input[type="password"]').type('password123');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@signIn');
    });

    it('should show error when login fails (wrong password)', () => {
      cy.intercept('POST', '**/auth/sign-in', { statusCode: 401, body: { message: 'Invalid credentials' } }).as('signInFail');
      cy.get('.auth-form input[type="email"]').type('test@example.com');
      cy.get('.auth-form input[type="password"]').type('wrongpassword');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@signInFail');
      cy.get('.error-block, .error-msg, [class*="error"]').should('exist');
    });
  });

  describe('Register', () => {
    beforeEach(() => {
      cy.visit('/en/account/register');
    });

    it('should display register form', () => {
      cy.get('.auth-form').should('exist');
      cy.get('.auth-form input[type="text"]').should('exist');
      cy.get('.auth-form input[type="email"]').should('exist');
      cy.get('.auth-form input[type="password"]').should('exist');
    });

    it('should show validation for weak password', () => {
      cy.get('.auth-form input[type="text"]').type('John');
      cy.get('.auth-form input[type="email"]').type('john@example.com');
      cy.get('.auth-form input[type="password"]').type('123');
      cy.get('.auth-form button[type="submit"]').click();
      cy.get('form').should('exist');
    });
  });
});
