import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Order,
  OrderItem,
  CreateOrderBody,
  Pagination,
  OrdersListResponse,
  PaginatedOrdersApiResponse,
  OrderApiResponse,
  Product,
  ProductApiShape,
} from '../types/api.types';
import { normalizeProductFromApi } from '../utils/product-normalizer';

/** Minimal product for display when BE returns only product id (OpenAPI: product = string | populated). */
function minimalProduct(id: string): Product {
  return {
    id: String(id),
    name: { en: 'Product', ar: 'منتج' },
    images: [],
    price: 0,
    stock: 0,
    status: 'ACTIVE',
  };
}

/** Ensure order item product has id and images (API may return _id and media). If product is only a string id, use minimal Product. */
function normalizeOrderItem(
  item: OrderItem & { product?: string | (ProductApiShape & { _id?: string }) }
): OrderItem {
  const raw = item.product;
  if (typeof raw === 'string') {
    return { ...item, product: minimalProduct(raw), quantity: item.quantity, price: item.price };
  }
  if (!raw) {
    return { ...item, product: minimalProduct(''), quantity: item.quantity, price: item.price };
  }
  return { ...item, product: normalizeProductFromApi(raw) };
}

/** Ensure order has id (API may return _id) and items have product.id; preserve guest fields. */
function normalizeOrder(o: Order & { _id?: string }): Order {
  const id = String(o.id ?? o._id ?? '');
  const items = (o.items ?? []).map((i) =>
    normalizeOrderItem(i as OrderItem & { product?: string | (Product & { _id?: string }) })
  );
  return { ...o, id, items };
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  /**
   * POST /api/checkout – complete checkout (create order) from storefront.
   * Same body as createOrder; use this on the checkout page.
   */
  checkout(body: CreateOrderBody): Observable<Order> {
    return this.http.post<OrderApiResponse | ApiSuccess<Order>>('checkout', body).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error((r as { message?: string }).message ?? 'Failed to complete order');
                return;
              }
              const data = r.data as { order?: Order } | Order;
              const raw = data && 'order' in data ? data.order : (data as Order);
              if (raw) sub.next(normalizeOrder(raw));
              else sub.error('Failed to complete order');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  createOrder(body: CreateOrderBody): Observable<Order> {
    return this.http.post<OrderApiResponse | ApiSuccess<Order>>('orders', body).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error((r as { message?: string }).message ?? 'Failed to create order');
                return;
              }
              const data = r.data as { order?: Order } | Order;
              const raw = data && 'order' in data ? data.order : (data as Order);
              if (raw) sub.next(normalizeOrder(raw));
              else sub.error('Failed to create order');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getOrders(params: { page?: number; limit?: number; status?: string; paymentMethod?: string } = {}): Observable<OrdersListResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http
      .get<PaginatedOrdersApiResponse | (ApiSuccess<Order[]> & { pagination?: Pagination })>('orders', {
        params: httpParams,
      })
      .pipe(
        (o) =>
          new Observable<OrdersListResponse>((sub) => {
            o.subscribe({
              next: (r) => {
                if (!r.success) return;
                const raw = r.data as { orders?: Order[]; pagination?: Pagination } | Order[] | undefined;
                const orderList = Array.isArray(raw) ? raw : raw?.orders ?? [];
                const orders = orderList.map((o) => normalizeOrder(o));
                const pagination = Array.isArray(raw)
                  ? (r as ApiSuccess<Order[]>).pagination
                  : (raw && 'pagination' in raw ? raw.pagination : (r as ApiSuccess<Order[]>).pagination);
                sub.next({
                  data: orders,
                  pagination: pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
                });
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  /**
   * GET /api/orders/guest/:id?email=xxx – Public guest order lookup.
   * Use when sessionStorage is cleared (e.g. tab closed) to restore order confirmation.
   */
  getGuestOrder(id: string, email: string): Observable<Order> {
    return this.http.get<OrderApiResponse | ApiSuccess<Order>>(`orders/guest/${id}`, {
      params: { email },
    }).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error('Order not found');
                return;
              }
              const data = r.data as { order?: Order } | Order;
              const raw = data && 'order' in data ? data.order : (data as Order);
              if (raw) sub.next(normalizeOrder(raw));
              else sub.error('Order not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<OrderApiResponse | ApiSuccess<Order>>(`orders/${id}`).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error('Order not found');
                return;
              }
              const data = r.data as { order?: Order } | Order;
              const raw = data && 'order' in data ? data.order : (data as Order);
              if (raw) sub.next(normalizeOrder(raw));
              else sub.error('Order not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
