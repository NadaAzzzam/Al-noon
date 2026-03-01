/**
 * AI Chatbot E2E tests - including security (XSS prevention, error handling).
 * Ensures no disaster bugs that could allow hackers to exploit users via the chatbot.
 */

describe('AI Chatbot', () => {
  const aiChatUrl = '**/api/ai/chat';

  beforeEach(() => {
    cy.intercept('GET', '**/i18n/*.json', { body: {} }).as('i18n');
    // Catch-all for API: app bootstrap (settings, auth) + store/home + ai/settings
    cy.intercept('GET', '**/api/**', (req) => {
      const url = req.url;
      if (url.includes('ai/settings') || url.includes('ai%2Fsettings')) {
        req.reply({ fixture: 'ai-settings.json' });
        return;
      }
      if (url.includes('store/home')) {
        req.reply({ fixture: 'home.json' });
        return;
      }
      if (url.includes('auth/profile')) {
        req.reply({ statusCode: 401, body: {} });
        return;
      }
      if (url.includes('/settings') && !url.includes('ai/')) {
        req.reply({ statusCode: 200, body: { success: true, data: { settings: {} } } });
        return;
      }
      req.reply({ statusCode: 200, body: { success: true, data: {} } });
    }).as('getApi');
  });

  it('should show chatbot widget when AI is enabled', () => {
    cy.visit('/en');
    cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
    cy.get('.chatbot-toggle').should('be.visible');
  });

  it('should open chat panel on toggle click', () => {
    cy.visit('/en');
    cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
    cy.get('.chatbot-toggle').click();
    cy.get('.chatbot-panel').should('be.visible');
    cy.get('.chatbot-messages').should('exist');
  });

  it('should send message and display AI response', () => {
    cy.intercept('POST', aiChatUrl, {
      statusCode: 200,
      body: {
        success: true,
        data: {
          sessionId: 'test-session-1',
          response: 'Here are some products you might like!',
          productCards: [],
        },
      },
    }).as('postChat');

    cy.visit('/en');
    cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
    cy.get('.chatbot-toggle').click();
    cy.get('.chatbot-input input').type('Show me products');
    cy.get('.chatbot-input button[type="submit"]').click();

    cy.wait('@postChat');
    cy.get('.message.assistant .message-text')
      .last()
      .should('contain.text', 'Here are some products you might like!');
  });

  describe('security - XSS prevention', () => {
    it('should NOT execute script when AI returns malicious HTML', () => {
      // Simulate compromised AI or prompt injection returning XSS payload
      const xssPayload =
        '<script>window.__XSS_EXECUTED__=true</script><img onerror="window.__XSS_EXECUTED__=true" src=x>';

      cy.intercept('POST', aiChatUrl, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            sessionId: 'xss-test',
            response: xssPayload,
            productCards: [],
          },
        },
      }).as('postChatXss');

      cy.visit('/en');
      cy.window().then((win) => {
        (win as unknown as { __XSS_EXECUTED__?: boolean }).__XSS_EXECUTED__ = false;
      });
      cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
      cy.get('.chatbot-toggle').click();
      cy.get('.chatbot-input input').type('test');
      cy.get('.chatbot-input button[type="submit"]').click();

      cy.wait('@postChatXss');

      // Script must NOT have executed - Angular sanitizer strips dangerous content
      cy.window().then((win) => {
        const w = win as unknown as { __XSS_EXECUTED__?: boolean };
        expect(w.__XSS_EXECUTED__).not.to.equal(true);
      });

      // Sanitized: no script tags, no event handlers
      cy.get('.message.assistant .message-text').last().find('script').should('not.exist');
      cy.get('.message.assistant .message-text').last().find('img[onerror]').should('not.exist');
    });
  });

  describe('error handling', () => {
    it('should show friendly message on 429 (rate limit)', () => {
      cy.intercept('POST', aiChatUrl, { statusCode: 429 }).as('postChat429');

      cy.visit('/en');
      cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
      cy.get('.chatbot-toggle').click();
      cy.get('.chatbot-input input').type('test');
      cy.get('.chatbot-input button[type="submit"]').click();

      cy.wait('@postChat429');
      cy.get('.chatbot-error').should(
        'contain.text',
        'Too many requests. Please try again later.'
      );
    });

    it('should show friendly message on 502 (service unavailable)', () => {
      cy.intercept('POST', aiChatUrl, { statusCode: 502 }).as('postChat502');

      cy.visit('/en');
      cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
      cy.get('.chatbot-toggle').click();
      cy.get('.chatbot-input input').type('test');
      cy.get('.chatbot-input button[type="submit"]').click();

      cy.wait('@postChat502');
      cy.get('.chatbot-error').should('contain.text', 'AI is temporarily unavailable');
    });

    it('should show friendly message on 400 (chat disabled)', () => {
      cy.intercept('POST', aiChatUrl, { statusCode: 400 }).as('postChat400');

      cy.visit('/en');
      cy.get('.chatbot-widget', { timeout: 15000 }).should('exist');
      cy.get('.chatbot-toggle').click();
      cy.get('.chatbot-input input').type('test');
      cy.get('.chatbot-input button[type="submit"]').click();

      cy.wait('@postChat400');
      cy.get('.chatbot-error').should('contain.text', 'AI chat is disabled');
    });
  });
});
