import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { ApiSuccess, City, CitiesApiResponse, CityApiResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class CitiesService {
  private readonly http = inject(HttpClient);

  getCities(): Observable<City[]> {
    return this.http.get<CitiesApiResponse | ApiSuccess<City[]>>('cities').pipe(
      (o) =>
        new Observable<City[]>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.next([]);
                return;
              }
              const raw = r.data as { cities?: City[] } | City[];
              const list = Array.isArray(raw) ? raw : (raw?.cities ?? []);
              sub.next(list);
            },
            error: () => sub.next([]),
            complete: () => sub.complete(),
          });
        })
    );
  }

  getCity(id: string): Observable<City> {
    return this.http.get<CityApiResponse | ApiSuccess<City>>(`cities/${id}`).pipe(
      (o) =>
        new Observable<City>((sub) => {
          o.subscribe({
            next: (r) => {
              if (!r.success) {
                sub.error('City not found');
                return;
              }
              const data = r.data as { city?: City } | City;
              const city = data && 'city' in data ? data.city : (data as City);
              if (city) sub.next(city);
              else sub.error('City not found');
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }
}
