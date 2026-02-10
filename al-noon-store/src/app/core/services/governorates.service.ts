import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import type { Governorate, GovernoratesApiResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class GovernoratesService {
  private readonly http = inject(HttpClient);

  getGovernorates(): Observable<Governorate[]> {
    return this.http.get<GovernoratesApiResponse>('governorates').pipe(
      map((r) => {
        if (!r.success) return [];
        return Array.isArray(r.data) ? r.data : [];
      }),
      catchError(() => of([])),
    );
  }
}
