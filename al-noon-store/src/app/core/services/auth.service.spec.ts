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

  it('should clear user and session hint when clearSession is called', () => {
    (sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('1');
    httpMock.get.mockReturnValue(
      of({ success: true, data: { user: { id: '1', email: 't@t.com', name: 'Test' } } })
    );
    service.loadProfile().subscribe();
    expect(service.user()).toBeTruthy();
    service.clearSession();
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.removeItem).toHaveBeenCalled();
  });

  it('should set user on successful signIn', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test User' };
    httpMock.post.mockReturnValue(of({ success: true, data: { user, accessToken: 'token' } }));
    service.signIn({ email: 'test@test.com', password: 'pass123' }).subscribe();
    expect(service.user()).toEqual(user);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('should not set user when signIn fails (401)', () => {
    httpMock.post.mockReturnValue(throwError(() => ({ status: 401 })));
    service.signIn({ email: 'test@test.com', password: 'wrong' }).subscribe({
      error: () => {
        expect(service.user()).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
      },
    });
  });

  it('should set user on successful register', () => {
    const user = { id: '2', email: 'new@test.com', name: 'New User' };
    httpMock.post.mockReturnValue(of({ success: true, data: { user, token: 'token' } }));
    service.signUp({ name: 'New User', email: 'new@test.com', password: 'pass123' }).subscribe();
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

  it('should return success from forgotPassword when API succeeds', () => {
    httpMock.post.mockReturnValue(of({ success: true, message: 'Email sent' }));
    service.forgotPassword('user@example.com').subscribe((r) => {
      expect(r.success).toBe(true);
      expect(r.message).toBe('Email sent');
    });
    expect(httpMock.post).toHaveBeenCalledWith('auth/forgot-password', { email: 'user@example.com' });
  });

  it('should trim email when calling forgotPassword', () => {
    httpMock.post.mockReturnValue(of({ success: true }));
    service.forgotPassword('  user@example.com  ').subscribe();
    expect(httpMock.post).toHaveBeenCalledWith('auth/forgot-password', { email: 'user@example.com' });
  });

  it('should propagate error when forgotPassword API fails', () => {
    httpMock.post.mockReturnValue(throwError(() => ({ message: 'Network error' })));
    service.forgotPassword('user@example.com').subscribe({
      error: (err) => expect(err.message).toBe('Network error'),
    });
  });

  it('should return success from resetPassword and set user when API returns user', () => {
    const user = { id: '1', email: 'u@t.com', name: 'User' };
    httpMock.post.mockReturnValue(of({ success: true, user }));
    service.resetPassword({
      token: 'tk',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    }).subscribe((r) => {
      expect(r.success).toBe(true);
    });
    expect(service.user()).toEqual(user);
    expect(httpMock.post).toHaveBeenCalledWith('auth/reset-password', {
      token: 'tk',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    });
  });

  it('should return success from resetPassword without setting user when API does not return user', () => {
    httpMock.post.mockReturnValue(of({ success: true }));
    httpMock.get.mockReturnValue(of({ success: true, data: { user: null } }));
    service.resetPassword({
      token: 'tk',
      password: 'newpass123',
      confirmPassword: 'newpass123',
    }).subscribe((r) => {
      expect(r.success).toBe(true);
    });
    expect(service.user()).toBeNull();
  });
});
