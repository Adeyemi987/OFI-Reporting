import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ErrorModalService } from '../services/error-modal.service';
import { SKIP_GLOBAL_ERROR_HANDLING } from '../tokens';
import { parseHttpError, shouldSkipGlobalErrorHandling } from '../utils/http-error.util';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorModal = inject(ErrorModalService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      const skipGlobal = req.context.get(SKIP_GLOBAL_ERROR_HANDLING);
      const skipAuthRoute = shouldSkipGlobalErrorHandling(req.url);

      if (err.status === 401) {
        if (authService.isAuthenticated()) {
          const parsed = parseHttpError(err);
          if (!skipGlobal) {
            errorModal.show('Session Expired', parsed.message, 'warning');
          }
          authService.logout();
        }
        return throwError(() => err);
      }

      if (!skipGlobal && !skipAuthRoute) {
        const parsed = parseHttpError(err);
        errorModal.show(parsed.title, parsed.message, err.status >= 500 ? 'error' : 'warning');
      }

      return throwError(() => err);
    })
  );
};
