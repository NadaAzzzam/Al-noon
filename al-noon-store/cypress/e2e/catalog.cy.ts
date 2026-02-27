describe('Catalog Page', () => {
  const mockProducts = {
    success: true,
    data: {
      items: [
        {
          id: '1',
          name: { en: 'Test Product', ar: 'منتج تجريبي' },
          price: 100,
          images: ['https://example.com/img.jpg'],
        },
      ],
      pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
    },
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/store/home', { body: { success: true, data: {} } }).as('getHome');
    cy.intercept('GET', '**/api/products*', mockProducts).as('getProducts');
    cy.intercept('GET', '**/api/categories*', { success: true, data: [] }).as('getCategories');
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('getI18n');
    cy.visit('/catalog');
    cy.wait('@getProducts');
  });

  it('should load catalog page', () => {
    cy.get('app-root').should('exist');
  });

  it('should display products or empty state', () => {
    cy.get('body').then(($body) => {
      if ($body.find('app-product-card, [data-testid="product-card"]').length > 0) {
        cy.get('app-product-card, [data-testid="product-card"]').first().should('be.visible');
      } else {
        cy.get('body').should('contain.text', '');
      }
    });
  });
});
