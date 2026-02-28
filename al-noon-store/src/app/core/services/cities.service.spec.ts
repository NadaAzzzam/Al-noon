import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  let service: CitiesService;
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [CitiesService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(CitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return cities from array data', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: [{ _id: '1', name: { en: 'Cairo' }, deliveryFee: 20 }] })
    );
    const cities = await firstValueFrom(service.getCities());
    expect(cities).toHaveLength(1);
    expect(cities[0].id).toBe('1');
    expect(cities[0].name).toEqual({ en: 'Cairo' });
    expect(cities[0].deliveryFee).toBe(20);
  });

  it('should return cities from data.cities', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: { cities: [{ _id: '2', name: { ar: 'الإسكندرية' }, deliveryFee: 25 }] } })
    );
    const cities = await firstValueFrom(service.getCities());
    expect(cities).toHaveLength(1);
    expect(cities[0].id).toBe('2');
  });

  it('should return empty array when success is false', async () => {
    httpMock.get.mockReturnValue(of({ success: false }));
    const cities = await firstValueFrom(service.getCities());
    expect(cities).toEqual([]);
  });

  it('should return empty array on error', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('Fail')));
    const cities = await firstValueFrom(service.getCities());
    expect(cities).toEqual([]);
  });

  it('should return single city from getCity', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: { city: { _id: '1', name: { en: 'Cairo' }, deliveryFee: 35 } } })
    );
    const city = await firstValueFrom(service.getCity('1'));
    expect(city.id).toBe('1');
    expect(city.deliveryFee).toBe(35);
  });

  it('should error when getCity returns no city', async () => {
    httpMock.get.mockReturnValue(of({ success: true, data: { city: null } }));
    await expect(firstValueFrom(service.getCity('x'))).rejects.toBeDefined();
  });
});
