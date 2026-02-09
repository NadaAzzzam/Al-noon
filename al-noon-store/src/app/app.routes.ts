import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
      { path: 'catalog', loadComponent: () => import('./pages/catalog/catalog.component').then((m) => m.CatalogComponent) },
      { path: 'product/:id', loadComponent: () => import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent) },
      { path: 'cart', loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent) },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'order-confirmation',
        loadComponent: () =>
          import('./pages/order-confirmation/order-confirmation.component').then((m) => m.OrderConfirmationComponent),
      },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent) },
      { path: 'page/:slug', loadComponent: () => import('./pages/page/page.component').then((m) => m.PageComponent) },
      {
        path: 'account',
        children: [
          { path: 'login', loadComponent: () => import('./pages/account/login/login.component').then((m) => m.LoginComponent) },
          { path: 'register', loadComponent: () => import('./pages/account/register/register.component').then((m) => m.RegisterComponent) },
          {
            path: 'orders',
            loadComponent: () => import('./pages/account/orders/orders.component').then((m) => m.OrdersComponent),
            canActivate: [authGuard],
          },
          {
            path: 'orders/:id',
            loadComponent: () => import('./pages/account/order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
            canActivate: [authGuard],
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
