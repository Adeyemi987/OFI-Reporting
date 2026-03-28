import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Use Injector to lazily resolve ToastService and avoid circular dependency at bootstrap
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    // HTTP errors are already shown by errorInterceptor — skip them here
    if (error instanceof HttpErrorResponse) {
      console.error('[HTTP Error]', error);
      return;
    }

    const message = error instanceof Error ? error.message : String(error);

    // Suppress Angular dev-mode false-positive warnings
    if (message.includes('ExpressionChangedAfterItHasBeenChecked')) {
      console.warn('[Angular]', message);
      return;
    }

    console.error('[Unhandled Error]', error);

    const toastService = this.injector.get(ToastService);
    toastService.show(
      'Unexpected Error',
      'Something went wrong. Please refresh the page or try again.',
      'error'
    );
  }
}
