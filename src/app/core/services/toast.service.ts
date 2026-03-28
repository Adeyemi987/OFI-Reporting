import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'success' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(title: string, message: string, type: Toast['type'] = 'error', duration = 6000): void {
    const id = ++this.nextId;
    this.toasts.update(list => [...list, { id, title, message, type }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
