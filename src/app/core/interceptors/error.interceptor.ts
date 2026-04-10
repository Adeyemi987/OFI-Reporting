import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

function getFriendlyError(err: HttpErrorResponse): { title: string; message: string } | null {
  switch (err.status) {
    case 0:
      return {
        title: 'Connection Error',
        message: 'Cannot connect to the server. Please make sure the server is running and try again.',
      };
    case 500:
      return {
        title: 'Server Error',
        message: 'The server encountered an unexpected error. Please try again later.',
      };
    case 502:
    case 503:
    case 504:
      return {
        title: 'Service Unavailable',
        message: 'The server is temporarily unavailable. Please try again in a moment.',
      };
    default:
      // 4xx errors are handled individually by each component
      return null;
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401) {
          authService.logout();
          router.navigate(['/auth/login']);
        } else {
          const friendly = getFriendlyError(err);
          if (friendly) {
            toastService.show(friendly.title, friendly.message, 'error');
          }
        }
      }
      return throwError(() => err);
    })
  );
};
