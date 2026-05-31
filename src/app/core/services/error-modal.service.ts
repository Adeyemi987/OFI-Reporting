import { Injectable, signal } from '@angular/core';

export type ErrorModalType = 'error' | 'warning';

export interface ErrorModalState {
  id: number;
  title: string;
  message: string;
  type: ErrorModalType;
}

/**
 * Blocking user-facing errors — use a modal the user must dismiss.
 * For non-blocking feedback (success, info, background sync), use ToastService.
 */
@Injectable({ providedIn: 'root' })
export class ErrorModalService {
  readonly modal = signal<ErrorModalState | null>(null);
  private nextId = 0;

  show(title: string, message: string, type: ErrorModalType = 'error'): void {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    this.modal.set({
      id: ++this.nextId,
      title: title.trim() || 'Error',
      message: trimmedMessage,
      type
    });
  }

  dismiss(): void {
    this.modal.set(null);
  }
}
