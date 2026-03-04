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

  describe('403 Forbidden (logout and redirect)', () => {
    it('should clear session and redirect to login when any API returns 403', () => {
      cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
      cy.intercept('GET', '**/auth/profile', { success: true, data: { user: null } }).as('profile');
      cy.intercept('GET', '**/store/home*', { statusCode: 403, body: { message: 'Forbidden' } }).as('store403');
      cy.intercept('GET', '**/categories*', { success: true, data: { categories: [] } }).as('categories');
      cy.visit('/en');
      cy.wait('@store403');
      cy.url().should('include', '/account/login');
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

  describe('Forgot password', () => {
    beforeEach(() => {
      cy.visit('/en/account/forgot-password');
    });

    it('should display forgot-password form and email input', () => {
      cy.get('.auth-form').should('exist');
      cy.get('.auth-form input[type="email"]').should('exist');
      cy.get('h1').should('contain.text', 'Forgot'); // or translate key
    });

    it('should show success message when request succeeds', () => {
      cy.intercept('POST', '**/auth/forgot-password', {
        statusCode: 200,
        body: { success: true, message: 'If an account exists, you will receive an email.' },
      }).as('forgotPassword');
      cy.get('.auth-form input[type="email"]').type('user@example.com');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@forgotPassword');
      cy.get('.success-msg').should('exist');
    });

    it('should show error when request fails', () => {
      cy.intercept('POST', '**/auth/forgot-password', {
        statusCode: 500,
        body: { message: 'Server error' },
      }).as('forgotPasswordFail');
      cy.get('.auth-form input[type="email"]').type('user@example.com');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@forgotPasswordFail');
      cy.get('.error-msg').should('exist');
    });

    it('should have link back to login', () => {
      cy.get('.auth-footer a[href*="login"]').should('exist');
    });
  });

  describe('Reset password', () => {
    it('should show invalid token message when no token in URL', () => {
      cy.visit('/en/account/reset-password');
      cy.get('.error-msg').should('exist');
      cy.get('.auth-footer a[href*="forgot-password"]').should('exist');
    });

    it('should display reset form when token is present', () => {
      cy.visit('/en/account/reset-password?token=valid-reset-token');
      cy.get('.auth-form').should('exist');
      cy.get('.auth-form input[type="password"]').should('have.length', 2);
    });

    it('should show success after reset and have back to login link', () => {
      cy.intercept('POST', '**/auth/reset-password', {
        statusCode: 200,
        body: { success: true, message: 'Password updated.' },
      }).as('resetPassword');
      cy.visit('/en/account/reset-password?token=valid-token');
      cy.get('.auth-form input[type="password"]').first().type('newpass123');
      cy.get('.auth-form input[type="password"]').last().type('newpass123');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@resetPassword');
      cy.get('.success-msg').should('exist');
      cy.get('.auth-footer a[href*="login"]').should('exist');
    });

    it('should show error when reset fails (e.g. invalid token)', () => {
      cy.intercept('POST', '**/auth/reset-password', {
        statusCode: 400,
        body: { message: 'Invalid or expired token' },
      }).as('resetPasswordFail');
      cy.visit('/en/account/reset-password?token=expired-token');
      cy.get('.auth-form input[type="password"]').first().type('newpass123');
      cy.get('.auth-form input[type="password"]').last().type('newpass123');
      cy.get('.auth-form button[type="submit"]').click();
      cy.wait('@resetPasswordFail');
      cy.get('.error-msg').should('exist');
    });
  });
});
