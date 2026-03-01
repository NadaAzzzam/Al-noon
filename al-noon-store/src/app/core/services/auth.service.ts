import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import type { ApiError, AuthUser, AuthTokens, SchemaAuthResponse, SchemaProfileResponse, SchemaSignOutResponse } from '../types/api.types';

const SESSION_HINT_KEY = 'al_noon_auth_session';

function hasSessionHint(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return !!sessionStorage.getItem(SESSION_HINT_KEY);
}

function setSessionHint(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(SESSION_HINT_KEY, '1');
}

function clearSessionHint(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_HINT_KEY);
}

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
    return this.http.post<SchemaAuthResponse>('auth/sign-up', body).pipe(
      tap((r) => {
        if (r.success && r.data?.user) {
          this.userSignal.set(r.data.user as AuthUser);
          setSessionHint();
        }
      }),
      (o) =>
        new Observable<AuthTokens>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data?.token != null && r.data?.user)
                sub.next({ token: r.data.token!, user: r.data.user! } as AuthTokens);
              else sub.error((r as unknown as ApiError).message);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  signIn(body: { email: string; password: string }): Observable<AuthTokens> {
    return this.http.post<SchemaAuthResponse>('auth/sign-in', body).pipe(
      tap((r) => {
        if (r.success && r.data?.user) {
          this.userSignal.set(r.data.user as AuthUser);
          setSessionHint();
        }
      }),
      (o) =>
        new Observable<AuthTokens>((sub) => {
          o.subscribe({
            next: (r) => {
              if (r.success && r.data?.token != null && r.data?.user)
                sub.next({ token: r.data.token!, user: r.data.user! } as AuthTokens);
              else sub.error((r as unknown as ApiError).message);
            },
            error: (e) => sub.error(e),
            complete: () => sub.complete(),
          });
        })
    );
  }

  loadProfile(): Observable<AuthUser | null> {
    if (!hasSessionHint()) {
      this.loadedSignal.set(true);
      this.userSignal.set(null);
      return of(null);
    }
    return this.http.get<SchemaProfileResponse>('auth/profile').pipe(
      tap((r) => {
        this.loadedSignal.set(true);
        if (r.success && r.data?.user) {
          this.userSignal.set(r.data.user as AuthUser);
          setSessionHint();
        } else {
          this.userSignal.set(null);
          clearSessionHint();
        }
      }),
      catchError((_err) => {
        // Not logged in (401/403) or network error: treat as no user
        this.loadedSignal.set(true);
        this.userSignal.set(null);
        clearSessionHint();
        return of(null);
      }),
      (o) =>
        new Observable<AuthUser | null>((sub) => {
          o.subscribe({
            next: (n) => sub.next(n && typeof n === 'object' && 'data' in n && n.data?.user ? (n.data.user as AuthUser) : null),
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
    return this.http.post<SchemaSignOutResponse>('auth/sign-out', {}).pipe(
      tap(() => {
        this.userSignal.set(null);
        clearSessionHint();
      }),
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
