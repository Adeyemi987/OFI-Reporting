import { Component, Input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
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
      <div style="padding: 0 0 32px 0; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; display: flex; align-items: center;">
        <img src="https://corvaytechnologies.com/corvay-logo.jpg" alt="Corvay Technologies" style="width:88px;height:40px;object-fit:contain;" />
      </div>

      <!-- Navigation -->
      <nav style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
        @for (item of navItems; track item.label) {
          <a
            [routerLink]="item.link"
            routerLinkActive="active-nav"
            [routerLinkActiveOptions]="{ exact: item.exact }"
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

      <!-- User Card + Sign Out — bottom section -->
      <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">

        @if (expanded) {
          <!-- ── EXPANDED: user info card + full sign-out button ── -->
          <div style="animation: fadeIn 0.2s ease-out;">
            <!-- User info -->
            <div style="display:flex;align-items:center;gap:10px;padding:10px 10px 12px;background:rgba(0,0,0,0.15);border-radius:14px 14px 0 0;border:1px solid rgba(255,255,255,0.07);border-bottom:none;">
              <div style="width:36px;height:36px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.2);background:linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.12));">{{ userInitials() }}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ user()?.fullName }}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:1px;">{{ roleLabel() }}</div>
              </div>
            </div>
            <!-- Sign out button -->
            <button (click)="showLogoutConfirm.set(true)" class="sidebar-logout-btn" style="
              width:100%; padding:10px 14px; margin:0;
              background:linear-gradient(135deg, rgba(239,68,68,0.35), rgba(185,28,28,0.25));
              border:1px solid rgba(239,68,68,0.45); border-top:none;
              border-radius:0 0 14px 14px;
              color:#FCA5A5; font-size:13px; font-weight:700;
              cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
              transition:all 0.2s; letter-spacing:0.2px;
            ">
              <!-- Power (sign-out) icon -->
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>

        } @else {
          <!-- ── CONTRACTED: avatar + glowing red power button ── -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
            <!-- Avatar -->
            <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;box-shadow:0 4px 10px rgba(0,0,0,0.2);background:linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.12));">{{ userInitials() }}</div>
            <!-- Red glowing power / sign-out button -->
            <button
              (click)="showLogoutConfirm.set(true)"
              title="Sign Out"
              class="sidebar-logout-btn sidebar-logout-pulse"
              style="
                width:38px; height:38px; border-radius:50%; padding:0;
                background:rgba(239,68,68,0.22);
                border:1.5px solid rgba(239,68,68,0.55);
                color:#FCA5A5; cursor:pointer;
                display:flex; align-items:center; justify-content:center;
                box-shadow:0 0 0 0 rgba(239,68,68,0.4);
                transition:all 0.2s;
              "
            >
              <!-- Power symbol — universally = sign out -->
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="2" x2="12" y2="12"/>
                <path d="M7.2 5.8A8 8 0 1016.8 5.8"/>
              </svg>
            </button>
          </div>
        }

      </div>

      <style>
        .active-nav { background: rgba(255,255,255,0.18) !important; color: white !important; font-weight: 600 !important; }
        .nav-link:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
        .sidebar-logout-btn:hover { background: rgba(239,68,68,0.4) !important; border-color: rgba(239,68,68,0.7) !important; color: #FEE2E2 !important; }
        .sidebar-logout-pulse { animation: signOutPulse 2.8s ease-in-out infinite; }
        .sidebar-logout-pulse:hover { animation: none !important; box-shadow: 0 0 18px rgba(239,68,68,0.65) !important; transform: scale(1.08); }
        @keyframes signOutPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      </style>
    </aside>

    <!-- ── Sign Out Confirmation Modal ─────────────────────────── -->
    @if (showLogoutConfirm()) {
      <div
        style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;"
        (click)="showLogoutConfirm.set(false)"
      >
        <div
          style="background:white;border-radius:20px;padding:32px;width:100%;max-width:400px;box-shadow:0 24px 80px rgba(0,0,0,0.3);animation:fadeIn 0.2s ease-out;"
          (click)="$event.stopPropagation()"
        >
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:44px;height:44px;border-radius:12px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">Sign Out</h3>
              <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">{{ user()?.fullName }}</p>
            </div>
          </div>
          <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">Are you sure you want to sign out? You will need to log in again to access the dashboard.</p>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button
              (click)="showLogoutConfirm.set(false)"
              style="padding:10px 20px;border:1.5px solid #E5E7EB;border-radius:10px;background:white;color:#6B7280;font-size:14px;font-weight:600;cursor:pointer;"
            >Cancel</button>
            <button
              (click)="onLogout()"
              style="padding:10px 24px;border:none;border-radius:10px;background:#DC2626;color:white;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Yes, Sign Out
            </button>
          </div>
        </div>
      </div>
    }
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

  showLogoutConfirm = signal(false);

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
    { label: 'Dashboard', link: '/dashboard', exact: true, icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/></svg>' },
    { label: 'Reports', link: '/dashboard/reports', exact: false, icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/></svg>' },
    { label: 'Analytics', link: '/dashboard/analytics', exact: false, icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>' },
    { label: 'Settings', link: '/dashboard/settings', exact: false, icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>' },
  ];



  onNavLeave(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (!el.classList.contains('active-nav')) {
      el.style.background = 'transparent';
      el.style.color = 'rgba(255,255,255,0.7)';
    }
  }

  onLogout(): void {
    this.showLogoutConfirm.set(false);
    this.authService.logout();
  }
}
