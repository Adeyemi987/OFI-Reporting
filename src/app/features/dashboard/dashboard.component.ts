import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardSummary, SubordinateReport, UserRole,
  ROLE_LABELS, ROLE_SUBORDINATE, ROLE_HIERARCHY, DownloadOptions
} from '../../core/models';
import { RouterLink } from '@angular/router';
import { StatusLabelPipe, NumberShortPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusLabelPipe, NumberShortPipe],
  template: `
    <div style="
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1A1A1A; min-height: 100%;
      animation: pageIn 0.4s ease-out;
    ">

      <!-- ── Page Header ──────────────────────────────────────────── -->
      <div style="
        background: linear-gradient(135deg, #8B2D73 0%, #D047AE 50%, #D960BA 100%);
        border-radius: 20px; padding: 28px 32px; margin-bottom: 24px;
        position: relative; overflow: hidden;
        box-shadow: 0 8px 32px rgba(208,71,174,0.3);
      ">
        <!-- decorative circles -->
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
        <div style="position:absolute;bottom:-60px;right:80px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

        <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <div style="
                padding: 6px 14px; background: rgba(255,255,255,0.15);
                border: 1px solid rgba(255,255,255,0.25); border-radius: 30px;
                font-size: 12px; font-weight: 700; color: white; letter-spacing: 1px;
                text-transform: uppercase;
              ">{{ role() }}</div>
              <div style="color: rgba(255,255,255,0.7); font-size: 13px;">{{ roleLabel() }}</div>
            </div>
            <h1 style="margin:0;font-size:26px;font-weight:900;color:white;letter-spacing:-0.5px;">
              {{ roleLabel() }} Dashboard
            </h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">
              Aggregated reporting for {{ subordinateLabel() }} · Last updated {{ formattedDate() }}
            </p>
          </div>

          <!-- View Detailed Reports -->
          <a routerLink="reports" style="
            display:flex;align-items:center;gap:12px;
            padding:14px 26px;
            background:white;
            border:2px solid rgba(255,255,255,0.9);
            border-radius:14px;text-decoration:none;color:#8B2D73;
            cursor:pointer;transition:all 0.2s;flex-shrink:0;
            box-shadow:0 4px 20px rgba(0,0,0,0.18);
          " class="cta-reports">
            <div style="
              width:36px;height:36px;border-radius:10px;flex-shrink:0;
              background:linear-gradient(135deg,#8B2D73,#D047AE);
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 3px 10px rgba(139,45,115,0.4);
            ">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <div style="font-size:15px;font-weight:900;line-height:1.2;color:#7B1F63;letter-spacing:-0.2px;">View Detailed Reports</div>
              <div style="font-size:12px;font-weight:600;margin-top:3px;color:#C2389A;">See full task &amp; training breakdown for each {{ subordinateLabel() }}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#D047AE" style="margin-left:6px;flex-shrink:0;">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- ── KPI Cards ─────────────────────────────────────────────── -->
      @if (loading()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div style="
              background:white;border-radius:16px;padding:20px;
              animation:shimmer 1.5s infinite;
              background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);
              background-size:200% 100%; height:100px;
            "></div>
          }
        </div>
      } @else {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
          @for (card of kpiCards(); track card.label) {
            <div class="kpi-card" [style]="kpiCardStyle(card)">
              <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
                <div [style]="'width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + card.iconBg" [innerHTML]="card.icon"></div>
                @if (card.badge) {
                  <span [style]="badgeStyle(card.badge, card.badgeSuccess)">{{ card.badge }}</span>
                }
              </div>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;" [style.color]="card.valueColor">{{ card.value | numberShort }}</div>
              <div style="font-size:12px;color:#6B7280;font-weight:500;margin-top:4px;">{{ card.label }}</div>
            </div>
          }
        </div>
      }

      <!-- ── Summary Table ─────────────────────────────────────────── -->
      <div style="
        background:white; border-radius:20px; overflow:hidden;
        box-shadow:0 4px 24px rgba(0,0,0,0.08); border:1px solid #F3F4F6;
      ">
        <!-- Table Header -->
        <div style="
          padding:18px 24px; border-bottom:1px solid #F3F4F6;
          display:flex; align-items:center; justify-content:space-between;
        ">
          <div>
            <h2 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">{{ subordinateLabel() }} Summary</h2>
            <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">{{ filteredSubordinates().length }} records</p>
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#F8FAFC;">
                <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Full Name</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Farmers</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#228A22;text-transform:uppercase;letter-spacing:0.5px;">GAP</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#0EA5E9;text-transform:uppercase;letter-spacing:0.5px;">GEP</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#8B5CF6;text-transform:uppercase;letter-spacing:0.5px;">GSP</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;min-width:170px;">Status</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of [1,2,3,4]; track i) {
                  <tr>
                    <td colspan="9" style="padding:16px;">
                      <div style="height:20px;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;border-radius:6px;animation:shimmer 1.5s infinite;"></div>
                    </td>
                  </tr>
                }
              } @else {
                @for (sub of filteredSubordinates(); track sub.userId; let i = $index) {
                  <!-- Main row -->
                  <tr [style]="rowStyle(i)">
                    <td style="padding:14px 16px;">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <div style="
                          width:34px;height:34px;border-radius:10px;flex-shrink:0;
                          background:linear-gradient(135deg,#D047AE,#E068C4);
                          display:flex;align-items:center;justify-content:center;
                          font-size:12px;font-weight:800;color:white;
                        ">{{ getInitials(sub.fullName) }}</div>
                        <div>
                          <div style="font-size:14px;font-weight:700;color:#1A1A1A;">{{ sub.fullName }}</div>
                          <div style="font-size:11px;color:#9CA3AF;margin-top:1px;">{{ sub.role }}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:15px;font-weight:800;color:#D047AE;
                        background:#FDF2FB;padding:3px 10px;border-radius:8px;
                      ">{{ sub.farmersVisited }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#C2389A;
                        background:#FADDF2;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gapCount }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#0284C7;
                        background:#E0F2FE;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gepCount }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span style="
                        font-size:14px;font-weight:700;color:#7C3AED;
                        background:#EDE9FE;padding:3px 10px;border-radius:8px;
                      ">{{ sub.gspCount }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span [style]="statusBadgeStyle(sub.status)">
                        @if (sub.status === 'approved') {
                          <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                        } @else {
                          <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                        }
                        {{ sub.status | statusLabel }}
                      </span>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Table Footer -->
        @if (!loading() && filteredSubordinates().length === 0) {
          <div style="padding:48px;text-align:center;color:#9CA3AF;">
            <svg width="48" height="48" viewBox="0 0 20 20" fill="#E5E7EB" style="display:block;margin:0 auto 12px;">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
            </svg>
            <p style="margin:0;font-size:14px;">No records match your filters.</p>
          </div>
        }
      </div>

      <!-- ── Hierarchy Visualizer ──────────────────────────────────── -->
      <div style="
        background:white;border-radius:20px;padding:24px;
        margin-top:20px;box-shadow:0 4px 24px rgba(0,0,0,0.08);
        border:1px solid #F3F4F6;
      ">
        <h3 style="margin:0 0 20px;font-size:15px;font-weight:800;color:#1A1A1A;">Approval Hierarchy</h3>
        <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
          @for (r of roles; track r; let i = $index; let last = $last) {
            <div style="
              display:flex;align-items:center;gap:6px;flex-wrap:wrap;
            ">
              <div [style]="hierarchyNodeStyle(r)">
                <div style="font-size:13px;font-weight:800;">{{ r }}</div>
                <div style="font-size:10px;opacity:0.8;margin-top:2px;">{{ roleLabelShort(r) }}</div>
              </div>
              @if (!last) {
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#CBD5E1">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              }
            </div>
          }
        </div>
      </div>
      <!-- ── Promote Confirmation Modal ──────────────────────────────── -->
      @if (promoteModal()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;" (click)="closePromoteModal()">
          <div style="background:white;border-radius:20px;padding:32px;width:100%;max-width:460px;box-shadow:0 24px 80px rgba(0,0,0,0.3);" (click)="$event.stopPropagation()">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
              <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FADDF2,#FDF2FB);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:800;color:#1A1A1A;">Send to {{ nextRoleLabel() }}</h3>
                <p style="margin:2px 0 0;font-size:13px;color:#6B7280;">Promote all approved reports</p>
              </div>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">You are about to send <strong>{{ summary()?.approvedCount }}</strong> approved report(s) up to the <strong>{{ nextRoleLabel() }}</strong> level.</p>
            <p style="margin:0 0 24px;font-size:13px;color:#9CA3AF;line-height:1.6;">This action cannot be undone. Make sure all records are reviewed before proceeding.</p>
            <div style="display:flex;gap:10px;justify-content:flex-end;">
              <button (click)="closePromoteModal()" style="padding:10px 20px;border:1.5px solid #E5E7EB;border-radius:10px;background:white;color:#6B7280;font-size:14px;font-weight:600;cursor:pointer;">Cancel</button>
              <button
                (click)="confirmPromote()"
                [disabled]="approving()"
                style="padding:10px 24px;border:none;border-radius:10px;background:linear-gradient(135deg,#8B2D73,#D047AE);color:white;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;"
                [style.opacity]="approving() ? '0.65' : '1'"
              >
                @if (approving()) {
                  <svg style="animation:spin 1s linear infinite;" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>
                  Sending...
                } @else {
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                  Yes, Send to {{ nextRoleLabel() }}
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Toast Notification ────────────────────────────────────── -->
      @if (toast()) {
        <div style="
          position:fixed;bottom:28px;right:28px;z-index:2000;
          display:flex;align-items:center;gap:12px;
          padding:14px 20px;border-radius:14px;
          box-shadow:0 8px 32px rgba(0,0,0,0.18);
          animation:slideInToast 0.3s cubic-bezier(0.22,1,0.36,1);
          min-width:280px;max-width:400px;
        " [style.background]="toast()!.success ? '#F0FDF4' : '#FEF2F2'" [style.border]="'1.5px solid ' + (toast()!.success ? '#86EFAC' : '#FECACA')">
          <div [style]="'width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + (toast()!.success ? '#DCFCE7' : '#FEE2E2')">
            @if (toast()!.success) {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 20 20" fill="#DC2626"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            }
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;" [style.color]="toast()!.success ? '#15803D' : '#B91C1C'">{{ toast()!.success ? 'Success' : 'Failed' }}</div>
            <div style="font-size:12px;margin-top:1px;color:#6B7280;">{{ toast()!.message }}</div>
          </div>
          <button (click)="toast.set(null)" style="background:none;border:none;cursor:pointer;padding:4px;color:#9CA3AF;flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      }
    </div>

    <style>
      @keyframes pageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes expandRow { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes slideInToast { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
      .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
      .dash-search:focus { border-color: #E068C4 !important; background: white !important; }
      .dash-dl-btn:hover { border-color: #E068C4 !important; color: #D047AE !important; background: #FDF2FB !important; }
      .cta-reports:hover { background: #FDF2FB !important; box-shadow: 0 8px 32px rgba(0,0,0,0.22) !important; transform: translateY(-2px) scale(1.01); }
      @media (max-width: 768px) {
        .dash-responsive-header { flex-direction: column !important; text-align: center; }
        .dash-responsive-header > div:last-child { justify-content: center !important; width: 100%; }
      }
    </style>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private sanitizer = inject(DomSanitizer);

  private svg(raw: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(raw); }

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  approving = signal(false);
  approved = signal(false);

  searchQuery = signal('');
  filterStatus = signal('');
  filterCategory = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  promoteModal = signal(false);
  toast = signal<{ success: boolean; message: string } | null>(null);

  role = this.authService.currentRole;
  roleLabel = computed(() => {
    const r = this.role();
    return r ? ROLE_LABELS[r] : '';
  });
  subordinateLabel = computed(() => {
    const r = this.role();
    return r ? ROLE_SUBORDINATE[r] : '';
  });
  nextRoleLabel = computed(() => {
    const r = this.role();
    if (!r) return '';
    const idx = ROLE_HIERARCHY.indexOf(r);
    const next = ROLE_HIERARCHY[idx + 1] as UserRole | undefined;
    return next ? ROLE_LABELS[next] : '';
  });
  formattedDate = computed(() => {
    const d = this.summary()?.lastUpdated;
    return d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  });

  roles: UserRole[] = ['FC', 'PC', 'GL', 'CSH', 'SH', 'CH'];

  kpiCards = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      {
        // Total Field Officers — user-group (team of officers)
        label: 'Total ' + this.subordinateLabel(), value: s.totalSubordinates,
        valueColor: '#1A1A1A', iconBg: '#FDF2FB',
        icon: this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>'),

        badge: s.allSubmitted ? '✓ All Submitted' : `${s.reportSubmittedCount}/${s.totalSubordinates} Submitted`,
        badgeSuccess: s.allSubmitted,
      },
      {
        // Farmers Visited — single user (each farmer counted individually)
        label: 'Farmers Visited', value: s.totalFarmersVisited,
        valueColor: '#D047AE', iconBg: '#FADDF2',
        icon: this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#E068C4"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>'),

        badge: null
      },
      {
        // GAP — badge-check (certified / verified good agricultural practices)
        label: 'GAP Tasks', value: s.totalGAP,
        valueColor: '#15803D', iconBg: '#DCFCE7',
        icon: this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'),

        badge: 'GAP'
      },
      {
        // GEP — globe (environmental = planet care)
        label: 'GEP Tasks', value: s.totalGEP,
        valueColor: '#0284C7', iconBg: '#E0F2FE',
        icon: this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#0EA5E9"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clip-rule="evenodd"/></svg>'),

        badge: 'GEP'
      },
      {
        // GSP — refresh arrows (circular sustainability loop)
        label: 'GSP Tasks', value: s.totalGSP,
        valueColor: '#7C3AED', iconBg: '#EDE9FE',
        icon: this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#8B5CF6"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg>'),

        badge: 'GSP'
      },
      {
        // Pending Approvals — clock (pending) / shield-check (all clear)
        label: 'Pending Approvals', value: s.pendingApprovals,
        valueColor: s.pendingApprovals > 0 ? '#D97706' : '#16A34A', iconBg: s.pendingApprovals > 0 ? '#FEF3C7' : '#DCFCE7',
        icon: s.pendingApprovals > 0
          ? this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#F59E0B"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>')
          : this.svg('<svg width="20" height="20" viewBox="0 0 20 20" fill="#16A34A"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'),

        badge: null
      },
    ];
  });

  filteredSubordinates = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    const category = this.filterCategory();
    const from = this.dateFrom();
    const to = this.dateTo();
    return s.subordinates.filter(sub => {
      const matchName = !query || sub.fullName.toLowerCase().includes(query);
      const matchStatus = !status || sub.status === status;
      const matchCat = !category || sub.tasks.some(t => t.category === category);
      const matchDate = (!from && !to) || sub.tasks.some(t => {
        const d = t.completedDate;
        return (!from || d >= from) && (!to || d <= to);
      });
      return matchName && matchStatus && matchCat && matchDate;
    });
  });

  constructor() {}

  ngOnInit(): void {
    const role = this.role();
    if (!role) return;
    this.dashboardService.getDashboard(role).subscribe(data => {
      this.summary.set(data);
      this.loading.set(false);
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  openPromoteModal(): void {
    if (!this.summary()?.canApprove) return;
    this.promoteModal.set(true);
  }

  closePromoteModal(): void {
    if (this.approving()) return;
    this.promoteModal.set(false);
  }

  confirmPromote(): void {
    if (!this.summary()?.canApprove) return;
    this.approving.set(true);
    const name = this.authService.currentUser()?.fullName ?? 'Unknown';
    const role = this.role()!;
    this.dashboardService.approve(role, name).subscribe({
      next: (res) => {
        this.approving.set(false);
        this.promoteModal.set(false);
        this.approved.set(true);
        setTimeout(() => this.approved.set(false), 3000);
        this.showToast(true, res.message || `Report successfully sent to ${this.nextRoleLabel()}.`);
      },
      error: (err) => {
        this.approving.set(false);
        this.promoteModal.set(false);
        this.showToast(false, err?.error?.message || 'Failed to send report. Please try again.');
      }
    });
  }

  onApprove(): void {
    this.openPromoteModal();
  }

  downloadReport(type: 'farm-visits' | 'training'): void {
    const subs = this.filteredSubordinates();
    this.dashboardService.downloadReport({ type, format: 'csv' }, subs);
  }

  showToast(success: boolean, message: string): void {
    this.toast.set({ success, message });
    setTimeout(() => this.toast.set(null), 5000);
  }

  approveButtonStyle = computed((): string => {
    const canApprove = this.summary()?.canApprove;
    const isApproved = this.approved();
    if (isApproved) return `
      display:flex;align-items:center;gap:8px;padding:12px 24px;
      background:linear-gradient(135deg,#E068C4,#D047AE);color:white;
      border:none;border-radius:12px;font-size:14px;font-weight:700;
      cursor:pointer;box-shadow:0 4px 16px rgba(224,104,196,0.4);transition:all 0.2s;
    `;
    if (!canApprove) return `
      display:flex;align-items:center;gap:8px;padding:12px 24px;
      background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);
      border:1px solid rgba(255,255,255,0.2);border-radius:12px;font-size:14px;font-weight:700;
      cursor:not-allowed;transition:all 0.2s;
    `;
    return `
      display:flex;align-items:center;gap:8px;padding:12px 24px;
      background:white;color:#D047AE;border:none;border-radius:12px;
      font-size:14px;font-weight:700;cursor:pointer;
      box-shadow:0 4px 16px rgba(0,0,0,0.15);transition:all 0.2s;
    `;
  });

  rowStyle(i: number): string {
    const base = i % 2 === 0 ? 'white' : '#FAFAFA';
    return `background:${base};border-bottom:1px solid #F3F4F6;`;
  }

  statusBadgeStyle(status: string): string {
    const pending = 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEF9C3;color:#B45309;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;';
    const styles: Record<string, string> = {
      approved:    'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#DCFCE7;color:#16A34A;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;',
      rejected:    'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEE2E2;color:#DC2626;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;',
      pending_fc:  pending,
      pending_pc:  pending,
      pending_gl:  pending,
      pending_csh: pending,
      pending_sh:  pending,
      pending_ch:  pending,
    };
    return styles[status] ?? pending;
  }

  kpiCardStyle(card: any): string {
    return `
      background:white;border-radius:16px;padding:20px;
      box-shadow:0 2px 12px rgba(0,0,0,0.06);
      border:1px solid #F3F4F6;
      transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
      cursor:default;
    `;
  }

  badgeStyle(badge: string, success?: boolean): string {
    if (success === true)  return `padding:2px 8px;background:#DCFCE7;color:#16A34A;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.3px;white-space:nowrap;`;
    if (success === false) return `padding:2px 8px;background:#FEF9C3;color:#92400E;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.3px;white-space:nowrap;`;
    const color = badge === 'GAP' ? '#C2389A' : badge === 'GEP' ? '#0284C7' : '#7C3AED';
    const bg = badge === 'GAP' ? '#FADDF2' : badge === 'GEP' ? '#E0F2FE' : '#EDE9FE';
    return `padding:2px 8px;background:${bg};color:${color};border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.5px;`;
  }

  hierarchyNodeStyle(r: UserRole): string {
    const isCurrent = r === this.role();
    return `
      padding:10px 16px;border-radius:12px;text-align:center;
      background:${isCurrent ? 'linear-gradient(135deg,#D047AE,#E068C4)' : '#F3F4F6'};
      color:${isCurrent ? 'white' : '#6B7280'};
      border:${isCurrent ? 'none' : '1px solid #E5E7EB'};
      box-shadow:${isCurrent ? '0 4px 16px rgba(208,71,174,0.35)' : 'none'};
      min-width:70px; transform:${isCurrent ? 'scale(1.05)' : 'scale(1)'};
      transition:all 0.2s;
    `;
  }

  roleLabelShort(r: UserRole): string {
    const short: Record<UserRole, string> = {
      FO: 'Field', FC: 'Field', PC: 'Program', GL: 'Group',
      CSH: 'Cocoa', SH: 'Sustainability', CH: 'Country'
    };
    return short[r];
  }
}
