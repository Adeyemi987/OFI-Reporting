import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-page">
      <!-- Background blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="error-card">
        <!-- Illustration -->
        <div class="illustration">
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Ground -->
            <ellipse cx="100" cy="148" rx="72" ry="8" fill="var(--border)"/>
            <!-- Body -->
            <rect x="60" y="70" width="80" height="70" rx="12" fill="var(--surface-card)" stroke="var(--border)" stroke-width="2"/>
            <!-- Screen -->
            <rect x="70" y="80" width="60" height="42" rx="6" fill="var(--border-light)"/>
            <!-- 404 on screen -->
            <text x="100" y="107" text-anchor="middle" font-family="Inter,sans-serif" font-size="18" font-weight="900" fill="var(--primary)">404</text>
            <!-- Legs -->
            <rect x="72" y="138" width="14" height="20" rx="5" fill="var(--border)"/>
            <rect x="114" y="138" width="14" height="20" rx="5" fill="var(--border)"/>
            <!-- Arms -->
            <rect x="32" y="82" width="30" height="12" rx="6" fill="var(--border)" transform="rotate(-20 32 82)"/>
            <rect x="138" y="82" width="30" height="12" rx="6" fill="var(--border)" transform="rotate(20 152 82)"/>
            <!-- Head -->
            <circle cx="100" cy="52" r="22" fill="var(--surface-card)" stroke="var(--border)" stroke-width="2"/>
            <!-- Eyes (confused) -->
            <circle cx="92" cy="50" r="3.5" fill="var(--text-secondary)"/>
            <circle cx="108" cy="50" r="3.5" fill="var(--text-secondary)"/>
            <path d="M93 58 Q100 55 107 58" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round" fill="none"/>
            <!-- Antenna -->
            <line x1="100" y1="30" x2="100" y2="18" stroke="var(--border)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="100" cy="14" r="4" fill="var(--primary)"/>
            <!-- Question marks -->
            <text x="28" y="48" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="var(--primary)" opacity="0.6" class="float-q">?</text>
            <text x="162" y="40" font-family="Inter,sans-serif" font-size="18" font-weight="700" fill="var(--secondary)" opacity="0.5" class="float-q2">?</text>
            <text x="148" y="65" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="var(--primary)" opacity="0.4" class="float-q">?</text>
          </svg>
        </div>

        <!-- Error code badge -->
        <div class="error-badge">404</div>

        <!-- Heading -->
        <h1 class="error-title">Page Not Found</h1>

        <!-- Description -->
        <p class="error-description">
          Oops! The page you're looking for doesn't exist. It may have been moved,
          deleted, or the link might be incorrect.
        </p>

        <!-- Actions -->
        <div class="error-actions">
          <button class="btn btn-outline" (click)="goBack()">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
            </svg>
            Go Back
          </button>
          <button class="btn btn-primary" (click)="goHome()">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
            Go to Dashboard
          </button>
        </div>

        <!-- Helpful links -->
        <div class="helpful-links">
          <span class="helpful-links-label">Try these instead:</span>
          <div class="links-row">
            <button class="link-chip" (click)="navigate('/dashboard')">Dashboard</button>
            <button class="link-chip" (click)="navigate('/dashboard/reports')">Reports</button>
            <button class="link-chip" (click)="navigate('/dashboard/analytics')">Analytics</button>
          </div>
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
        opacity: 0.35;
      }
      .blob-1 {
        width: 420px;
        height: 420px;
        background: var(--primary);
        top: -120px;
        right: -100px;
        animation: blobFloat 8s ease-in-out infinite;
      }
      .blob-2 {
        width: 300px;
        height: 300px;
        background: var(--secondary);
        bottom: -80px;
        left: -80px;
        animation: blobFloat 10s ease-in-out infinite reverse;
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
        width: 180px;
        height: 140px;
        margin: 0 auto 24px;
        animation: robotBob 3s ease-in-out infinite;
      }
      .illustration svg {
        width: 100%;
        height: 100%;
      }

      .error-badge {
        display: inline-block;
        font-size: 72px;
        font-weight: 900;
        letter-spacing: -4px;
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        margin-bottom: 12px;
        animation: numberPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
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
        margin: 0 0 32px;
        max-width: 380px;
        margin-left: auto;
        margin-right: auto;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 28px;
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
        text-decoration: none;
      }
      .btn:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: white;
        box-shadow: 0 4px 16px rgba(208, 71, 174, 0.35);
      }
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(208, 71, 174, 0.45);
      }
      .btn-primary:active { transform: translateY(0); }

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

      .helpful-links {
        border-top: 1px solid var(--border-light);
        padding-top: 20px;
      }
      .helpful-links-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        display: block;
        margin-bottom: 10px;
      }
      .links-row {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .link-chip {
        padding: 6px 14px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 30px;
        font-size: 13px;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        font-family: inherit;
        transition: all 0.18s ease;
      }
      .link-chip:hover {
        background: var(--surface-hover);
        border-color: var(--primary);
        color: var(--primary);
      }
      .link-chip:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      @keyframes pageIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes cardIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes numberPop {
        from { opacity: 0; transform: scale(0.5); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes robotBob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes blobFloat {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(20px, -20px) scale(1.05); }
        66% { transform: translate(-10px, 10px) scale(0.97); }
      }
      .float-q { animation: floatQ 2.5s ease-in-out infinite; }
      .float-q2 { animation: floatQ 3s ease-in-out infinite 0.5s; }
      @keyframes floatQ {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @media (max-width: 480px) {
        .error-card { padding: 36px 24px; }
        .error-badge { font-size: 56px; }
        .error-title { font-size: 22px; }
        .btn { width: 100%; justify-content: center; }
        .error-actions { flex-direction: column; }
      }
    </style>
  `
})
export class NotFoundComponent {
  private readonly router = inject(Router);

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
