import { Component, signal, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div [style]="'display:flex;min-height:100vh;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;background:var(--surface);transition:background 0.3s ease;'">
      <!-- Mobile overlay -->
      @if (isMobile() && sidebarExpanded()) {
        <div
          (click)="sidebarExpanded.set(false)"
          style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:150;transition:opacity 0.3s;"
        ></div>
      }
      <app-sidebar
        [expanded]="sidebarExpanded()"
        [class.mobile-sidebar]="isMobile()"
        [class.mobile-sidebar-open]="isMobile() && sidebarExpanded()"
        (toggleSidebar)="sidebarExpanded.set(!sidebarExpanded())"
      ></app-sidebar>
      <div style="flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden;">
        <app-header
          [title]="pageTitle()"
          (toggleSidebar)="sidebarExpanded.set(!sidebarExpanded())"
        ></app-header>
        <main class="ofi-main-content" style="flex: 1; overflow-y: auto; padding: 24px; box-sizing: border-box;">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <style>
      .mobile-sidebar {
        position: fixed !important;
        left: -260px !important;
        transition: left 0.3s cubic-bezier(0.4,0,0.2,1) !important;
        z-index: 200 !important;
        width: 240px !important;
      }
      .mobile-sidebar-open {
        left: 0 !important;
      }
    </style>
  `
})
export class LayoutComponent {
  private theme = inject(ThemeService);
  sidebarExpanded = signal(true);
  isMobile = signal(false);
  pageTitle = signal('Dashboard');

  constructor() {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
    this.isMobile.set(mobile);
    if (mobile && this.sidebarExpanded()) {
      this.sidebarExpanded.set(false);
    }
  }
}
