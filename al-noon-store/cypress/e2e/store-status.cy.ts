describe('Store Status Pages', () => {
  const homeIntercept = () =>
    cy.intercept({ method: 'GET', url: '**/api/store/home*' }, {
      body: { success: true, data: { home: { storeName: { en: 'Test' }, hero: {}, newArrivals: [] } } },
    }).as('getHome');

  const i18nIntercept = () =>
    cy.intercept('GET', '**/i18n/**', { body: {} }).as('getI18n');

  describe('Coming Soon mode enabled', () => {
    beforeEach(() => {
      homeIntercept();
      i18nIntercept();
      cy.intercept('GET', '**/api/settings*', {
        body: {
          success: true,
          data: {
            settings: {
              storeName: { en: 'Al-Noon', ar: 'النون' },
              logo: '',
              comingSoonMode: true,
              comingSoonMessage: { en: 'We are launching soon!', ar: 'سنفتح قريبًا!' },
              underConstructionMode: false,
            },
          },
        },
      }).as('getSettings');
    });

    it('should redirect home page to coming-soon', () => {
      cy.visit('/en');
      cy.url().should('include', '/coming-soon');
    });

    it('should render the coming-soon page', () => {
      cy.visit('/en/coming-soon');
      cy.get('.coming-soon-page').should('exist');
      cy.get('.cs-title').should('be.visible');
    });

    it('should display the custom message', () => {
      cy.visit('/en/coming-soon');
      cy.get('.cs-message').should('contain.text', 'We are launching soon!');
    });

    it('should redirect catalog to coming-soon', () => {
      cy.visit('/en/catalog');
      cy.url().should('include', '/coming-soon');
    });

    it('should redirect cart to coming-soon', () => {
      cy.visit('/en/cart');
      cy.url().should('include', '/coming-soon');
    });

    it('should redirect checkout to coming-soon', () => {
      cy.visit('/en/checkout');
      cy.url().should('include', '/coming-soon');
    });
  });

  describe('Under Construction mode enabled', () => {
    beforeEach(() => {
      homeIntercept();
      i18nIntercept();
      cy.intercept('GET', '**/api/settings*', {
        body: {
          success: true,
          data: {
            settings: {
              storeName: { en: 'Al-Noon', ar: 'النون' },
              logo: '',
              comingSoonMode: false,
              underConstructionMode: true,
              underConstructionMessage: { en: 'We are improving!', ar: 'نعمل على التحسينات!' },
            },
          },
        },
      }).as('getSettings');
    });

    it('should redirect home page to under-construction', () => {
      cy.visit('/en');
      cy.url().should('include', '/under-construction');
    });

    it('should render the under-construction page', () => {
      cy.visit('/en/under-construction');
      cy.get('.uc-page').should('exist');
      cy.get('.uc-title').should('be.visible');
    });

    it('should display the custom message', () => {
      cy.visit('/en/under-construction');
      cy.get('.uc-message').should('contain.text', 'We are improving!');
    });

    it('should show progress bar', () => {
      cy.visit('/en/under-construction');
      cy.get('.uc-progress-bar').should('exist');
    });

    it('should redirect catalog to under-construction', () => {
      cy.visit('/en/catalog');
      cy.url().should('include', '/under-construction');
    });
  });

  describe('Both modes enabled (coming-soon takes priority)', () => {
    beforeEach(() => {
      homeIntercept();
      i18nIntercept();
      cy.intercept('GET', '**/api/settings*', {
        body: {
          success: true,
          data: {
            settings: {
              comingSoonMode: true,
              underConstructionMode: true,
              comingSoonMessage: { en: 'Coming soon!', ar: 'قريبًا!' },
              underConstructionMessage: { en: 'Under construction', ar: 'تحت الإنشاء' },
            },
          },
        },
      }).as('getSettings');
    });

    it('should redirect home to coming-soon (priority)', () => {
      cy.visit('/en');
      cy.url().should('include', '/coming-soon');
    });

    it('should redirect under-construction page to coming-soon', () => {
      cy.visit('/en/under-construction');
      cy.url().should('include', '/coming-soon');
    });
  });

  describe('Neither mode enabled', () => {
    beforeEach(() => {
      homeIntercept();
      i18nIntercept();
      cy.intercept('GET', '**/api/settings*', {
        body: {
          success: true,
          data: {
            settings: {
              comingSoonMode: false,
              underConstructionMode: false,
            },
          },
        },
      }).as('getSettings');
    });

    it('should allow normal navigation to home', () => {
      cy.visit('/en');
      cy.url().should('match', /\/en\/?$/);
      cy.get('app-root').should('exist');
    });

    it('should redirect coming-soon page to home', () => {
      cy.visit('/en/coming-soon');
      cy.url().should('not.include', '/coming-soon');
    });

    it('should redirect under-construction page to home', () => {
      cy.visit('/en/under-construction');
      cy.url().should('not.include', '/under-construction');
    });
  });
});
