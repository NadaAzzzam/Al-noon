import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ApiSuccess,
  Order,
  CreateOrderBody,
  Pagination,
} from '../types/api.types';

export interface OrdersListResponse {
  data: Order[];
  pagination: Pagination;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  createOrder(body: CreateOrderBody): Observable<Order> {
    return this.http.post<ApiSuccess<Order>>('orders', body).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.error((r as { message?: string }).message ?? 'Failed to create order');
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
      .get<ApiSuccess<Order[]> & { pagination?: Pagination }>('orders', {
        params: httpParams,
      })
      .pipe(
        (o) =>
          new Observable<OrdersListResponse>((sub) => {
            o.subscribe({
              next: (r) => {
                if (r.success && r.data)
                  sub.next({
                    data: r.data,
                    pagination: r.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
                  });
              },
              error: (e) => sub.error(e),
              complete: () => sub.complete(),
            });
          })
      );
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<ApiSuccess<Order>>(`orders/${id}`).pipe(
      (o) =>
        new Observable<Order>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.error('Order not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
