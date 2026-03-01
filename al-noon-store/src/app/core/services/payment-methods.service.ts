import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { PaymentMethodOption, SchemaGetPaymentMethodsResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService {
  private readonly http = inject(HttpClient);

  getPaymentMethods(): Observable<PaymentMethodOption[]> {
    return this.http.get<SchemaGetPaymentMethodsResponse>('payment-methods').pipe(
      map((r) => {
        if (!r.success || !r.data?.paymentMethods) return [];
        const list = r.data.paymentMethods.filter((pm) => pm.id != null) as PaymentMethodOption[];
        return list;
      }),
      catchError(() => of([])),
    );
  }
}
