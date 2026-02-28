/// <reference types="cypress" />
describe('Order Confirmation Page', () => {
  const mockOrder = {
    id: 'ord-123',
    status: 'PENDING',
    items: [{ productId: '1', quantity: 1, price: 100, product: { id: '1', name: { en: 'Test' } } }],
    total: 135,
    deliveryFee: 35,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '01000000000',
    shippingAddress: { address: '123 Street', city: 'Cairo', country: 'Egypt' },
    shippingMethod: 'standard',
    paymentMethod: 'COD',
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should show confirmation when order in sessionStorage', () => {
    cy.visit('/en/order-confirmation', {
      onBeforeLoad(win) {
        win.sessionStorage.setItem('al_noon_last_order', JSON.stringify(mockOrder));
      },
    });
    cy.get('.confirmation-wrapper, .confirmation-number, .order-details-card').should('exist');
  });

  it('should show confirmation when order passed via state', () => {
    cy.visit('/en/order-confirmation', {
      state: { order: mockOrder },
    });
    cy.get('.confirmation-wrapper').should('exist');
  });

  it('should show not found when no order data', () => {
    cy.visit('/en/order-confirmation', {
      onBeforeLoad(win) {
        win.sessionStorage.removeItem('al_noon_last_order');
      },
    });
    cy.get('.confirmation-empty').should('exist');
  });
});
