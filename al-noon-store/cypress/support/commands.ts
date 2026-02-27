/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /** Custom command to wait for app to be ready */
      waitForApp(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('waitForApp', () => {
  cy.get('app-root', { timeout: 15000 }).should('exist');
});

export {};
