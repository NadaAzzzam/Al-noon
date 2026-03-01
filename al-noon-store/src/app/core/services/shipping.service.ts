import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { ShippingMethod, ShippingMethodRaw, SchemaListShippingMethodsResponse } from '../types/api.types';

function formatEstimatedDays(ed: ShippingMethodRaw['estimatedDays']): string {
  if (typeof ed === 'string') return ed;
  if (ed && typeof ed === 'object' && 'min' in ed && 'max' in ed) {
    const min = (ed as { min?: number }).min;
    const max = (ed as { max?: number }).max;
    if (min != null && max != null) return `${min}-${max}`;
    if (min != null) return String(min);
    if (max != null) return String(max);
  }
  return '';
}

function normalizeShippingMethod(raw: ShippingMethodRaw): ShippingMethod {
  const id = String(raw.id ?? raw._id ?? '');
  const estimatedDays =
    typeof raw.estimatedDays === 'string'
      ? raw.estimatedDays
      : formatEstimatedDays(raw.estimatedDays);
  return {
    id,
    name: raw.name ?? { en: '', ar: '' },
    description: raw.description ?? { en: '', ar: '' },
    estimatedDays,
    ...(raw.price != null ? { price: raw.price } : {}),
  };
}

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly http = inject(HttpClient);

  getShippingMethods(): Observable<ShippingMethod[]> {
    return this.http.get<SchemaListShippingMethodsResponse>('shipping-methods').pipe(
      map((r) => {
        const r2 = r as {
          data?: ShippingMethodRaw[] | { shippingMethods?: ShippingMethodRaw[] };
          shippingMethods?: ShippingMethodRaw[];
        };
        let list: ShippingMethodRaw[] = [];
        if (Array.isArray(r2.data)) list = r2.data;
        else if (Array.isArray((r2.data as { shippingMethods?: ShippingMethodRaw[] })?.shippingMethods))
          list = (r2.data as { shippingMethods: ShippingMethodRaw[] }).shippingMethods;
        else if (Array.isArray(r2.shippingMethods)) list = r2.shippingMethods;
        return list
          .filter((m) => m.enabled !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map(normalizeShippingMethod);
      }),
      catchError(() => of([])),
    );
  }
}
