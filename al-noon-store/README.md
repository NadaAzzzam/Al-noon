# Al-Noon Store (E‑commerce Landing Page)

Angular 21 e‑commerce storefront that talks to the **Al-Noon backend** API. Standalone components, typed API responses, and RTL support for Arabic.

## Configuration

- **API base URL**: Edit `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (prod). See [API-CONFIG.md](./API-CONFIG.md) for setup.
  - Dev default: `http://localhost:4000/api` and origin `http://localhost:4000` (backend `PORT=4000`).
  - Set `apiUrl` and `apiOrigin` (for image paths like `/uploads/products/...`) to your backend.
- **Auth**: All API requests send cookies (`withCredentials: true`) and `x-language` (en/ar). The backend sets an HTTP‑only cookie `al_noon_token` on login/register.
- **Locale**: Stored in `localStorage` as `al_noon_locale`; toggle in the header (EN / ع). Document `dir` and `lang` are set automatically for RTL.

## Features

- **Home**: Hero (from store), New arrivals (products with `newArrival`), home collections, “Our collection” media, testimonials (approved feedbacks).
- **Catalog**: Products with filters (category, price, availability, sort), pagination.
- **Product detail**: Images, sizes, colors, add to cart, related products.
- **Cart**: Client-side (localStorage).
- **Checkout**: City selector (delivery fee), shipping address, COD or InstaPay, then “My orders”.
- **Account**: Login, Register, Sign out, My orders, Order detail.
- **Footer**: Quick links, social links, newsletter (when enabled), content pages (Privacy, Shipping, Return policy, About, Contact).
- **Contact**: Form `POST /store/contact`.
- **AI chatbot**: Floating widget when `GET /ai/settings` has `enabled: true`; greeting, suggested questions, and product cards linking to product pages.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
