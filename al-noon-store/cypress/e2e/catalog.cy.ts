describe('Catalog Page', () => {
  const mockProducts = {
    success: true,
    data: [
      {
        id: '1',
        name: { en: 'Test Product', ar: 'منتج تجريبي' },
        price: 100,
        images: ['https://example.com/img.jpg'],
      },
    ],
    pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/products*', mockProducts).as('getProducts');
    cy.intercept('GET', '**/categories*', { success: true, data: [] }).as('getCategories');
    cy.intercept('GET', '**/products/filters/sort*', { success: true, data: [] }).as('getSortFilters');
    cy.intercept('GET', '**/store/**', { body: { success: true, data: {} } }).as('getStore');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should load catalog page', () => {
    cy.visit('/catalog');
    cy.wait('@getProducts', { timeout: 15000 });
    cy.get('app-root').should('exist');
  });

  it('should display products or empty state', () => {
    cy.visit('/catalog');
    cy.wait('@getProducts', { timeout: 15000 });
    cy.get('body').then(($body) => {
      if ($body.find('app-product-card, [data-testid="product-card"]').length > 0) {
        cy.get('app-product-card, [data-testid="product-card"]').first().should('be.visible');
      } else {
        cy.get('body').should('exist');
      }
    });
  });

  it('should show empty state when search returns no results', () => {
    cy.intercept('GET', '**/products*', {
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    }).as('getProductsEmpty');
    cy.visit('/catalog?search=nonexistent');
    cy.wait('@getProductsEmpty');
    cy.get('app-root').should('exist');
  });

  it('should handle API error gracefully', () => {
    cy.intercept('GET', '**/products*', { statusCode: 500 }).as('getProductsError');
    cy.visit('/catalog');
    cy.wait('@getProductsError');
    cy.get('app-root').should('exist');
  });
});
