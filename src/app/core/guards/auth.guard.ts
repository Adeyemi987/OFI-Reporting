import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) return true;
    this.router.navigate(['/auth/login']);
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles: UserRole[] = route.data['roles'] ?? [];
    const userRole = this.authService.currentRole();
    if (!userRole || !requiredRoles.includes(userRole)) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    return true;
  }
}
