import { ErrorHandler, Injectable, Injector, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ErrorModalService } from '../services/error-modal.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private lastModalAt = 0;
  private readonly modalCooldownMs = 2000;

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      console.error('[HTTP Error]', error);
      return;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('ExpressionChangedAfterItHasBeenChecked')) {
      console.warn('[Angular]', message);
      return;
    }

    const isChunkError = message.includes('ChunkLoadError') || message.includes('Loading chunk');
    if (isChunkError) {
      const errorModal = this.injector.get(ErrorModalService);
      errorModal.show(
        'Update Available',
        'The app has been updated. Please refresh the page to continue.',
        'warning'
      );
      return;
    }

    console.error('[Unhandled Error]', error);

    const isCritical = message.includes('Cannot match any routes') ||
      message.includes('NullInjectorError') ||
      message.includes('Provider not found');

    if (!isCritical) {
      const now = Date.now();
      if (now - this.lastModalAt < this.modalCooldownMs) {
        return;
      }
      this.lastModalAt = now;

      try {
        const errorModal = this.injector.get(ErrorModalService);
        errorModal.show('Unexpected Error', message || 'An error occurred. Please try again.');
      } catch {
        try {
          const toastService = this.injector.get(ToastService);
          toastService.show('Error', 'An error occurred. Please try again.', 'error');
        } catch {
          console.error('Could not show error modal');
        }
      }
      return;
    }

    this.zone.run(() => {
      const router = this.injector.get(Router);
      const currentUrl = router.url;
      if (currentUrl.startsWith('/error') || currentUrl.startsWith('/not-found')) {
        return;
      }
      router.navigate(['/error'], { replaceUrl: true });
    });
  }
}
