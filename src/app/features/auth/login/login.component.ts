import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="
      min-height: 100vh;
      background: #821E75;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative; overflow: hidden;
    ">
      <!-- Layered radial gradient mesh -->
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 65% at 12% 50%,#B82EA8 0%,transparent 55%),radial-gradient(ellipse 55% 65% at 88% 15%,#9A1E8A 0%,transparent 50%),radial-gradient(ellipse 55% 60% at 55% 95%,#C040B0 0%,transparent 52%);pointer-events:none;"></div>

      <!-- Dot-grid overlay -->
      <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.22) 1px,transparent 1px);background-size:38px 38px;pointer-events:none;"></div>

      <!-- Decorative rings — top-right -->
      <div style="position:absolute;top:-180px;right:-180px;width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.2);pointer-events:none;"></div>
      <div style="position:absolute;top:-100px;right:-100px;width:360px;height:360px;border-radius:50%;border:1px solid rgba(255,255,255,0.14);pointer-events:none;"></div>
      <!-- Decorative rings — bottom-left -->
      <div style="position:absolute;bottom:-200px;left:-200px;width:560px;height:560px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.16);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-120px;left:-120px;width:380px;height:380px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);pointer-events:none;"></div>

      <!-- Floating glow orbs -->
      <div style="position:absolute;top:-70px;left:6%;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(220,100,200,0.55) 0%,transparent 68%);animation:floatOrb 9s ease-in-out infinite;pointer-events:none;"></div>
      <div style="position:absolute;bottom:4%;right:8%;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(200,60,180,0.5) 0%,transparent 68%);animation:floatOrb 7s ease-in-out infinite reverse;pointer-events:none;"></div>
      <div style="position:absolute;top:38%;left:62%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(240,120,220,0.45) 0%,transparent 68%);animation:floatOrb 11s ease-in-out infinite;animation-delay:-4s;pointer-events:none;"></div>
      <div style="position:absolute;top:15%;right:30%;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(255,200,245,0.35) 0%,transparent 70%);animation:floatOrb 13s ease-in-out infinite reverse;animation-delay:-2s;pointer-events:none;"></div>

      <!-- Diagonal light streak -->
      <div style="position:absolute;top:0;left:45%;width:1.5px;height:100%;background:linear-gradient(180deg,transparent 0%,rgba(255,200,240,0.25) 40%,rgba(255,200,240,0.15) 60%,transparent 100%);transform:rotate(22deg);transform-origin:top center;pointer-events:none;"></div>
      <div style="position:absolute;top:0;left:55%;width:1px;height:100%;background:linear-gradient(180deg,transparent 0%,rgba(255,220,248,0.18) 50%,transparent 100%);transform:rotate(-18deg);transform-origin:top center;pointer-events:none;"></div>

      <!-- Small sparkle dots -->
      <div style="position:absolute;top:18%;left:22%;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.75);animation:sparkle 3s ease-in-out infinite;"></div>
      <div style="position:absolute;top:72%;left:78%;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.7);animation:sparkle 4s ease-in-out infinite;animation-delay:-1.5s;"></div>
      <div style="position:absolute;top:45%;left:88%;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.6);animation:sparkle 5s ease-in-out infinite;animation-delay:-0.8s;"></div>
      <div style="position:absolute;top:85%;left:15%;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.65);animation:sparkle 3.5s ease-in-out infinite;animation-delay:-2s;"></div>

      <!-- Login Card -->
      <div style="
        background: rgba(255,255,255,0.967);
        border-radius: 28px;
        padding: 52px 46px;
        width: 100%; max-width: 432px;
        box-shadow: 0 48px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.8);
        position: relative; z-index: 1;
        animation: slideUp 0.65s cubic-bezier(0.22,1,0.36,1);
      ">
        <!-- Corvay Logo -->
        <div style="text-align:center;margin-bottom:36px;">
          <div style="margin-bottom:20px;">
            <img src="https://corvaytechnologies.com/corvay-logo.jpg" alt="Corvay Technologies" style="width:130px;height:58px;object-fit:contain;mix-blend-mode:multiply;" />
          </div>
          <h1 style="margin:0;font-size:25px;font-weight:800;color:#1A1A1A;letter-spacing:-0.4px;">Welcome back</h1>
          <p style="margin:7px 0 0;color:#6B7280;font-size:13.5px;">Sign in to Corvay Reporting System</p>
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
              background: linear-gradient(135deg, #821E75, #9A248A);
              color: white; border: none; border-radius: 12px;
              font-size: 15px; font-weight: 700; cursor: pointer;
              box-shadow: 0 4px 18px rgba(130,30,117,0.45);
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

        <p style="text-align:center;margin-top:24px;font-size:13px;color:#6B7280;">
          Don't have an account?
          <a routerLink="/auth/register" style="color:#821E75;font-weight:700;text-decoration:none;margin-left:4px;">Create Account</a>
        </p>

        <p style="text-align:center;margin-top:12px;font-size:13px;color:#6B7280;">
          Want to submit a report?
          <a routerLink="/submit-report" style="color:#821E75;font-weight:700;text-decoration:none;margin-left:4px;">Submit Weekly Report</a>
        </p>

      </div>

      <style>
        @keyframes slideUp { from { opacity:0; transform:translateY(48px) scale(0.96); } to { opacity:1; transform:none; } }
        @keyframes floatOrb { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(22px,-28px) scale(1.05); } 66% { transform:translate(-16px,18px) scale(0.97); } }
        @keyframes sparkle { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.6); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        button[type=submit]:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 10px 30px rgba(130,30,117,0.5) !important; }
        input[type=email]:focus, input[type=password]:focus, input[type=text]:focus { border-color: #821E75 !important; box-shadow: 0 0 0 3px rgba(130,30,117,0.15) !important; background: white !important; }
      </style>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

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
