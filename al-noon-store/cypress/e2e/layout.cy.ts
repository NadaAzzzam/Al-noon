/// <reference types="cypress" />
describe('Layout', () => {
  const mockProducts = {
    success: true,
    data: Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `p${i}`,
        name: { en: `Product ${i}`, ar: `منتج ${i}` },
        price: 99,
        images: [],
        stock: 5,
        status: 'PUBLISHED',
      })),
    pagination: { total: 20, page: 1, limit: 12, totalPages: 2 },
  };

  beforeEach(() => {
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, { fixture: 'home.json' }).as('getHome');
    cy.intercept('GET', '**/i18n/**', { body: {} }).as('getI18n');
    cy.intercept('GET', '**/api/settings*', { success: true, data: { settings: {} } }).as('getSettings');
    cy.intercept('GET', '**/api/categories*', { success: true, data: [] }).as('getCategories');
    cy.intercept('GET', '**/api/products*', mockProducts).as('getProducts');
  });

  it('should show back-to-top button when scrolled down', () => {
    cy.visit('/en/catalog');
    cy.wait('@getProducts');
    cy.window().then((win) => win.scrollTo(0, 9999));
    cy.wait(200);
    cy.get('.back-to-top, button[aria-label="Back to top"]', { timeout: 3000 }).should('be.visible');
  });

  it('should scroll to top when back-to-top clicked', () => {
    cy.visit('/en/catalog');
    cy.wait('@getProducts');
    cy.window().then((win) => win.scrollTo(0, 9999));
    cy.wait(200);
    cy.get('.back-to-top, button[aria-label="Back to top"]', { timeout: 3000 }).click();
    cy.window().its('scrollY').should('be.lt', 100);
  });

  it('should have header with logo and navigation', () => {
    cy.visit('/en');
    cy.get('header, .header, app-header').should('exist');
    cy.get('a[href*="/"], a[routerlink*="/"]').should('exist');
  });

  it('should set favicon from backend store logo when home returns logo', () => {
    cy.intercept('GET', '**/api/store/home*', {
      body: {
        success: true,
        data: {
          home: {
            storeName: { en: 'Al-Noon', ar: 'الظهر' },
            logo: 'uploads/logos/store.png',
            hero: {},
            newArrivals: [],
            homeCollections: [],
            feedbacks: [],
            quickLinks: [],
            socialLinks: [],
          },
        },
      },
    }).as('getHomeWithLogo');
    cy.visit('/en');
    cy.wait('@getHomeWithLogo');
    cy.document().then((doc) => {
      const link = doc.querySelector('link[rel="icon"]');
      expect(link).to.exist;
      expect(link?.getAttribute('href')).to.be.a('string').and.not.be.empty;
      expect(link?.getAttribute('href')).to.include('logo');
    });
  });
});
