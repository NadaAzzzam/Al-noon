import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { PaymentMethodOption, PaymentMethodsApiResponse } from '../types/api.types';

/** API returns { success, data: { paymentMethods: [...] } } */
type PaymentMethodsPayload =
  | PaymentMethodsApiResponse
  | { success?: boolean; data?: { paymentMethods?: PaymentMethodOption[] } };

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService {
  private readonly http = inject(HttpClient);

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<PaymentMethodsPayload>('payment-methods').pipe(
      map((r) => {
        if (!r.success || !r.data) return [];
        const list = r.data.paymentMethods;
        return Array.isArray(list) ? list : [];
      }),
      catchError(() => of([])),
    );
  }
}
