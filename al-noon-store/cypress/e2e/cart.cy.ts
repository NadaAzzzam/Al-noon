describe('Cart', () => {
  const cartItems = [
    { productId: '1', quantity: 1, price: 99.99, name: 'Test Product' },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/**', { body: { success: true, data: {} } }).as('api');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
  });

  it('should display empty cart when no items', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('al_noon_cart');
      },
    });
    cy.get('app-root').should('exist');
    cy.get('.empty-state').should('exist');
  });

  it('should display cart items when cart has items', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('app-root').should('exist');
    cy.get('body').should('contain.text', 'Test Product');
  });

  it('should allow adding special instructions when cart has items', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('details summary').first().scrollIntoView().click({ force: true });
    cy.get('.cart-instructions textarea').should('exist').first().type('Gift wrap please', { force: true });
  });

  it('should persist cart after page refresh', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('body').should('contain.text', 'Test Product');
    cy.reload();
    cy.get('body').should('contain.text', 'Test Product');
  });

  it('should keep cart items after logout when using guest cart (localStorage)', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('body').should('contain.text', 'Test Product');
    cy.visit('/en/account/login');
    cy.visit('/en/cart');
    cy.get('body').should('contain.text', 'Test Product');
  });

  it('should persist cart across navigation (cart → home → cart)', () => {
    cy.visit('/en/cart', {
      onBeforeLoad(win) {
        win.localStorage.setItem('al_noon_cart', JSON.stringify(cartItems));
      },
    });
    cy.get('body').should('contain.text', 'Test Product');
    cy.get('a[href*="/en"], a[href="/en"]').first().click();
    cy.url().should('match', /\/(en|ar)(\/|$)/);
    cy.visit('/en/cart');
    cy.get('body').should('contain.text', 'Test Product');
  });
});
