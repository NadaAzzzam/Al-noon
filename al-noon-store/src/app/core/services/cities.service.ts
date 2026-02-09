import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, City } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private readonly http = inject(HttpClient);

  getCities(): Observable<City[]> {
    return this.http.get<ApiSuccess<City[]>>('cities').pipe(
      (o) =>
        new Observable<City[]>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.next([]);
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getCity(id: string): Observable<City> {
    return this.http.get<ApiSuccess<City>>(`cities/${id}`).pipe(
      (o) =>
        new Observable<City>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data);
              else sub.error('City not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
