import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROLE_LABELS } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="animation:pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);color:var(--text);">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background:linear-gradient(135deg,#1F2937 0%,#374151 50%,#4B5563 100%);
        border-radius:24px;padding:32px 36px;margin-bottom:28px;
        position:relative;overflow:hidden;
        box-shadow:0 12px 40px rgba(31,41,55,0.35);
      ">
        <div style="position:absolute;top:-50px;right:-30px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="padding:5px 14px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">Settings</span>
          </div>
          <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Preferences & Configuration</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.6);font-size:14px;">Customize your workspace appearance, profile, and display options</p>
        </div>
      </div>

      <!-- ── Settings Tabs ─────────────────────────────────────── -->
      <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;">
        @for (tab of tabs; track tab) {
          <button (click)="activeTab.set(tab)" [style]="tabStyle(tab)" class="settings-tab">
            {{ tab }}
          </button>
        }
      </div>

      <!-- ═══════════════════ Appearance Tab ═══════════════════ -->
      @if (activeTab() === 'Appearance') {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;">

          <!-- Theme Selector -->
          <div class="settings-card" style="
            background:var(--surface-card);border-radius:24px;padding:32px;
            box-shadow:var(--shadow-card);border:1px solid var(--border-light);
            transition:all 0.3s;animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) both;
          ">
            <h3 style="margin:0 0 8px;font-size:17px;font-weight:800;color:var(--text);">Theme Mode</h3>
            <p style="margin:0 0 24px;font-size:13px;color:var(--text-muted);">Choose between light and dark appearance</p>
            <div style="display:flex;gap:16px;">
              @for (theme of themes; track theme.name) {
                <div (click)="setTheme(theme.name)" class="theme-option" [style]="'flex:1;padding:20px;border-radius:16px;cursor:pointer;transition:all 0.3s;text-align:center;' +
                  'border:2px solid ' + (selectedTheme() === theme.name ? selectedAccent() : 'var(--border)') + ';' +
                  'background:' + theme.preview + ';' +
                  (selectedTheme() === theme.name ? 'box-shadow:0 0 0 4px ' + themeService.accentShadow() + ';transform:scale(1.03);' : '')">
                  <div [style]="'width:48px;height:48px;border-radius:14px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;' +
                    'background:' + theme.iconBg + ';box-shadow:0 4px 16px ' + theme.shadow + ';'">
                    <span [innerHTML]="theme.icon"></span>
                  </div>
                  <div [style]="'font-size:14px;font-weight:700;color:' + theme.textColor + ';'">{{ theme.name }}</div>
                  <div [style]="'font-size:11px;margin-top:4px;color:' + theme.subColor + ';'">{{ theme.desc }}</div>
                  @if (selectedTheme() === theme.name) {
                    <div style="margin-top:10px;">
                      <span [style]="'padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:' + selectedAccent() + ';color:white;'">Active</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Color Accent -->
          <div class="settings-card" style="
            background:var(--surface-card);border-radius:24px;padding:32px;
            box-shadow:var(--shadow-card);border:1px solid var(--border-light);
            transition:all 0.3s;animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) 0.1s both;
          ">
            <h3 style="margin:0 0 8px;font-size:17px;font-weight:800;color:var(--text);">Accent Color</h3>
            <p style="margin:0 0 24px;font-size:13px;color:var(--text-muted);">Personalize your workspace like Slack — pick a sidebar accent</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
              @for (color of accentColors; track color.name) {
                <div (click)="setAccent(color.value)" class="color-swatch" [style]="'width:48px;height:48px;border-radius:14px;cursor:pointer;transition:all 0.3s;' +
                  'background:' + color.value + ';box-shadow:0 4px 12px ' + color.shadow + ';' +
                  'display:flex;align-items:center;justify-content:center;' +
                  (selectedAccent() === color.value ? 'transform:scale(1.15);border:3px solid white;box-shadow:0 0 0 3px ' + color.value + ',0 8px 24px ' + color.shadow + ';' : 'border:2px solid transparent;')"
                  [title]="color.name">
                  @if (selectedAccent() === color.value) {
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                  }
                </div>
              }
            </div>
            <!-- Preview strip -->
            <div style="border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
              <div [style]="'height:48px;display:flex;align-items:center;padding:0 20px;gap:10px;background:' + selectedAccent()">
                <div style="width:24px;height:24px;border-radius:8px;background:rgba(255,255,255,0.2);"></div>
                <div style="flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.2);"></div>
                <div style="width:40px;height:8px;border-radius:4px;background:rgba(255,255,255,0.15);"></div>
              </div>
              <div style="height:60px;background:var(--surface);padding:12px 20px;display:flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;border-radius:8px;background:var(--border);"></div>
                <div style="flex:1;">
                  <div style="height:8px;width:60%;border-radius:4px;background:var(--border);margin-bottom:6px;"></div>
                  <div style="height:6px;width:40%;border-radius:4px;background:var(--border-light);"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ═══════════════════ Profile Tab ═══════════════════ -->
      @if (activeTab() === 'Profile') {
        <div class="settings-card" style="
          background:var(--surface-card);border-radius:24px;padding:32px;max-width:640px;
          box-shadow:var(--shadow-card);border:1px solid var(--border-light);
          animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) both;
        ">
          <div style="display:flex;align-items:center;gap:24px;margin-bottom:32px;flex-wrap:wrap;">
            <!-- Avatar -->
            <div style="position:relative;">
              <div [style]="'width:88px;height:88px;border-radius:22px;background:' + selectedAccent() + ';display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:white;box-shadow:0 8px 24px ' + themeService.accentShadow() + ';'">{{ initials() }}</div>
              <button style="
                position:absolute;bottom:-4px;right:-4px;
                width:32px;height:32px;border-radius:10px;
                background:var(--surface-card);border:2px solid var(--border);
                display:flex;align-items:center;justify-content:center;
                cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.1);
              " class="avatar-edit-btn">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--text-secondary)"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
              </button>
            </div>
            <div>
              <h3 style="margin:0;font-size:22px;font-weight:900;color:var(--text);">{{ user()?.fullName }}</h3>
              <p style="margin:4px 0 0;font-size:14px;color:var(--text-secondary);">{{ user()?.email }}</p>
              <span [style]="'display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:' + selectedAccent() + '18;color:' + selectedAccent() + ';border:1px solid ' + selectedAccent() + '40;'">
                {{ roleLabel() }}
              </span>
            </div>
          </div>

          <!-- Profile form -->
          <div style="display:flex;flex-direction:column;gap:20px;">
            <div>
              <label style="display:block;font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Full Name</label>
              <input type="text" [ngModel]="profileName()" (ngModelChange)="profileName.set($event)" class="settings-input"
                style="width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:15px;color:var(--text);background:var(--input-bg);outline:none;box-sizing:border-box;transition:border-color 0.2s;"/>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Email</label>
              <input type="email" [value]="user()?.email ?? ''" disabled
                style="width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:15px;color:var(--text-muted);background:var(--input-bg);outline:none;box-sizing:border-box;cursor:not-allowed;"/>
            </div>
            <div>
              <label style="display:block;font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">Region</label>
              <input type="text" [ngModel]="profileRegion()" (ngModelChange)="profileRegion.set($event)" class="settings-input"
                style="width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:12px;font-size:15px;color:var(--text);background:var(--input-bg);outline:none;box-sizing:border-box;transition:border-color 0.2s;"/>
            </div>
            <button (click)="saveProfile()" class="save-btn" [style]="'align-self:flex-start;padding:12px 28px;background:' + selectedAccent() + ';color:white;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px ' + themeService.accentShadow() + ';transition:all 0.2s;display:flex;align-items:center;gap:8px;'">
              @if (saving()) {
                <svg style="animation:spin 1s linear infinite;" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
                Saving...
              } @else if (saved()) {
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Saved!
              } @else {
                Save Changes
              }
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════ Notifications Tab ═══════════════════ -->
      @if (activeTab() === 'Notifications') {
        <div class="settings-card" style="
          background:var(--surface-card);border-radius:24px;padding:32px;max-width:640px;
          box-shadow:var(--shadow-card);border:1px solid var(--border-light);
          animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) both;
        ">
          <h3 style="margin:0 0 8px;font-size:17px;font-weight:800;color:var(--text);">Notification Preferences</h3>
          <p style="margin:0 0 28px;font-size:13px;color:var(--text-muted);">Manage how and when you receive alerts</p>
          <div style="display:flex;flex-direction:column;gap:16px;">
            @for (pref of notifPrefs; track pref.label) {
              <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:var(--surface);border-radius:14px;border:1px solid var(--border-light);transition:all 0.15s;" class="notif-row">
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--text);">{{ pref.label }}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">{{ pref.desc }}</div>
                </div>
                <!-- Toggle Switch -->
                <div (click)="pref.enabled = !pref.enabled" style="
                  width:48px;height:28px;border-radius:14px;cursor:pointer;transition:all 0.3s;position:relative;
                " [style.background]="pref.enabled ? selectedAccent() : '#6B7280'">
                  <div style="
                    width:22px;height:22px;border-radius:50%;background:white;
                    position:absolute;top:3px;transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                    box-shadow:0 2px 6px rgba(0,0,0,0.15);
                  " [style.left]="pref.enabled ? '23px' : '3px'"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ═══════════════════ About Tab ═══════════════════ -->
      @if (activeTab() === 'About') {
        <div class="settings-card" style="
          background:var(--surface-card);border-radius:24px;padding:32px;max-width:640px;
          box-shadow:var(--shadow-card);border:1px solid var(--border-light);
          animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) both;
        ">
          <div style="text-align:center;margin-bottom:28px;">
            <div [style]="'display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;border-radius:22px;margin-bottom:16px;background:' + selectedAccent() + ';box-shadow:0 8px 24px ' + themeService.accentShadow() + ';'">
              <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" fill="white" fill-opacity="0.2"/>
                <path d="M10 26 L18 10 L26 26 M13 21 H23" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 style="margin:0;font-size:24px;font-weight:900;color:var(--text);">Corvay Reporting</h2>
            <p style="margin:6px 0 0;font-size:14px;color:var(--text-secondary);">Organizational Reporting System</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            @for (item of aboutItems; track item.label) {
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border-radius:12px;border:1px solid var(--border-light);">
                <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">{{ item.label }}</span>
                <span style="font-size:13px;color:var(--text-muted);">{{ item.value }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes cardFloat3D { from { opacity:0; transform:translateY(30px) rotateX(8deg); } to { opacity:1; transform:translateY(0) rotateX(0); } }
      @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      .settings-card:hover { box-shadow:var(--shadow-lg) !important; }
      .settings-tab:hover { transform:translateY(-1px); }
      .theme-option:hover { transform:scale(1.03) !important; }
      .color-swatch:hover { transform:scale(1.15) !important; }
      .settings-input:focus { border-color:var(--primary) !important; background:var(--surface-card) !important; }
      .save-btn:hover:not(:disabled) { transform:translateY(-2px); filter:brightness(1.1); }
      .avatar-edit-btn:hover { background:var(--surface-hover) !important; border-color:var(--border) !important; }
      .notif-row:hover { background:var(--surface-hover) !important; border-color:var(--border) !important; }
    </style>
  `
})
export class SettingsComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService);

  user = this.authService.currentUser;
  role = this.authService.currentRole;
  roleLabel = computed(() => {
    const r = this.role(); return r ? ROLE_LABELS[r] : '';
  });
  initials = computed(() => {
    const name = this.user()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  tabs = ['Appearance', 'Profile', 'Notifications', 'About'];
  activeTab = signal('Appearance');
  selectedTheme = this.themeService.themeMode;
  selectedAccent = this.themeService.accent;
  profileName = signal('');
  profileRegion = signal('');
  saving = signal(false);
  saved = signal(false);

  themes = [
    { name: 'Light', preview: 'linear-gradient(135deg,#FFFFFF,#F8FAFC)', iconBg: '#FDF2FB',
      icon: '<svg width="24" height="24" viewBox="0 0 20 20" fill="#F59E0B"><circle cx="10" cy="10" r="4"/><path d="M10 1v2M10 17v2M1 10h2M17 10h2M4.222 4.222l1.414 1.414M14.364 14.364l1.414 1.414M4.222 15.778l1.414-1.414M14.364 5.636l1.414-1.414" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/></svg>',
      shadow: 'rgba(245,158,11,0.2)', textColor: '#1A1A1A', subColor: '#9CA3AF', desc: 'Clean & bright' },
    { name: 'Dark', preview: 'linear-gradient(135deg,#1F2937,#111827)', iconBg: '#374151',
      icon: '<svg width="24" height="24" viewBox="0 0 20 20" fill="#A78BFA"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>',
      shadow: 'rgba(167,139,250,0.2)', textColor: '#F9FAFB', subColor: '#9CA3AF', desc: 'Easy on eyes' },
    { name: 'System', preview: 'linear-gradient(135deg,#FFFFFF 50%,#1F2937 50%)', iconBg: '#E0F2FE',
      icon: '<svg width="24" height="24" viewBox="0 0 20 20" fill="#0EA5E9"><path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"/></svg>',
      shadow: 'rgba(14,165,233,0.2)', textColor: '#1A1A1A', subColor: '#9CA3AF', desc: 'Match OS setting' },
  ];

  accentColors = [
    { name: 'Corvay Pink', value: '#D047AE', shadow: 'rgba(208,71,174,0.3)' },
    { name: 'Emerald', value: '#059669', shadow: 'rgba(5,150,105,0.3)' },
    { name: 'Forest Green', value: '#2F7D32', shadow: 'rgba(47,125,50,0.3)' },
    { name: 'Sky Blue', value: '#0284C7', shadow: 'rgba(2,132,199,0.3)' },
    { name: 'Violet', value: '#7C3AED', shadow: 'rgba(124,58,237,0.3)' },
    { name: 'Rose', value: '#E11D48', shadow: 'rgba(225,29,72,0.3)' },
    { name: 'Amber', value: '#D97706', shadow: 'rgba(217,119,6,0.3)' },
    { name: 'Indigo', value: '#4F46E5', shadow: 'rgba(79,70,229,0.3)' },
  ];

  notifPrefs = [
    { label: 'Approval Alerts', desc: 'Notify when a report is approved or rejected', enabled: true },
    { label: 'New Submissions', desc: 'Notify when a subordinate submits a report', enabled: true },
    { label: 'Weekly Summary', desc: 'Get a digest of activity every Monday', enabled: false },
    { label: 'System Updates', desc: 'Announcements about new features', enabled: true },
    { label: 'Email Notifications', desc: 'Receive notifications via email', enabled: false },
  ];

  aboutItems = [
    { label: 'Version', value: '1.0.0' },
    { label: 'Framework', value: 'Angular 20' },
    { label: 'License', value: 'Enterprise' },
    { label: 'Support', value: 'support@ofi.com' },
    { label: 'Last Updated', value: 'March 25, 2026' },
  ];

  constructor() {
    const u = this.user();
    this.profileName.set(u?.fullName ?? '');
    this.profileRegion.set(u?.region ?? '');
  }

  saveProfile(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    }, 1000);
  }

  setAccent(color: string): void {
    this.themeService.setAccent(color);
  }

  setTheme(name: string): void {
    this.themeService.setTheme(name as 'Light' | 'Dark' | 'System');
  }

  tabStyle(tab: string): string {
    const active = this.activeTab() === tab;
    const accent = this.selectedAccent();
    return `
      padding:10px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;
      transition:all 0.25s cubic-bezier(0.4,0,0.2,1);border:1.5px solid ${active ? accent : '#E5E7EB'};
      background:${active ? accent : 'white'};
      color:${active ? 'white' : '#6B7280'};
      ${active ? 'box-shadow:0 4px 16px ' + this.themeService.accentShadow() + ';' : ''}
    `;
  }
}
