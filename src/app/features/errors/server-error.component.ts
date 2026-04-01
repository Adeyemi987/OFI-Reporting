import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-server-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-page">
      <!-- Background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="error-card">
        <!-- Illustration -->
        <div class="illustration" [class.shake]="isShaking()">
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Ground shadow -->
            <ellipse cx="100" cy="148" rx="68" ry="7" fill="var(--border)"/>
            <!-- Server rack body -->
            <rect x="52" y="48" width="96" height="92" rx="10" fill="var(--surface-card)" stroke="var(--border)" stroke-width="2"/>
            <!-- Server slots -->
            <rect x="62" y="58" width="76" height="16" rx="4" fill="var(--border-light)" stroke="var(--border)" stroke-width="1"/>
            <rect x="62" y="80" width="76" height="16" rx="4" fill="var(--border-light)" stroke="var(--border)" stroke-width="1"/>
            <rect x="62" y="102" width="76" height="16" rx="4" fill="var(--border-light)" stroke="var(--border)" stroke-width="1"/>
            <!-- Error LED indicator (blinking) -->
            <circle cx="128" cy="66" r="4" fill="#EF4444" class="blink-led"/>
            <circle cx="128" cy="88" r="4" fill="#F59E0B" class="blink-led-2"/>
            <circle cx="128" cy="110" r="4" fill="#EF4444" class="blink-led"/>
            <!-- Activity bars -->
            <rect x="68" y="63" width="40" height="6" rx="2" fill="var(--border)"/>
            <rect x="68" y="85" width="28" height="6" rx="2" fill="var(--border)"/>
            <rect x="68" y="107" width="36" height="6" rx="2" fill="var(--border)"/>
            <!-- Smoke/spark effect -->
            <path d="M120 48 Q118 38 122 30 Q124 22 120 14" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.5" class="smoke"/>
            <path d="M130 48 Q132 36 128 26 Q126 18 130 10" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.35" class="smoke-2"/>
            <!-- Warning triangle -->
            <g transform="translate(82, 4)">
              <path d="M18 2L34 30H2L18 2Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="1.5"/>
              <text x="18" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="900" fill="#92400E">!</text>
            </g>
          </svg>
        </div>

        <!-- Error badge -->
        <div class="error-badge">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Something went wrong
        </div>

        <!-- Description -->
        <p class="error-description">
          An unexpected error occurred on our end. Don't worry — it's not your fault.
          Our team has been notified and is working to fix it.
        </p>

        <!-- Error context (non-technical) -->
        @if (errorCode()) {
          <div class="error-meta">
            <span class="error-meta-label">Error reference:</span>
            <code class="error-meta-code">{{ errorCode() }}</code>
          </div>
        }

        <!-- Actions -->
        <div class="error-actions">
          <button class="btn btn-primary" (click)="retryPage()">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" [class.spinning]="isRetrying()" aria-hidden="true">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
            </svg>
            {{ isRetrying() ? 'Retrying...' : 'Try Again' }}
          </button>
          <button class="btn btn-outline" (click)="goHome()">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            Go to Dashboard
          </button>
        </div>

        <!-- Support info -->
        <div class="support-section">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          </svg>
          If this keeps happening, please contact your system administrator.
        </div>
      </div>
    </div>

    <style>
      .error-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface);
        padding: 24px;
        position: relative;
        overflow: hidden;
        animation: pageIn 0.5s ease-out;
      }

      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        pointer-events: none;
        opacity: 0.25;
      }
      .blob-1 {
        width: 380px;
        height: 380px;
        background: #EF4444;
        top: -80px;
        left: -80px;
        animation: blobFloat 9s ease-in-out infinite;
      }
      .blob-2 {
        width: 280px;
        height: 280px;
        background: #F59E0B;
        bottom: -60px;
        right: -60px;
        animation: blobFloat 11s ease-in-out infinite reverse;
      }

      .error-card {
        position: relative;
        z-index: 1;
        background: var(--surface-card);
        border: 1px solid var(--border);
        border-radius: 28px;
        padding: 48px 40px;
        max-width: 520px;
        width: 100%;
        text-align: center;
        box-shadow: var(--shadow-lg);
        animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .illustration {
        width: 160px;
        height: 130px;
        margin: 0 auto 24px;
        transition: transform 0.1s;
      }
      .illustration svg {
        width: 100%;
        height: 100%;
      }
      .illustration.shake {
        animation: shake 0.5s ease-in-out;
      }

      .error-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.25);
        border-radius: 30px;
        color: #DC2626;
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 16px;
        animation: badgeIn 0.4s ease-out 0.2s both;
      }

      .error-title {
        font-size: 26px;
        font-weight: 800;
        color: var(--text);
        margin: 0 0 12px;
        letter-spacing: -0.5px;
      }

      .error-description {
        color: var(--text-secondary);
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 24px;
        max-width: 380px;
        margin-left: auto;
        margin-right: auto;
      }

      .error-meta {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 8px 14px;
        margin-bottom: 28px;
        font-size: 13px;
      }
      .error-meta-label {
        color: var(--text-muted);
        font-weight: 500;
      }
      .error-meta-code {
        color: var(--text);
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-weight: 600;
        background: var(--border-light);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 22px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
      }
      .btn:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      .btn-primary {
        background: linear-gradient(135deg, #DC2626, #EF4444);
        color: white;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
      }
      .btn-primary:active { transform: translateY(0); }
      .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .btn-outline {
        background: transparent;
        color: var(--text);
        border: 1.5px solid var(--border);
      }
      .btn-outline:hover {
        background: var(--surface-hover);
        border-color: var(--primary);
        color: var(--primary);
      }

      .support-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-top: 1px solid var(--border-light);
        padding-top: 20px;
        color: var(--text-muted);
        font-size: 13px;
      }

      .spinning {
        animation: spin 0.8s linear infinite;
      }

      .blink-led {
        animation: blink 1.2s step-start infinite;
      }
      .blink-led-2 {
        animation: blink 1.8s step-start infinite 0.6s;
      }
      .smoke {
        animation: smokeRise 2s ease-in-out infinite;
      }
      .smoke-2 {
        animation: smokeRise 2.5s ease-in-out infinite 0.4s;
      }

      @keyframes pageIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes cardIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes badgeIn {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px) rotate(-1deg); }
        40% { transform: translateX(6px) rotate(1deg); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.2; }
      }
      @keyframes smokeRise {
        0% { opacity: 0.5; transform: translateY(0) scaleX(1); }
        100% { opacity: 0; transform: translateY(-12px) scaleX(1.3); }
      }
      @keyframes blobFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(15px, -15px) scale(1.04); }
        66% { transform: translate(-8px, 8px) scale(0.97); }
      }

      @media (max-width: 480px) {
        .error-card { padding: 36px 24px; }
        .error-title { font-size: 22px; }
        .btn { width: 100%; justify-content: center; }
        .error-actions { flex-direction: column; }
      }
    </style>
  `
})
export class ServerErrorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isRetrying = signal(false);
  isShaking = signal(false);
  errorCode = signal<string | null>(null);

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code) {
      this.errorCode.set(code);
    }
    // Trigger shake on load for visual feedback
    setTimeout(() => {
      this.isShaking.set(true);
      setTimeout(() => this.isShaking.set(false), 600);
    }, 400);
  }

  retryPage(): void {
    this.isRetrying.set(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
