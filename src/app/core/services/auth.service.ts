import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  AuthState, User, LoginRequest, LoginResponse, UserRole
} from '../models';

const MOCK_USERS: User[] = [
  { id: 'ch1', fullName: 'Dr. Amara Osei', email: 'ch@ofi.com', role: 'CH', isActive: true, region: 'West Africa' },
  { id: 'sh1', fullName: 'Kwame Mensah', email: 'sh@ofi.com', role: 'SH', isActive: true, managerId: 'ch1', region: 'Ghana' },
  { id: 'csh1', fullName: 'Akosua Boateng', email: 'csh@ofi.com', role: 'CSH', isActive: true, managerId: 'sh1', region: 'Ashanti' },
  { id: 'gl1', fullName: 'Emmanuel Darko', email: 'gl@ofi.com', role: 'GL', isActive: true, managerId: 'csh1', region: 'Central' },
  { id: 'pc1', fullName: 'Abena Ofori', email: 'pc@ofi.com', role: 'PC', isActive: true, managerId: 'gl1', region: 'Kumasi' },
  { id: 'fc1', fullName: 'Kofi Asante', email: 'fc@ofi.com', role: 'FC', isActive: true, managerId: 'pc1', region: 'Kumasi North' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'ofi_auth_token';
  private readonly USER_KEY = 'ofi_auth_user';

  private _authState = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  readonly authState = this._authState.asReadonly();
  readonly currentUser = computed(() => this._authState().user);
  readonly isAuthenticated = computed(() => this._authState().isAuthenticated);
  readonly currentRole = computed(() => this._authState().user?.role ?? null);

  constructor(private router: Router) {
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
    const user = MOCK_USERS.find(u => u.email === request.email);
    if (!user) return throwError(() => new Error('Invalid credentials'));

    const response: LoginResponse = {
      user,
      token: 'Bearer mock_jwt_' + Date.now(),
      refreshToken: 'refresh_' + Date.now()
    };

    return of(response).pipe(
      delay(800),
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this._authState.set({ user: res.user, token: res.token, isAuthenticated: true });
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
