import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../core/tokens';
import { ROLE_LABELS, UserRole } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div style="
      min-height:100vh;
      background:#821E75;
      display:flex;align-items:center;justify-content:center;
      font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
      position:relative;overflow:hidden;padding:32px 16px;box-sizing:border-box;
    ">
      <!-- Background layer -->
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 65% at 12% 50%,#B82EA8 0%,transparent 55%),radial-gradient(ellipse 55% 65% at 88% 15%,#9A1E8A 0%,transparent 50%),radial-gradient(ellipse 55% 60% at 55% 95%,#C040B0 0%,transparent 52%);pointer-events:none;"></div>
      <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.22) 1px,transparent 1px);background-size:38px 38px;pointer-events:none;"></div>
      <div style="position:absolute;top:-180px;right:-180px;width:520px;height:520px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.18);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-200px;left:-200px;width:560px;height:560px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.14);pointer-events:none;"></div>
      <div style="position:absolute;top:-70px;left:6%;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(220,100,200,0.55) 0%,transparent 68%);animation:floatOrb 9s ease-in-out infinite;pointer-events:none;"></div>
      <div style="position:absolute;bottom:4%;right:8%;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(200,60,180,0.5) 0%,transparent 68%);animation:floatOrb 7s ease-in-out infinite reverse;pointer-events:none;"></div>
      <div style="position:absolute;top:38%;left:62%;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(240,120,220,0.4) 0%,transparent 68%);animation:floatOrb 11s ease-in-out infinite;animation-delay:-4s;pointer-events:none;"></div>
      <div style="position:absolute;top:18%;left:22%;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.75);animation:sparkle 3s ease-in-out infinite;"></div>
      <div style="position:absolute;top:72%;left:78%;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.7);animation:sparkle 4s ease-in-out infinite;animation-delay:-1.5s;"></div>
      <div style="position:absolute;top:45%;left:88%;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.6);animation:sparkle 5s ease-in-out infinite;animation-delay:-0.8s;"></div>

      <!-- Card -->
      <div style="
        background:rgba(255,255,255,0.97);
        border-radius:28px;
        padding:44px 40px;
        width:100%;max-width:520px;
        box-shadow:0 48px 120px rgba(0,0,0,0.55),0 0 0 1px rgba(255,255,255,0.14),inset 0 1px 0 rgba(255,255,255,0.8);
        position:relative;z-index:1;
        animation:slideUp 0.65s cubic-bezier(0.22,1,0.36,1);
      ">

        <!-- Logo + heading -->
        <div style="text-align:center;margin-bottom:32px;">
          <div style="
            display:inline-flex;align-items:center;justify-content:center;
            padding:14px 22px;
            background:linear-gradient(135deg,#6B1561 0%,#821E75 50%,#9A248A 100%);
            border-radius:18px;
            box-shadow:0 10px 40px rgba(130,30,117,0.45),inset 0 1px 0 rgba(255,255,255,0.15);
            margin-bottom:16px;
          ">
            <svg width="110" height="50" viewBox="0 0 100 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="19" r="17" stroke="white" stroke-width="3.5" fill="none"/>
              <circle cx="20" cy="13.5" r="5.8" fill="white"/>
              <path d="M7 31 C7 24 33 24 33 31" fill="white"/>
              <path d="M47.5 7 C48 3.5 50.5 1.5 54.5 1.5 C56.5 1.5 57.8 2.2 57.8 2.2 L57.8 5.5 C56.6 5 55.3 4.4 54 4.4 C51.6 4.4 50.8 5.8 50.8 7.5 L50.8 12.8 L57 12.8 L57 16 L50.8 16 L50.8 38.5 L47.5 38.5 Z" fill="white"/>
              <circle cx="66" cy="5" r="3.5" fill="white"/>
              <rect x="62.5" y="12.5" width="7" height="26" rx="0.5" fill="white"/>
              <text x="1" y="46" font-family="Georgia,'Times New Roman',Times,serif" font-style="italic" font-size="11" fill="rgba(255,255,255,0.88)" letter-spacing="0.9">make it real</text>
            </svg>
          </div>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#1A1A1A;letter-spacing:-0.4px;">Create your account</h1>
          <p style="margin:6px 0 0;color:#6B7280;font-size:13px;">Fill in your details to register on OFI Reporting</p>
        </div>

        <!-- API error banner -->
        @if (errorMsg()) {
          <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:12px 14px;margin-bottom:20px;display:flex;gap:8px;align-items:flex-start;animation:shake 0.4s ease-out;">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="#DC2626" style="flex-shrink:0;margin-top:1px;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            <span style="font-size:13px;color:#DC2626;">{{ errorMsg() }}</span>
          </div>
        }

        <form (ngSubmit)="register()">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

            <!-- Email (full width) -->
            <div style="grid-column:1/-1;">
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Email Address <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <input type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="reg-email" placeholder="you@ofi.com" autocomplete="email"
                  class="reg-input"
                  [class.reg-input--error]="touched.email && !isEmailValid()"
                  [class.reg-input--ok]="touched.email && isEmailValid()"
                  (blur)="touch('email')"
                  style="width:100%;padding:11px 16px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;"/>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                @if (touched.email && isEmailValid()) {
                  <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);" width="15" height="15" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                }
              </div>
              @if (touched.email && !isEmailValid()) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Please enter a valid email address.</p>
              }
            </div>

            <!-- Full Name (full width) -->
            <div style="grid-column:1/-1;">
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Full Name <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <input type="text" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" name="reg-fullname" placeholder="e.g. John Adeyemi" autocomplete="name"
                  class="reg-input"
                  [class.reg-input--error]="touched.fullName && fullName().trim().length < 2"
                  [class.reg-input--ok]="touched.fullName && fullName().trim().length >= 2"
                  (blur)="touch('fullName')"
                  style="width:100%;padding:11px 16px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;"/>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
                @if (touched.fullName && fullName().trim().length >= 2) {
                  <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);" width="15" height="15" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                }
              </div>
              @if (touched.fullName && fullName().trim().length < 2) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Full name must be at least 2 characters.</p>
              }
            </div>

            <!-- Employee ID -->
            <div>
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Employee ID <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <input type="text" [ngModel]="employeeId()" (ngModelChange)="employeeId.set($event)" name="reg-empid" placeholder="OFI-2024-001"
                  class="reg-input"
                  [class.reg-input--error]="touched.employeeId && !employeeId().trim()"
                  [class.reg-input--ok]="touched.employeeId && !!employeeId().trim()"
                  (blur)="touch('employeeId')"
                  style="width:100%;padding:11px 16px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;"/>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/></svg>
                @if (touched.employeeId && !!employeeId().trim()) {
                  <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);" width="15" height="15" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                }
              </div>
              @if (touched.employeeId && !employeeId().trim()) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Employee ID is required.</p>
              }
            </div>

            <!-- Role -->
            <div>
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Role <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <select [ngModel]="selectedRole()" (ngModelChange)="selectedRole.set($event)" name="reg-role"
                  class="reg-input"
                  [class.reg-input--error]="touched.role && !selectedRole()"
                  [class.reg-input--ok]="touched.role && !!selectedRole()"
                  (blur)="touch('role')"
                  style="width:100%;padding:11px 36px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s;appearance:none;-webkit-appearance:none;cursor:pointer;">
                  <option value="" disabled>Select role…</option>
                  @for (r of roleOptions; track r.value) {
                    <option [value]="r.value">{{ r.label }}</option>
                  }
                </select>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="13" height="13" viewBox="0 0 20 20" fill="#6B7280"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </div>
              @if (touched.role && !selectedRole()) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Please select a role.</p>
              }
            </div>

            <!-- Supervisor dropdown (full width) -->
            <div style="grid-column:1/-1;">
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Supervisor <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <select [ngModel]="supervisorId()" (ngModelChange)="supervisorId.set($event)" name="reg-supid"
                  class="reg-input"
                  [attr.disabled]="(!selectedRole() || supervisorsLoading()) ? '' : null"
                  [class.reg-input--error]="touched.supervisorId && !supervisorId()"
                  [class.reg-input--ok]="touched.supervisorId && !!supervisorId()"
                  (blur)="touch('supervisorId')"
                  style="width:100%;padding:11px 36px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s;appearance:none;-webkit-appearance:none;"
                  [style.opacity]="!selectedRole() ? '0.55' : '1'"
                  [style.cursor]="!selectedRole() || supervisorsLoading() ? 'not-allowed' : 'pointer'">
                  @if (!selectedRole()) {
                    <option value="" disabled selected>Select a role first…</option>
                  } @else if (supervisorsLoading()) {
                    <option value="" disabled selected>Loading supervisors…</option>
                  } @else if (!supervisors().length) {
                    <option value="" disabled selected>No supervisors found for this role</option>
                  } @else {
                    <option value="" disabled>Select your supervisor…</option>
                    @for (s of supervisors(); track s.id) {
                      <option [value]="s.id">{{ s.fullName }}</option>
                    }
                  }
                </select>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
                @if (supervisorsLoading()) {
                  <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);animation:spin 1s linear infinite;pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#E5E7EB" stroke-width="3"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="#821E75" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                } @else if (touched.supervisorId && !!supervisorId()) {
                  <svg style="position:absolute;right:28px;top:50%;transform:translateY(-50%);pointer-events:none;" width="15" height="15" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                } @else {
                  <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="13" height="13" viewBox="0 0 20 20" fill="#6B7280"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                }
              </div>
              @if (touched.supervisorId && !supervisorId()) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Please select a supervisor.</p>
              }
            </div>

            <!-- Password (full width) -->
            <div style="grid-column:1/-1;">
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Password <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <input [type]="showPw() ? 'text' : 'password'" [ngModel]="password()" (ngModelChange)="password.set($event)" name="reg-password"
                  placeholder="Create a strong password" autocomplete="new-password"
                  class="reg-input"
                  [class.reg-input--error]="touched.password && !pwValid()"
                  [class.reg-input--ok]="touched.password && pwValid()"
                  (blur)="touch('password')"
                  style="width:100%;padding:11px 44px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;"/>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <button type="button" (click)="showPw.set(!showPw())" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:2px;color:#9CA3AF;line-height:0;">
                  @if (showPw()) {
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.74L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                  }
                </button>
              </div>

              <!-- Strength bar -->
              @if (password()) {
                <div style="margin-top:8px;">
                  <div style="display:flex;gap:3px;margin-bottom:5px;">
                    @for (seg of [1,2,3,4,5]; track seg) {
                      <div style="flex:1;height:4px;border-radius:4px;transition:background 0.3s;" [style.background]="seg <= pwStrength() ? pwStrengthColor() : '#E5E7EB'"></div>
                    }
                  </div>
                  <div style="font-size:11px;font-weight:700;" [style.color]="pwStrengthColor()">{{ pwStrengthLabel() }}</div>
                </div>
              }

              <!-- Criteria chips -->
              @if (password() && !pwValid()) {
                <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
                  @for (c of pwCriteriaList(); track c.label) {
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;transition:all 0.2s;"
                      [style.background]="c.met ? '#F0FDF4' : '#FEF2F2'"
                      [style.color]="c.met ? '#16A34A' : '#DC2626'"
                      [style.border]="'1px solid ' + (c.met ? '#BBF7D0' : '#FECACA')">
                      @if (c.met) {
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                      } @else {
                        <svg width="10" height="10" viewBox="0 0 20 20" fill="#DC2626"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                      }
                      {{ c.label }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- Confirm Password (full width) -->
            <div style="grid-column:1/-1;">
              <label style="display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:6px;">Confirm Password <span style="color:#DC2626;">*</span></label>
              <div style="position:relative;">
                <input [type]="showConfirmPw() ? 'text' : 'password'" [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" name="reg-confirm"
                  placeholder="Re-enter your password" autocomplete="new-password"
                  class="reg-input"
                  [class.reg-input--error]="touched.confirmPassword && confirmPassword() !== password()"
                  [class.reg-input--ok]="touched.confirmPassword && !!confirmPassword() && confirmPassword() === password()"
                  (blur)="touch('confirmPassword')"
                  style="width:100%;padding:11px 44px 11px 40px;border:1.5px solid #E5E7EB;border-radius:12px;font-size:14px;color:#1A1A1A;background:#F9FAFB;outline:none;box-sizing:border-box;transition:border-color 0.2s,box-shadow 0.2s;"/>
                <svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                <button type="button" (click)="showConfirmPw.set(!showConfirmPw())" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:2px;color:#9CA3AF;line-height:0;">
                  @if (showConfirmPw()) {
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.74L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
                  }
                </button>
              </div>
              @if (touched.confirmPassword && confirmPassword() !== password()) {
                <p style="margin:4px 0 0;font-size:11.5px;color:#EF4444;">Passwords do not match.</p>
              }
            </div>

          </div><!-- /grid -->

          <!-- Progress bar -->
          <div style="margin-top:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:11.5px;color:#9CA3AF;font-weight:500;">Form completion</span>
              <span style="font-size:11.5px;font-weight:700;" [style.color]="completionColor()">{{ completionPct() }}%</span>
            </div>
            <div style="height:5px;background:#F3F4F6;border-radius:4px;overflow:hidden;">
              <div style="height:100%;border-radius:4px;transition:width 0.4s ease,background 0.4s ease;"
                [style.width]="completionPct() + '%'"
                [style.background]="completionColor()">
              </div>
            </div>
          </div>

          <!-- Submit button -->
          <button type="submit" [disabled]="!canRegister() || loading()"
            style="margin-top:20px;width:100%;padding:13px;border:none;border-radius:12px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.25s;"
            [style.background]="canRegister() && !loading() ? 'linear-gradient(135deg,#6B1561,#9A248A)' : '#E5E7EB'"
            [style.color]="canRegister() && !loading() ? 'white' : '#9CA3AF'"
            [style.boxShadow]="canRegister() && !loading() ? '0 4px 18px rgba(130,30,117,0.4)' : 'none'"
            [style.cursor]="!canRegister() || loading() ? 'not-allowed' : 'pointer'"
            class="reg-submit">
            @if (loading()) {
              <svg style="animation:spin 1s linear infinite;" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
              </svg>
              Creating account...
            } @else if (!canRegister()) {
              <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
              Complete all fields to register
            } @else {
              <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              Create Account
            }
          </button>
        </form>

        <p style="text-align:center;margin-top:20px;font-size:13px;color:#6B7280;">
          Already have an account?
          <a routerLink="/auth/login" style="color:#821E75;font-weight:700;text-decoration:none;margin-left:4px;">Sign In</a>
        </p>

      </div><!-- /card -->

      <style>
        @keyframes slideUp { from { opacity:0;transform:translateY(48px) scale(0.96); } to { opacity:1;transform:none; } }
        @keyframes floatOrb { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(22px,-28px) scale(1.05); } 66% { transform:translate(-16px,18px) scale(0.97); } }
        @keyframes sparkle { 0%,100% { opacity:0.4;transform:scale(1); } 50% { opacity:1;transform:scale(1.6); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-6px); } 75% { transform:translateX(6px); } }
        .reg-input:focus { border-color:#821E75 !important;box-shadow:0 0 0 3px rgba(130,30,117,0.12) !important;background:white !important; }
        .reg-input--error { border-color:#EF4444 !important; }
        .reg-input--ok { border-color:#16A34A !important; }
        .reg-submit:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 28px rgba(130,30,117,0.5) !important; }
      </style>
    </div>
  `
})
export class RegisterComponent {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  email = signal('');
  fullName = signal('');
  employeeId = signal('');
  selectedRole = signal('');
  supervisorId = signal('');
  password = signal('');
  confirmPassword = signal('');

  loading = signal(false);
  errorMsg = signal('');
  showPw = signal(false);
  showConfirmPw = signal(false);

  supervisors = signal<{ id: string; fullName: string }[]>([]);
  supervisorsLoading = signal(false);

  private readonly _supervisorEffect = effect(() => {
    const role = this.selectedRole();
    this.supervisorId.set('');
    this.supervisors.set([]);
    if (!role) return;
    const roleEnum = RegisterComponent.ROLE_ENUM[role] ?? 6;
    const supervisorRoleEnum = Math.max(0, roleEnum - 1);
    this.supervisorsLoading.set(true);
    this.http.get<{ success: boolean; data: { items: { id: string; fullName: string }[] } }>(
      `${this.baseUrl}/api/Users`,
      { params: { Role: supervisorRoleEnum.toString(), PageNumber: '1', PageSize: '100' } }
    ).subscribe({
      next: (res) => {
        this.supervisors.set(res?.data?.items ?? []);
        this.supervisorsLoading.set(false);
      },
      error: () => {
        this.supervisors.set([]);
        this.supervisorsLoading.set(false);
      },
    });
  }, { allowSignalWrites: true });

  touched = {
    email: false, fullName: false, employeeId: false,
    role: false, supervisorId: false, password: false, confirmPassword: false,
  };
  touch(field: string): void { this.touched[field as keyof typeof this.touched] = true; }

  roleOptions = (Object.keys(ROLE_LABELS) as UserRole[])
    .filter(r => r !== 'FO')
    .map(r => ({
      value: r,
      label: `${ROLE_LABELS[r]} (${r})`,
    }));

  pwCriteria = computed(() => {
    const p = this.password();
    return {
      minLength: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
      special: /[^A-Za-z0-9]/.test(p),
    };
  });

  pwValid = computed(() => {
    const c = this.pwCriteria();
    return c.minLength && c.upper && c.lower && c.number && c.special;
  });

  pwStrength = computed(() => Object.values(this.pwCriteria()).filter(Boolean).length);

  pwStrengthColor = computed(() => {
    const s = this.pwStrength();
    if (s <= 1) return '#EF4444';
    if (s === 2) return '#F97316';
    if (s === 3) return '#EAB308';
    if (s === 4) return '#84CC16';
    return '#16A34A';
  });

  pwStrengthLabel = computed(() =>
    ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][this.pwStrength()] ?? ''
  );

  pwCriteriaList = computed(() => [
    { label: '8+ characters',      met: this.pwCriteria().minLength },
    { label: 'Uppercase (A-Z)',     met: this.pwCriteria().upper },
    { label: 'Lowercase (a-z)',     met: this.pwCriteria().lower },
    { label: 'Number (0-9)',        met: this.pwCriteria().number },
    { label: 'Special char (!@#)', met: this.pwCriteria().special },
  ]);

  isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email().trim());
  }

  completionPct = computed(() => {
    const checks = [
      this.isEmailValid(),
      this.fullName().trim().length >= 2,
      !!this.employeeId().trim(),
      !!this.selectedRole(),
      !!this.supervisorId(),
      this.pwValid() && !!this.confirmPassword() && this.confirmPassword() === this.password(),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  completionColor = computed(() => {
    const p = this.completionPct();
    if (p < 34) return '#EF4444';
    if (p < 67) return '#F97316';
    if (p < 100) return '#EAB308';
    return '#16A34A';
  });

  canRegister = computed(() =>
    this.isEmailValid() &&
    this.fullName().trim().length >= 2 &&
    !!this.employeeId().trim() &&
    !!this.selectedRole() &&
    !!this.supervisorId() &&
    this.pwValid() &&
    !!this.confirmPassword() &&
    this.confirmPassword() === this.password()
  );

  private static readonly ROLE_ENUM: Record<string, number> = {
    CH: 0, SH: 1, CSH: 2, GL: 3, PC: 4, FC: 5, FO: 6,
  };

  register(): void {
    (Object.keys(this.touched) as (keyof typeof this.touched)[]).forEach(k => (this.touched[k] = true));
    if (!this.canRegister()) return;
    this.loading.set(true);
    this.errorMsg.set('');
    this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/api/Auth/register`,
      {
        employeeId: this.employeeId().trim(),
        fullName: this.fullName().trim(),
        email: this.email().trim(),
        password: this.password(),
        role: RegisterComponent.ROLE_ENUM[this.selectedRole()] ?? 6,
        supervisorId: this.supervisorId().trim(),
      }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.show(
            'Account Created!',
            'Your account was created successfully. Signing you in…',
            'success'
          );
          this.authService.login({ email: this.email().trim(), password: this.password() }).subscribe({
            next: () => {
              this.loading.set(false);
              this.router.navigate(['/dashboard']);
            },
            error: () => {
              // Registration succeeded but auto-login failed — send to login page
              this.loading.set(false);
              this.toast.show(
                'Sign-in Failed',
                'Account created, but we could not sign you in automatically. Please log in.',
                'warning'
              );
              this.router.navigate(['/auth/login'], { queryParams: { registered: '1' } });
            },
          });
        } else {
          this.loading.set(false);
          const msg = res.message ?? 'Registration failed. Please try again.';
          this.errorMsg.set(msg);
          this.toast.show('Registration Failed', msg, 'error');
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Registration failed. Please try again.';
        this.errorMsg.set(msg);
        this.toast.show('Registration Failed', msg, 'error');
      },
    });
  }
}
