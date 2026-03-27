import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="
      min-height: 100vh;
      background: linear-gradient(135deg, #5A1E4A 0%, #D047AE 40%, #E068C4 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative; overflow: hidden;
    ">
      <!-- Animated background orbs -->
      <div style="
        position: absolute; width: 600px; height: 600px;
        background: radial-gradient(circle, rgba(224,104,196,0.15) 0%, transparent 70%);
        top: -200px; right: -200px; border-radius: 50%;
        animation: pulse 4s ease-in-out infinite;
      "></div>
      <div style="
        position: absolute; width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(208,71,174,0.2) 0%, transparent 70%);
        bottom: -100px; left: -100px; border-radius: 50%;
        animation: pulse 6s ease-in-out infinite reverse;
      "></div>

      <!-- Login Card -->
      <div style="
        background: rgba(255,255,255,0.97);
        border-radius: 24px;
        padding: 48px 44px;
        width: 100%; max-width: 420px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
        position: relative; z-index: 1;
        backdrop-filter: blur(20px);
        animation: slideUp 0.5s ease-out;
      ">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="
            display: inline-flex; align-items: center; justify-content: center;
            width: 72px; height: 72px;
            background: linear-gradient(135deg, #D047AE, #E068C4);
            border-radius: 20px;
            box-shadow: 0 8px 24px rgba(208,71,174,0.4);
            margin-bottom: 16px;
          ">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" fill="white" fill-opacity="0.2"/>
              <path d="M10 26 L18 10 L26 26 M13 21 H23" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.5px;">OFI Reporting</h1>
          <p style="margin: 6px 0 0; color: #6B7280; font-size: 14px; font-weight: 400;">Organizational Reporting System</p>
        </div>

        <!-- Error alert -->
        @if (errorMessage()) {
          <div style="
            background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px;
            padding: 12px 16px; margin-bottom: 20px;
            display: flex; align-items: center; gap: 8px;
            animation: shake 0.4s ease-out;
          ">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#DC2626">
              <circle cx="8" cy="8" r="7" stroke="#DC2626" stroke-width="1.5" fill="none"/>
              <path d="M8 5v3.5M8 11h.01" stroke="#DC2626" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span style="color: #DC2626; font-size: 13px;">{{ errorMessage() }}</span>
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="onLogin()" style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Email Address
            </label>
            <div style="position: relative;">
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="your@ofi.com"
                required
                style="
                  width: 100%; padding: 12px 16px 12px 44px;
                  border: 1.5px solid #E5E7EB; border-radius: 12px;
                  font-size: 15px; color: #1A1A1A;
                  background: #F9FAFB;
                  outline: none; box-sizing: border-box;
                  transition: border-color 0.2s, box-shadow 0.2s;
                "
              />
              <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%);" width="18" height="18" viewBox="0 0 20 20" fill="#9CA3AF">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px;">
              Password
            </label>
            <div style="position: relative;">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="••••••••"
                required
                style="
                  width: 100%; padding: 12px 44px 12px 44px;
                  border: 1.5px solid #E5E7EB; border-radius: 12px;
                  font-size: 15px; color: #1A1A1A;
                  background: #F9FAFB;
                  outline: none; box-sizing: border-box;
                  transition: border-color 0.2s, box-shadow 0.2s;
                "
              />
              <svg style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%);" width="18" height="18" viewBox="0 0 20 20" fill="#9CA3AF">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
              </svg>
              <button type="button" (click)="showPassword.set(!showPassword())" style="
                position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                background: none; border: none; cursor: pointer; padding: 0; color: #9CA3AF;
              ">
                @if (showPassword()) {
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.450l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.74L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                } @else {
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            style="
              padding: 14px;
              background: linear-gradient(135deg, #D047AE, #E068C4);
              color: white; border: none; border-radius: 12px;
              font-size: 15px; font-weight: 700; cursor: pointer;
              box-shadow: 0 4px 16px rgba(208,71,174,0.4);
              transition: all 0.2s; opacity: 1;
              display: flex; align-items: center; justify-content: center; gap: 8px;
            "
          >
            @if (loading()) {
              <svg style="animation: spin 1s linear infinite;" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
              </svg>
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <!-- Demo credentials -->
        <div style="
          margin-top: 28px; padding: 16px;
          background: linear-gradient(135deg, #FDF2FB, #FADDF2);
          border: 1px solid #F0B8E0; border-radius: 12px;
        ">
          <p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #D047AE; text-transform: uppercase; letter-spacing: 0.5px;">
            Demo Credentials
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            @for (cred of demoCreds; track cred.role) {
              <button (click)="fillDemo(cred.email)" class="demo-cred-btn" style="
                text-align: left; padding: 6px 10px;
                background: white; border: 1px solid #F0B8E0; border-radius: 8px;
                cursor: pointer; transition: all 0.15s;
                font-size: 11px; color: #374151; font-family: inherit;
              "
              >
                <span style="font-weight: 700; color: #D047AE;">{{ cred.role }}</span><br/>
                {{ cred.email }}
              </button>
            }
          </div>
        </div>
      </div>

      <style>
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        button[type=submit]:hover:not(:disabled) { transform: translateY(-1px) !important; box-shadow: 0 8px 24px rgba(208,71,174,0.5) !important; }
        .demo-cred-btn:hover { background: #FDF2FB !important; border-color: #E068C4 !important; }
        input[type=email]:focus, input[type=password]:focus, input[type=text]:focus { border-color: #E068C4 !important; box-shadow: 0 0 0 3px rgba(224,104,196,0.15) !important; background: white !important; }
      </style>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = 'password';
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  demoCreds = [
    { role: 'CH', email: 'ch@ofi.com' },
    { role: 'SH', email: 'sh@ofi.com' },
    { role: 'CSH', email: 'csh@ofi.com' },
    { role: 'GL', email: 'gl@ofi.com' },
    { role: 'PC', email: 'pc@ofi.com' },
    { role: 'FC', email: 'fc@ofi.com' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  fillDemo(email: string): void {
    this.email = email;
    this.password = 'password';
    this.errorMessage.set('');
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message ?? 'Login failed. Please try again.');
      }
    });
  }
}
