import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROLE_LABELS, UserRole } from '../../core/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside [style]="sidebarStyle">
      <!-- Logo -->
      <div style="padding: 0 0 32px 0; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 42px; height: 42px; flex-shrink: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1));
            border-radius: 12px; display: flex; align-items:center; justify-content:center;
            border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          ">
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
              <path d="M10 26 L18 10 L26 26 M13 21 H23" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          @if (expanded) {
            <div style="animation: fadeIn 0.2s ease-out;">
              <div style="font-size: 15px; font-weight: 800; color: white; letter-spacing: -0.3px;">OFI Reporting</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 1px;">{{ roleLabel() }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        @for (item of navItems; track item.label) {
          <a
            [routerLink]="item.link"
            routerLinkActive="active-nav"
            class="nav-link"
            style="
              display: flex; align-items: center; gap: 12px;
              padding: 11px 12px; border-radius: 10px; cursor: pointer;
              color: rgba(255,255,255,0.7); text-decoration: none;
              transition: all 0.2s; font-size: 14px; font-weight: 500;
              white-space: nowrap; overflow: hidden;
            "
            (mouseleave)="onNavLeave($event)"
          >
            <span style="flex-shrink: 0; font-size: 18px;" [innerHTML]="item.icon"></span>
            @if (expanded) {
              <span style="animation: fadeIn 0.2s ease-out;">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- User Card at bottom -->
      <div style="
        margin-top: auto; padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
      ">
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-radius: 10px; background: rgba(255,255,255,0.08);">
          <div [style]="'width:36px;height:36px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.2);background:linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.1));'">{{ userInitials() }}</div>
          @if (expanded) {
            <div style="min-width: 0; animation: fadeIn 0.2s ease-out;">
              <div style="font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ user()?.fullName }}
              </div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5);">{{ roleLabel() }}</div>
            </div>
          }
        </div>
        <button (click)="onLogout()" style="
          margin-top: 8px; width: 100%; padding: 9px;
          background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px; color: #FCA5A5; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; display: flex; align-items: center;
          justify-content: center; gap: 6px;
        "
class="sidebar-logout-btn"
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          @if (expanded) {
            <span style="animation: fadeIn 0.2s ease-out;">Sign Out</span>
          }
        </button>
      </div>

      <style>
        .active-nav { background: rgba(255,255,255,0.18) !important; color: white !important; font-weight: 600 !important; }
        .nav-link:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
        .sidebar-logout-btn:hover { background: rgba(239,68,68,0.25) !important; color: #FEE2E2 !important; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  @Input() expanded = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  user = this.authService.currentUser;
  roleLabel = computed(() => {
    const r = this.authService.currentRole();
    return r ? ROLE_LABELS[r] : '';
  });
  userInitials = computed(() => {
    const name = this.authService.currentUser()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  get sidebarStyle(): string {
    const w = this.expanded ? '240px' : '64px';
    const accent = this.themeService.accent();
    const dark = this.themeService.accentDark();
    return `
      width: ${w}; flex-shrink: 0;
      background: linear-gradient(160deg, ${dark} 0%, ${accent} 60%, ${dark} 100%);
      height: 100vh; position: sticky; top: 0;
      display: flex; flex-direction: column; padding: 24px 12px;
      box-shadow: 4px 0 24px rgba(0,0,0,0.15);
      transition: width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.4s ease;
      overflow: hidden; z-index: 100;
      box-sizing: border-box;
    `;
  }

  navItems = [
    { label: 'Dashboard', link: '/dashboard', icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>' },
    { label: 'Reports', link: '/dashboard/reports', icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>' },
    { label: 'Analytics', link: '/dashboard/analytics', icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>' },
    { label: 'Settings', link: '/dashboard/settings', icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>' },
  ];



  onNavLeave(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (!el.classList.contains('active-nav')) {
      el.style.background = 'transparent';
      el.style.color = 'rgba(255,255,255,0.7)';
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
