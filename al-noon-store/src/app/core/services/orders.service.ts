import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Order,
  CreateOrderBody,
  Pagination,
  OrdersListResponse,
  PaginatedOrdersApiResponse,
  OrderApiResponse,
} from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

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
              const order = data && 'order' in data ? data.order : (data as Order);
              if (order) sub.next(order);
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
                const orders = Array.isArray(raw) ? raw : raw?.orders ?? [];
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
              const order = data && 'order' in data ? data.order : (data as Order);
              if (order) sub.next(order);
              else sub.error('Order not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
