import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { ShippingMethod, ShippingMethodsApiResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly http = inject(HttpClient);

  getShippingMethods(): Observable<ShippingMethod[]> {
    return this.http.get<ShippingMethodsApiResponse>('shipping-methods').pipe(
      map((r) => {
        if (!r.success) return [];
        return Array.isArray(r.data) ? r.data : [];
      }),
      catchError(() => of([])),
    );
  }
}
