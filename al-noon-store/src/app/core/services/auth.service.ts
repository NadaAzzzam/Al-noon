import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import type { ApiSuccess, ApiError, AuthUser, AuthTokens } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly loadedSignal = signal(false);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());
  readonly loaded = this.loadedSignal.asReadonly();

  signUp(body: { name: string; email: string; password: string }): Observable<AuthTokens> {
    return this.http.post<ApiSuccess<AuthTokens>>('auth/sign-up', body).pipe(
      tap((r) => {
        if (r.success && r.data) this.userSignal.set(r.data.user);
      }),
      (o) =>
        new Observable<AuthTokens>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data!);
              else sub.error((r as unknown as ApiError).message);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  signIn(body: { email: string; password: string }): Observable<AuthTokens> {
    return this.http.post<ApiSuccess<AuthTokens>>('auth/sign-in', body).pipe(
      tap((r) => {
        if (r.success && r.data) this.userSignal.set(r.data.user);
      }),
      (o) =>
        new Observable<AuthTokens>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data) sub.next(r.data!);
              else sub.error((r as unknown as ApiError).message);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  loadProfile(): Observable<AuthUser | null> {
    return this.http.get<ApiSuccess<{ user: AuthUser }>>('auth/profile').pipe(
      tap((r) => {
        this.loadedSignal.set(true);
        if (r.success && r.data) this.userSignal.set(r.data.user);
        else this.userSignal.set(null);
      }),
      catchError((_err) => {
        // Not logged in (401/403) or network error: treat as no user
        this.loadedSignal.set(true);
        this.userSignal.set(null);
        return of(null);
      }),
      (o) =>
        new Observable<AuthUser | null>((sub) => {
          o.subscribe({
            next: (n) => sub.next(n && typeof n === 'object' && 'data' in n && n.data ? n.data.user : null),
            error: () => {
              this.loadedSignal.set(true);
              this.userSignal.set(null);
              sub.next(null);
              sub.complete();
            },
            complete: () => sub.complete(),
          });
        })
    );
  }

  signOut(): Observable<void> {
    return this.http.post<ApiSuccess<unknown>>('auth/sign-out', {}).pipe(
      tap(() => this.userSignal.set(null)),
      (o) =>
        new Observable<void>((sub) => {
          o.subscribe({
            next: () => sub.next(),
            error: () => {
              this.userSignal.set(null);
              sub.next();
            },
            complete: () => sub.complete(),
          });
        })
    );
  }
}
