import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast, ToastService } from './core/services/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet></router-outlet>

    <!-- ── Global Toast Overlay ─────────────────────────────────── -->
    <div style="position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;width:340px;max-width:calc(100vw - 48px);">
      @for (toast of toastService.toasts(); track toast.id) {
        <div style="pointer-events:auto;display:flex;align-items:flex-start;gap:12px;padding:14px 14px 14px 14px;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.14),0 2px 8px rgba(0,0,0,0.08);animation:toastSlideIn 0.32s cubic-bezier(0.22,1,0.36,1);"
          [style.background]="toastBg(toast.type)"
          [style.border]="'1.5px solid ' + toastBorder(toast.type)">

          <!-- Type icon -->
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;"
            [style.background]="toastIconBg(toast.type)">
            @if (toast.type === 'error') {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#DC2626"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            } @else if (toast.type === 'warning') {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#D97706"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            } @else if (toast.type === 'success') {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#2563EB"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            }
          </div>

          <!-- Text content -->
          <div style="flex:1;min-width:0;padding-top:1px;">
            <div style="font-size:13.5px;font-weight:700;margin-bottom:3px;line-height:1.3;"
              [style.color]="toastTitleColor(toast.type)">{{ toast.title }}</div>
            <div style="font-size:12.5px;line-height:1.55;color:#6B7280;">{{ toast.message }}</div>
          </div>

          <!-- Dismiss button -->
          <button (click)="toastService.dismiss(toast.id)"
            style="flex-shrink:0;background:none;border:none;cursor:pointer;padding:2px;color:#9CA3AF;line-height:0;align-self:flex-start;border-radius:6px;transition:color 0.15s;"
            title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      }
    </div>

    <style>
      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateX(32px) scale(0.97); }
        to   { opacity: 1; transform: none; }
      }
    </style>
  `
})
export class App {
  readonly toastService = inject(ToastService);

  toastBg(type: Toast['type']): string {
    return { error: '#FEF2F2', warning: '#FFFBEB', success: '#F0FDF4', info: '#EFF6FF' }[type];
  }
  toastBorder(type: Toast['type']): string {
    return { error: '#FECACA', warning: '#FDE68A', success: '#BBF7D0', info: '#BFDBFE' }[type];
  }
  toastIconBg(type: Toast['type']): string {
    return { error: '#FEE2E2', warning: '#FEF3C7', success: '#DCFCE7', info: '#DBEAFE' }[type];
  }
  toastTitleColor(type: Toast['type']): string {
    return { error: '#B91C1C', warning: '#92400E', success: '#15803D', info: '#1D4ED8' }[type];
  }
}
