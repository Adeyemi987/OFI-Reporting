import { Component, HostListener, inject, ChangeDetectionStrategy } from '@angular/core';
import { ErrorModalService } from '../../services/error-modal.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorModal.modal(); as modal) {
      <div
        class="error-modal-backdrop"
        role="presentation"
        (click)="errorModal.dismiss()"
      ></div>

      <div
        class="error-modal"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="'error-modal-title-' + modal.id"
        [attr.aria-describedby]="'error-modal-message-' + modal.id"
      >
        <div class="error-modal-accent" [class.warning]="modal.type === 'warning'"></div>

        <div class="error-modal-icon" [class.warning]="modal.type === 'warning'" aria-hidden="true">
          @if (modal.type === 'warning') {
            <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          } @else {
            <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          }
        </div>

        <h2 class="error-modal-title" [id]="'error-modal-title-' + modal.id">
          {{ modal.title }}
        </h2>

        <p class="error-modal-message" [id]="'error-modal-message-' + modal.id">
          {{ modal.message }}
        </p>

        <button
          type="button"
          class="error-modal-action"
          [class.warning]="modal.type === 'warning'"
          (click)="errorModal.dismiss()"
        >
          Got it
        </button>
      </div>
    }
  `,
  styles: [`
    .error-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: errorModalFadeIn 0.2s ease;
    }

    .error-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 10001;
      width: min(92vw, 440px);
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 20px;
      padding: 1.75rem 1.75rem 1.5rem;
      box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.22),
        0 8px 24px rgba(0, 0, 0, 0.12);
      text-align: center;
      animation: errorModalSlideIn 0.28s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }

    .error-modal-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    }

    .error-modal-accent.warning {
      background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
    }

    .error-modal-icon {
      width: 64px;
      height: 64px;
      margin: 0.25rem auto 1rem;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef2f2;
      color: #dc2626;
    }

    .error-modal-icon.warning {
      background: #fffbeb;
      color: #d97706;
    }

    .error-modal-title {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827;
      line-height: 1.3;
    }

    .error-modal-message {
      margin: 0 0 1.5rem;
      font-size: 0.9375rem;
      line-height: 1.65;
      color: #4b5563;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .error-modal-action {
      width: 100%;
      padding: 0.875rem 1.25rem;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
    }

    .error-modal-action.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
    }

    .error-modal-action:hover {
      transform: translateY(-1px);
    }

    .error-modal-action:active {
      transform: translateY(0);
    }

    @keyframes errorModalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes errorModalSlideIn {
      from {
        opacity: 0;
        transform: translate(-50%, calc(-50% + 12px)) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `]
})
export class ErrorModalComponent {
  readonly errorModal = inject(ErrorModalService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.errorModal.modal()) {
      this.errorModal.dismiss();
    }
  }
}
