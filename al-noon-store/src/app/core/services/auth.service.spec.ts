import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    httpMock = { post: vi.fn(), get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: httpMock },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear user state on signOut (state reset on logout)', () => {
    (sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('1');
    httpMock.get.mockReturnValue(
      of({ success: true, data: { user: { id: '1', email: 't@t.com', name: 'Test' } } })
    );
    service.loadProfile().subscribe();
    expect(service.user()).toBeTruthy();
    httpMock.post.mockReturnValue(of({ success: true, data: {} }));
    service.signOut().subscribe();
    expect(service.user()).toBeNull();
  });

  it('should set user on successful signIn', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test User' };
    httpMock.post.mockReturnValue(of({ success: true, data: { user, accessToken: 'token' } }));
    service.signIn({ email: 'test@test.com', password: 'pass123' }).subscribe();
    expect(service.user()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should clear user when loadProfile returns error (401)', () => {
    (sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('1');
    httpMock.get.mockReturnValue(throwError(() => new Error('Unauthorized')));
    service.loadProfile().subscribe((u) => {
      expect(u).toBeNull();
    });
    expect(service.user()).toBeNull();
  });
});
