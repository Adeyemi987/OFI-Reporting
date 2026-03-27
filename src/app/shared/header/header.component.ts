import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROLE_LABELS } from '../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header [style]="headerStyle()">
      <!-- Hamburger -->
      <button
        (click)="toggleSidebar.emit()"
        class="ofi-icon-btn"
        [style]="'width:38px;height:38px;border-radius:10px;background:var(--border-light);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;'"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" [attr.fill]="iconColor()">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
        </svg>
      </button>

      <!-- Breadcrumb area -->
      <div style="flex: 1;">
        <div style="font-size:18px;font-weight:800;color:var(--text);letter-spacing:-0.3px;">{{ title }}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:1px;">
          {{ roleLabel() }} &nbsp;·&nbsp; {{ currentDate }}
        </div>
      </div>

      <!-- Role badge -->
      <div [style]="roleBadgeStyle()">{{ role() }}</div>

      <!-- Notification bell -->
      <button class="ofi-icon-btn" [style]="'position:relative;width:38px;height:38px;background:var(--border-light);border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;'">
        <svg width="18" height="18" viewBox="0 0 20 20" [attr.fill]="iconColor()">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
        @if (notifCount > 0) {
          <span style="
            position: absolute; top: 6px; right: 6px;
            width: 8px; height: 8px;
            background: #EF4444; border-radius: 50%;
            border: 1.5px solid white;
          "></span>
        }
      </button>

      <!-- Avatar -->
      <div [style]="avatarStyle()">{{ initials() }}</div>
      <style>.ofi-icon-btn:hover { background: var(--border) !important; }</style>
    </header>
  `
})
export class HeaderComponent {
  @Input() title = 'Dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();

  notifCount = 3;
  currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  role = this.authService.currentRole;
  roleLabel = computed(() => {
    const r = this.authService.currentRole();
    return r ? ROLE_LABELS[r] : '';
  });
  initials = computed(() => {
    const name = this.authService.currentUser()?.fullName ?? '';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  });

  roleBadgeStyle = computed(() => {
    const accent = this.themeService.accent();
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    return `padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:0.5px;` +
      `background:rgba(${r},${g},${b},0.08);border:1px solid rgba(${r},${g},${b},0.25);color:${accent};`;
  });

  avatarStyle = computed(() => {
    const accent = this.themeService.accent();
    return `width:38px;height:38px;background:${accent};border-radius:10px;display:flex;align-items:center;justify-content:center;` +
      `font-size:14px;font-weight:800;color:white;cursor:pointer;box-shadow:0 2px 8px ${this.themeService.accentShadow()};`;
  });

  headerStyle = computed(() => {
    return `height:64px;background:var(--header-bg);border-bottom:1px solid var(--border);` +
      `display:flex;align-items:center;padding:0 24px;gap:16px;` +
      `box-shadow:var(--shadow-sm);position:sticky;top:0;z-index:50;transition:background 0.3s ease,border-color 0.3s ease;`;
  });

  iconColor = computed(() => this.themeService.isDark() ? '#D1D5DB' : '#374151');
}
