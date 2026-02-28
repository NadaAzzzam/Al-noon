import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError, firstValueFrom } from 'rxjs';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [CategoriesService, { provide: HttpClient, useValue: httpMock }],
    });
    service = TestBed.inject(CategoriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return normalized categories from array data', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: [{ _id: '1', name: { en: 'Abayas' }, status: 'visible' }] })
    );
    const cats = await firstValueFrom(service.getCategories());
    expect(cats).toHaveLength(1);
    expect(cats[0].id).toBe('1');
    expect(cats[0].name).toEqual({ en: 'Abayas' });
  });

  it('should return categories from data.categories', async () => {
    httpMock.get.mockReturnValue(
      of({ success: true, data: { categories: [{ _id: '2', name: { ar: 'عبايات' }, status: 'visible' }] } })
    );
    const cats = await firstValueFrom(service.getCategories());
    expect(cats).toHaveLength(1);
    expect(cats[0].id).toBe('2');
  });

  it('should return empty array when success is false', async () => {
    httpMock.get.mockReturnValue(of({ success: false }));
    const cats = await firstValueFrom(service.getCategories());
    expect(cats).toEqual([]);
  });

  it('should return empty array on error', async () => {
    httpMock.get.mockReturnValue(throwError(() => new Error('Fail')));
    const cats = await firstValueFrom(service.getCategories());
    expect(cats).toEqual([]);
  });
});
