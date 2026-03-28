import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import {
  AuthState, User, LoginRequest, LoginResponse, LoginApiResponse, UserRole
} from '../models';
import { API_BASE_URL } from '../tokens';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ofi_auth_token';
  private readonly USER_KEY = 'ofi_auth_user';

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);

  private _authState = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  readonly authState = this._authState.asReadonly();
  readonly currentUser = computed(() => this._authState().user);
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly currentRole = computed(() => this._authState().user?.role ?? null);

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        this._authState.set({ user, token, isAuthenticated: true });
      } catch {
        this.clearSession();
      }
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginApiResponse>(`${this.baseUrl}/api/Auth/login`, request).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Login failed.');
        const { token, refreshToken, userId, fullName, role } = res.data;
        const bearerToken = `Bearer ${token}`;
        const user: User = {
          id: userId,
          fullName,
          email: request.email,
          role,
          isActive: true
        };
        return { user, token: bearerToken, refreshToken };
      }),
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this._authState.set({ user: res.user, token: res.token, isAuthenticated: true });
      }),
      catchError(err => {
        const message = err?.error?.message ?? err?.message ?? 'Invalid credentials.';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._authState.set({ user: null, token: null, isAuthenticated: false });
  }

  getToken(): string | null {
    return this._authState().token;
  }

  hasRole(role: UserRole): boolean {
    return this._authState().user?.role === role;
  }
}
