import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, AuditLog, ROLE_LABELS, ROLE_SUBORDINATE, UserRole } from '../../core/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="animation:pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);color:#1A1A1A;">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background:linear-gradient(135deg,#78350F 0%,#B45309 50%,#F59E0B 100%);
        border-radius:24px;padding:32px 36px;margin-bottom:28px;
        position:relative;overflow:hidden;
        box-shadow:0 12px 40px rgba(180,83,9,0.35);
      ">
        <div style="position:absolute;top:-50px;right:-30px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
        <div style="position:absolute;bottom:-60px;left:30%;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="padding:5px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">Audit</span>
            </div>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Audit Logs</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Complete activity trail for {{ subordinateLabel() }}</p>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ totalLogs() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Total Entries</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ uniqueActors() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Unique Actors</div>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:12px;">
          @for (i of [1,2,3,4,5]; track i) {
            <div style="background:white;border-radius:16px;padding:20px;height:60px;animation:shimmer 1.5s infinite;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;"></div>
          }
        </div>
      } @else {

        <!-- ── Filter Bar ──────────────────────────────────────────── -->
        <div style="
          background:white;border-radius:16px;padding:16px 20px;margin-bottom:20px;
          display:flex;align-items:center;gap:12px;flex-wrap:wrap;
          box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #F3F4F6;
        ">
          <input type="text" placeholder="Search logs..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
            class="audit-search" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;width:200px;transition:border-color 0.2s;"/>
          <select [ngModel]="filterAction()" (ngModelChange)="filterAction.set($event)" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;cursor:pointer;">
            <option value="">All Actions</option>
            <option value="Report Approved">Approved</option>
            <option value="Report Modified">Modified</option>
            <option value="Report Submitted">Submitted</option>
          </select>
          <select [ngModel]="filterActor()" (ngModelChange)="filterActor.set($event)" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;cursor:pointer;">
            <option value="">All Actors</option>
            @for (a of actors(); track a) {
              <option [value]="a">{{ a }}</option>
            }
          </select>
        </div>

        <!-- ── Timeline ────────────────────────────────────────── -->
        <div style="background:white;border-radius:24px;padding:28px 32px;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;">
          <div style="display:flex;flex-direction:column;gap:0;">
            @for (log of filteredLogs(); track log.id; let i = $index; let last = $last) {
              <div style="display:flex;gap:16px;" [style.animation]="'timelineSlide 0.4s cubic-bezier(0.4,0,0.2,1) ' + (i*0.05) + 's both'">
                <!-- Timeline connector -->
                <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
                  <div [style]="'width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
                    (log.action === 'Report Approved' ? 'background:linear-gradient(135deg,#16A34A,#4CAF50);box-shadow:0 4px 16px rgba(22,163,74,0.3);' :
                     log.action === 'Report Modified' ? 'background:linear-gradient(135deg,#0284C7,#38BDF8);box-shadow:0 4px 16px rgba(2,132,199,0.3);' :
                     'background:linear-gradient(135deg,#7C3AED,#A78BFA);box-shadow:0 4px 16px rgba(124,58,237,0.3);')">
                    @if (log.action === 'Report Approved') {
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                    } @else if (log.action === 'Report Modified') {
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
                    }
                  </div>
                  @if (!last) {
                    <div style="width:2px;flex:1;min-height:24px;background:linear-gradient(to bottom,#E5E7EB,#F3F4F6);margin:4px 0;"></div>
                  }
                </div>

                <!-- Content -->
                <div class="audit-entry" style="
                  flex:1;background:#FAFAFA;border-radius:16px;padding:16px 20px;margin-bottom:12px;
                  border:1px solid #F3F4F6;transition:all 0.2s;cursor:default;
                ">
                  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span [style]="actionBadge(log.action)">{{ log.action }}</span>
                      <span style="font-size:13px;font-weight:600;color:#374151;">{{ log.subordinateName }}</span>
                    </div>
                    <span style="font-size:12px;color:#9CA3AF;">{{ log.timestamp | date:'MMM d, y, h:mm a' }}</span>
                  </div>
                  <div style="margin-top:8px;font-size:13px;color:#6B7280;">
                    by <strong>{{ log.performedBy }}</strong>
                    <span style="padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#F3F4F6;color:#6B7280;margin-left:6px;">{{ log.performedByRole }}</span>
                  </div>
                  @if (log.comments) {
                    <div style="margin-top:8px;padding:8px 12px;background:#ECFDF5;border-radius:8px;font-size:12px;color:#059669;">
                      "{{ log.comments }}"
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          @if (filteredLogs().length === 0) {
            <div style="padding:48px;text-align:center;color:#9CA3AF;">
              <p style="margin:0;font-size:14px;">No audit logs match your filters.</p>
            </div>
          }
        </div>
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes timelineSlide { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      .audit-entry:hover { background:#FDF2FB !important; border-color:#F0B8E0 !important; transform:translateX(4px); }
      .audit-search:focus { border-color:#F59E0B !important; background:white !important; }
    </style>
  `
})
export class AuditLogsComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  searchQuery = signal('');
  filterAction = signal('');
  filterActor = signal('');

  role = this.authService.currentRole;
  subordinateLabel = computed(() => {
    const r = this.role(); return r ? ROLE_SUBORDINATE[r] : '';
  });

  allLogs = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    const logs: (AuditLog & { subordinateName: string })[] = [];
    subs.forEach(sub => {
      sub.auditLogs.forEach(log => {
        logs.push({ ...log, subordinateName: sub.fullName });
      });
    });
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  });

  totalLogs = computed(() => this.allLogs().length);
  uniqueActors = computed(() => new Set(this.allLogs().map(l => l.performedBy)).size);
  actors = computed(() => Array.from(new Set(this.allLogs().map(l => l.performedBy))).sort());

  filteredLogs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const action = this.filterAction();
    const actor = this.filterActor();
    return this.allLogs().filter(l => {
      const matchQ = !q || l.action.toLowerCase().includes(q) || l.performedBy.toLowerCase().includes(q) || l.subordinateName.toLowerCase().includes(q) || (l.comments?.toLowerCase().includes(q) ?? false);
      const matchAction = !action || l.action === action;
      const matchActor = !actor || l.performedBy === actor;
      return matchQ && matchAction && matchActor;
    });
  });

  ngOnInit(): void {
    const role = this.role();
    if (!role) return;
    this.dashboardService.getDashboard(role).subscribe(data => {
      this.summary.set(data);
      this.loading.set(false);
    });
  }

  actionBadge(action: string): string {
    if (action === 'Report Approved') return 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#DCFCE7;color:#16A34A;';
    if (action === 'Report Modified') return 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#E0F2FE;color:#0284C7;';
    return 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#EDE9FE;color:#7C3AED;';
  }
}
