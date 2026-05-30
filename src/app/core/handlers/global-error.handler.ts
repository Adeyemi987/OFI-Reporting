import { ErrorHandler, Injectable, Injector, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Use Injector to lazily resolve services and avoid circular dependency at bootstrap
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private lastToastAt = 0;
  private readonly toastCooldownMs = 3000;

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

    // Suppress chunk-load errors (lazy route not yet loaded) — just show toast
    const isChunkError = message.includes('ChunkLoadError') || message.includes('Loading chunk');
    if (isChunkError) {
      const toastService = this.injector.get(ToastService);
      toastService.show('Update Available', 'The app has been updated. Please refresh.', 'error');
      return;
    }

    // Log error but don't navigate to error page for non-critical errors
    console.error('[Unhandled Error]', error);

    // Only navigate to error page for critical errors
    const isCritical = message.includes('Cannot match any routes') || 
                       message.includes('NullInjectorError') ||
                       message.includes('Provider not found');
    
    if (!isCritical) {
      const now = Date.now();
      if (now - this.lastToastAt < this.toastCooldownMs) {
        return;
      }
      this.lastToastAt = now;

      try {
        const toastService = this.injector.get(ToastService);
        toastService.show('Error', 'An error occurred. Please try again.', 'error');
      } catch {
        console.error('Could not show error toast');
      }
      return;
    }

    // For severe runtime errors navigate to the error page
    this.zone.run(() => {
      const router = this.injector.get(Router);
      // Avoid redirect loops if already on an error page
      const currentUrl = router.url;
      if (currentUrl.startsWith('/error') || currentUrl.startsWith('/not-found')) {
        return;
      }
      router.navigate(['/error'], { replaceUrl: true });
    });
  }
}
