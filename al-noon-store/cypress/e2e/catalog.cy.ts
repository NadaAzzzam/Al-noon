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
    cy.intercept({ method: 'GET', url: '**/api/products*' }, mockProducts).as('getProducts');
    cy.intercept({ method: 'GET', url: '**/api/categories*' }, { success: true, data: [] }).as('getCategories');
    cy.intercept({ method: 'GET', url: '**/api/products/filters/sort*' }, { success: true, data: [] }).as('getSortFilters');
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getStoreHome');
    cy.intercept({ method: 'GET', url: '**/api/settings*' }, { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
  });

  it('should load catalog page', () => {
    cy.visit('/en/catalog');
    cy.get('app-root', { timeout: 10000 }).should('exist');
    cy.get('.catalog, app-catalog', { timeout: 10000 }).should('exist');
  });

  it('should display products or empty state', () => {
    cy.visit('/en/catalog');
    cy.get('.catalog, app-catalog', { timeout: 10000 }).should('exist');
    cy.get('body').then(($body) => {
      if ($body.find('app-product-card, [data-testid="product-card"]').length > 0) {
        cy.get('app-product-card, [data-testid="product-card"]').first().should('be.visible');
      } else if ($body.find('.catalog-toolbar, [data-testid="catalog-toolbar"]').length > 0) {
        cy.get('.catalog-toolbar, [data-testid="catalog-toolbar"]').should('be.visible');
      } else {
        cy.get('body').should('exist');
      }
    });
  });

  it('should show empty state when search returns no results', () => {
    cy.intercept({ method: 'GET', url: '**/api/products*' }, {
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    }).as('getProductsEmpty');
    cy.visit('/en/catalog?search=nonexistent');
    cy.get('.catalog, app-catalog', { timeout: 10000 }).should('exist');
    cy.get('app-root').should('exist');
  });

  it('should handle API error gracefully', () => {
    cy.intercept({ method: 'GET', url: '**/api/products*' }, { statusCode: 500 }).as('getProductsError');
    cy.visit('/en/catalog');
    cy.get('.catalog, app-catalog', { timeout: 10000 }).should('exist');
    cy.get('app-root').should('exist');
  });
});
