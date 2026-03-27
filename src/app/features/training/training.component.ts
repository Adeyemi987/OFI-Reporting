import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, TrainingSession, SubordinateReport, ROLE_LABELS, ROLE_SUBORDINATE } from '../../core/models';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="animation:pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);color:#1A1A1A;">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background:linear-gradient(135deg,#0C4A6E 0%,#0369A1 50%,#0EA5E9 100%);
        border-radius:24px;padding:32px 36px;margin-bottom:28px;
        position:relative;overflow:hidden;
        box-shadow:0 12px 40px rgba(3,105,161,0.35);
      ">
        <div style="position:absolute;top:-50px;right:-30px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
        <div style="position:absolute;bottom:-60px;left:30%;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="padding:5px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">Training</span>
            </div>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Training Management</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Track sessions, participants & compliance across {{ subordinateLabel() }}</p>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ totalSessions() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Sessions</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ totalParticipants() | number }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Participants</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ uniqueLocations() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Locations</div>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div style="background:white;border-radius:20px;padding:24px;height:160px;animation:shimmer 1.5s infinite;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;"></div>
          }
        </div>
      } @else {

        <!-- ── Category Summary Strips ──────────────────────────── -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:28px;">
          @for (cat of categoryStats(); track cat.name; let i = $index) {
            <div class="cat-strip" [style]="'animation:cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) ' + (i*0.1) + 's both;' +
              'background:white;border-radius:20px;padding:24px;border:1px solid #F3F4F6;' +
              'box-shadow:0 4px 20px rgba(0,0,0,0.06);transition:all 0.35s cubic-bezier(0.4,0,0.2,1);' +
              'border-left:4px solid ' + cat.color + ';'">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <span [style]="'padding:4px 12px;border-radius:8px;font-size:12px;font-weight:800;background:' + cat.bg + ';color:' + cat.color">{{ cat.name }}</span>
                <span style="font-size:11px;color:#9CA3AF;">{{ cat.pct }}%</span>
              </div>
              <div style="font-size:32px;font-weight:900;color:#1A1A1A;letter-spacing:-1px;">{{ cat.sessions }}</div>
              <div style="font-size:12px;color:#6B7280;margin-top:4px;">sessions · {{ cat.participants }} participants</div>
              <!-- Progress bar -->
              <div style="margin-top:12px;height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;">
                <div [style]="'width:' + cat.pct + '%;height:100%;background:' + cat.color + ';border-radius:3px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1);'"></div>
              </div>
            </div>
          }
        </div>

        <!-- ── Filter Bar ──────────────────────────────────────────── -->
        <div style="
          background:white;border-radius:16px;padding:16px 20px;margin-bottom:20px;
          display:flex;align-items:center;gap:12px;flex-wrap:wrap;
          box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #F3F4F6;
        ">
          <select [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;cursor:pointer;">
            <option value="">All Categories</option>
            <option value="GAP">GAP</option>
            <option value="GEP">GEP</option>
            <option value="GSP">GSP</option>
          </select>
          <input type="text" placeholder="Search training..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
            class="trn-search" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;width:200px;transition:border-color 0.2s;"/>
        </div>

        <!-- ── Training Sessions List ──────────────────────────── -->
        <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);border:1px solid #F3F4F6;">
          <div style="padding:22px 28px;border-bottom:1px solid #F3F4F6;">
            <h2 style="margin:0;font-size:18px;font-weight:800;color:#1A1A1A;">All Training Sessions</h2>
            <p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">{{ filteredSessions().length }} sessions across {{ subordinateLabel() }}</p>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#F8FAFC;">
                  <th style="padding:14px 20px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Training Title</th>
                  <th style="padding:14px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Coordinator</th>
                  <th style="padding:14px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Category</th>
                  <th style="padding:14px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Participants</th>
                  <th style="padding:14px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Location</th>
                  <th style="padding:14px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
                </tr>
              </thead>
              <tbody>
                @for (s of filteredSessions(); track s.id; let i = $index) {
                  <tr class="trn-row" style="border-bottom:1px solid #F3F4F6;transition:background 0.15s;" [style.animation]="'rowSlideIn 0.3s ease ' + (i*0.04) + 's both'">
                    <td style="padding:14px 20px;">
                      <div style="font-size:14px;font-weight:700;color:#1A1A1A;">{{ s.title }}</div>
                    </td>
                    <td style="padding:14px 16px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#0369A1,#0EA5E9);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:white;">
                          {{ getInitials(s.coordinator) }}
                        </div>
                        <span style="font-size:13px;color:#374151;">{{ s.coordinator }}</span>
                      </div>
                    </td>
                    <td style="padding:14px 16px;text-align:center;">
                      <span [style]="catBadge(s.category)">{{ s.category }}</span>
                    </td>
                    <td style="padding:14px 16px;text-align:center;font-size:15px;font-weight:800;color:#0369A1;">{{ s.participants }}</td>
                    <td style="padding:14px 16px;font-size:13px;color:#6B7280;">{{ s.location }}</td>
                    <td style="padding:14px 16px;text-align:center;font-size:13px;color:#6B7280;">{{ s.date }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (filteredSessions().length === 0) {
            <div style="padding:48px;text-align:center;color:#9CA3AF;">
              <p style="margin:0;font-size:14px;">No training sessions match your filters.</p>
            </div>
          }
        </div>
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes cardFloat3D { from { opacity:0; transform:translateY(24px) rotateX(6deg); } to { opacity:1; transform:translateY(0) rotateX(0); } }
      @keyframes rowSlideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      .cat-strip:hover { transform:translateY(-4px) scale(1.01) !important; box-shadow:0 12px 40px rgba(0,0,0,0.12) !important; }
      .trn-row:hover { background:#E0F2FE !important; }
      .trn-search:focus { border-color:#0EA5E9 !important; background:white !important; }
    </style>
  `
})
export class TrainingComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  searchQuery = signal('');
  filterCategory = signal('');

  role = this.authService.currentRole;
  subordinateLabel = computed(() => {
    const r = this.role(); return r ? ROLE_SUBORDINATE[r] : '';
  });

  allSessions = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    const sessions: { id: string; title: string; coordinator: string; category: string; participants: number; location: string; date: string }[] = [];
    subs.forEach(sub => {
      sub.trainingSessions.forEach(ts => {
        sessions.push({ ...ts, coordinator: sub.fullName });
      });
    });
    return sessions;
  });

  totalSessions = computed(() => this.allSessions().length);
  totalParticipants = computed(() => this.allSessions().reduce((s, t) => s + t.participants, 0));
  uniqueLocations = computed(() => new Set(this.allSessions().map(s => s.location)).size);

  categoryStats = computed(() => {
    const all = this.allSessions();
    const total = all.length || 1;
    const cats = ['GAP', 'GEP', 'GSP'];
    const colors: Record<string, string> = { GAP: '#C2389A', GEP: '#0284C7', GSP: '#7C3AED' };
    const bgs: Record<string, string> = { GAP: '#FADDF2', GEP: '#E0F2FE', GSP: '#EDE9FE' };
    return cats.map(c => {
      const filtered = all.filter(s => s.category === c);
      return {
        name: c, color: colors[c], bg: bgs[c],
        sessions: filtered.length,
        participants: filtered.reduce((s, t) => s + t.participants, 0),
        pct: Math.round((filtered.length / total) * 100)
      };
    });
  });

  filteredSessions = computed(() => {
    const cat = this.filterCategory();
    const q = this.searchQuery().toLowerCase();
    return this.allSessions().filter(s => {
      const matchCat = !cat || s.category === cat;
      const matchQ = !q || s.title.toLowerCase().includes(q) || s.coordinator.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
      return matchCat && matchQ;
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

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  catBadge(cat: string): string {
    const m: Record<string, string> = {
      GAP: 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#FADDF2;color:#C2389A;',
      GEP: 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#E0F2FE;color:#0284C7;',
      GSP: 'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#EDE9FE;color:#7C3AED;',
    };
    return m[cat] ?? '';
  }
}
