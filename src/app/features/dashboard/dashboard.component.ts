import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardSummary, SubordinateReport, UserRole,
  ROLE_LABELS, ROLE_SUBORDINATE, DownloadOptions
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

          <!-- Approve button -->
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            @if (!summary()?.canApprove) {
              <div style="
                display:flex;align-items:center;gap:6px;
                padding:10px 16px; background:rgba(239,68,68,0.15);
                border:1px solid rgba(239,68,68,0.4); border-radius:10px;
              ">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="#FCA5A5"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                <span style="font-size:12px;color:#FCA5A5;font-weight:600;">{{ summary()?.pendingApprovals }} pending approval{{ (summary()?.pendingApprovals ?? 0) > 1 ? 's' : '' }}</span>
              </div>
            }
            <button
              [disabled]="!summary()?.canApprove || approving()"
              (click)="onApprove()"
              [style]="approveButtonStyle()"
            >
              @if (approving()) {
                <svg style="animation:spin 1s linear infinite;" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
                Approving...
              } @else if (approved()) {
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Approved!
              } @else {
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                Approve All & Promote
              }
            </button>
          </div>
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
                  <span [style]="badgeStyle(card.badge)">{{ card.badge }}</span>
                }
              </div>
              <div style="font-size:26px;font-weight:900;letter-spacing:-1px;" [style.color]="card.valueColor">{{ card.value | numberShort }}</div>
              <div style="font-size:12px;color:#6B7280;font-weight:500;margin-top:4px;">{{ card.label }}</div>
            </div>
          }
        </div>
      }

      <!-- ── View Detailed Reports CTA ─────────────────────────────── -->
      <a routerLink="reports" style="
        display:flex;align-items:center;justify-content:space-between;
        padding:16px 24px;margin-bottom:20px;
        background:linear-gradient(135deg,#FDF2FB,#FADDF2);
        border:1.5px solid #F0B8E0;border-radius:16px;
        cursor:pointer;text-decoration:none;
        transition:all 0.25s;
      " class="cta-reports">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="
            width:42px;height:42px;border-radius:12px;
            background:linear-gradient(135deg,#D047AE,#E068C4);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 4px 12px rgba(208,71,174,0.3);
          ">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <div style="font-size:14px;font-weight:800;color:#8B2D73;">View Detailed Reports</div>
            <div style="font-size:12px;color:#C2389A;margin-top:2px;">Click to view task &amp; training details per {{ subordinateLabel() }}</div>
          </div>
        </div>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
      </a>

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
          <div style="
            padding:6px 12px; background:#DCFCE7; border:1px solid #BBF7D0;
            border-radius:20px; font-size:12px; font-weight:700; color:#16A34A;
          ">{{ summary()?.approvedCount ?? 0 }}/{{ summary()?.totalSubordinates ?? 0 }} Approved</div>
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
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
                <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Approval Date</th>
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
                    <td style="padding:14px 16px;text-align:center;font-size:12px;color:#6B7280;">
                      @if (sub.approvalDate) {
                        {{ sub.approvalDate | date:'MMM d, y' }}<br/>
                        <span style="color:#9CA3AF;font-size:11px;">by {{ sub.approvedBy }}</span>
                      } @else {
                        <span style="color:#D1D5DB;">—</span>
                      }
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
    </div>

    <style>
      @keyframes pageIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes expandRow { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
      .dash-search:focus { border-color: #E068C4 !important; background: white !important; }
      .dash-dl-btn:hover { border-color: #E068C4 !important; color: #D047AE !important; background: #FDF2FB !important; }
      .cta-reports:hover { box-shadow: 0 6px 24px rgba(208,71,174,0.2) !important; border-color: #E068C4 !important; transform: translateY(-1px); }
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

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  approving = signal(false);
  approved = signal(false);

  searchQuery = signal('');
  filterStatus = signal('');
  filterCategory = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  role = this.authService.currentRole;
  roleLabel = computed(() => {
    const r = this.role();
    return r ? ROLE_LABELS[r] : '';
  });
  subordinateLabel = computed(() => {
    const r = this.role();
    return r ? ROLE_SUBORDINATE[r] : '';
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
        label: 'Total ' + this.subordinateLabel(), value: s.totalSubordinates,
        valueColor: '#1A1A1A', iconBg: '#FDF2FB',
        icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>',
        badge: null
      },
      {
        label: 'Farmers Visited', value: s.totalFarmersVisited,
        valueColor: '#D047AE', iconBg: '#FADDF2',
        icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#E068C4"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>',
        badge: null
      },
      {
        label: 'GAP Tasks', value: s.totalGAP,
        valueColor: '#C2389A', iconBg: '#FADDF2',
        icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#22C55E"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>',
        badge: 'GAP'
      },
      {
        label: 'GEP Tasks', value: s.totalGEP,
        valueColor: '#0284C7', iconBg: '#E0F2FE',
        icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#38BDF8"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/></svg>',
        badge: 'GEP'
      },
      {
        label: 'GSP Tasks', value: s.totalGSP,
        valueColor: '#7C3AED', iconBg: '#EDE9FE',
        icon: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#A78BFA"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>',
        badge: 'GSP'
      },
      {
        label: 'Pending Approvals', value: s.pendingApprovals,
        valueColor: s.pendingApprovals > 0 ? '#DC2626' : '#16A34A', iconBg: s.pendingApprovals > 0 ? '#FEF2F2' : '#DCFCE7',
        icon: s.pendingApprovals > 0
          ? '<svg width="20" height="20" viewBox="0 0 20 20" fill="#EF4444"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 20 20" fill="#4CAF50"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
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

  onApprove(): void {
    if (!this.summary()?.canApprove) return;
    this.approving.set(true);
    const name = this.authService.currentUser()?.fullName ?? 'Unknown';
    const role = this.role()!;
    this.dashboardService.approve(role, name).subscribe(() => {
      this.approving.set(false);
      this.approved.set(true);
      setTimeout(() => this.approved.set(false), 3000);
    });
  }

  downloadReport(type: 'farm-visits' | 'training'): void {
    const subs = this.filteredSubordinates();
    this.dashboardService.downloadReport({ type, format: 'csv' }, subs);
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
    const styles: Record<string, string> = {
      approved: 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#DCFCE7;color:#16A34A;border-radius:20px;font-size:11px;font-weight:700;',
      pending: 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEF9C3;color:#B45309;border-radius:20px;font-size:11px;font-weight:700;',
      rejected: 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEE2E2;color:#DC2626;border-radius:20px;font-size:11px;font-weight:700;',
      flagged: 'display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#FEF2F2;color:#DC2626;border-radius:20px;font-size:11px;font-weight:700;',
    };
    return styles[status] ?? styles['pending'];
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

  badgeStyle(badge: string): string {
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
