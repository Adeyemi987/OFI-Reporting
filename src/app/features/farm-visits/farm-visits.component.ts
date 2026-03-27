import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary, SubordinateReport, Task, ROLE_LABELS, ROLE_SUBORDINATE } from '../../core/models';

@Component({
  selector: 'app-farm-visits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="animation:pageSlideIn 0.5s cubic-bezier(0.4,0,0.2,1);color:#1A1A1A;">

      <!-- ── Hero Header ──────────────────────────────────────────── -->
      <div style="
        background:linear-gradient(135deg,#8B2D73 0%,#D047AE 40%,#D960BA 100%);
        border-radius:24px;padding:32px 36px;margin-bottom:28px;
        position:relative;overflow:hidden;
        box-shadow:0 12px 40px rgba(208,71,174,0.35);
      ">
        <div style="position:absolute;top:-50px;right:-30px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
        <div style="position:absolute;bottom:-70px;right:200px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              <span style="padding:5px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:30px;font-size:12px;font-weight:700;color:white;letter-spacing:1px;text-transform:uppercase;">Farm Visits</span>
            </div>
            <h1 style="margin:0;font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px;">Farm Visit Management</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">Track and manage field visits across {{ subordinateLabel() }}</p>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ totalFarmers() | number }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Total Farmers</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ totalVisits() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Total Visits</div>
            </div>
            <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:16px;padding:16px 22px;text-align:center;min-width:100px;">
              <div style="font-size:28px;font-weight:900;color:white;">{{ uniqueZones() }}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px;">Active Zones</div>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div style="display:grid;grid-template-columns:1fr;gap:16px;">
          @for (i of [1,2,3,4]; track i) {
            <div style="background:white;border-radius:20px;padding:24px;height:80px;animation:shimmer 1.5s infinite;background:linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%);background-size:200% 100%;"></div>
          }
        </div>
      } @else {

        <!-- ── Filter Bar ──────────────────────────────────────────── -->
        <div style="
          background:white;border-radius:16px;padding:16px 20px;margin-bottom:20px;
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;
          box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #F3F4F6;
        ">
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <div style="position:relative;">
              <input type="text" placeholder="Search visits..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
                class="fv-search" style="padding:9px 12px 9px 36px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;width:200px;transition:border-color 0.2s;"/>
              <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/></svg>
            </div>
            <select [ngModel]="filterZone()" (ngModelChange)="filterZone.set($event)" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;cursor:pointer;">
              <option value="">All Zones</option>
              @for (z of zones(); track z) {
                <option [value]="z">{{ z }}</option>
              }
            </select>
            <select [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)" style="padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:13px;color:#374151;background:#F9FAFB;outline:none;cursor:pointer;">
              <option value="">All Categories</option>
              <option value="GAP">GAP</option>
              <option value="GEP">GEP</option>
              <option value="GSP">GSP</option>
            </select>
          </div>
        </div>

        <!-- ── Visits by Subordinate ──────────────────────────────── -->
        @for (sub of summary()?.subordinates ?? []; track sub.userId; let si = $index) {
          <div class="sub-card" style="
            background:white;border-radius:20px;margin-bottom:16px;overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #F3F4F6;
            transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          " [style.animation]="'cardFloat3D 0.4s cubic-bezier(0.4,0,0.2,1) ' + (si*0.08) + 's both'">
            <!-- Sub header -->
            <div (click)="sub.isExpanded = !sub.isExpanded" style="
              padding:18px 24px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;
              transition:background 0.15s;
            " class="sub-header">
              <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#D047AE,#E068C4);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:white;box-shadow:0 4px 12px rgba(208,71,174,0.3);">
                  {{ getInitials(sub.fullName) }}
                </div>
                <div>
                  <div style="font-size:15px;font-weight:700;color:#1A1A1A;">{{ sub.fullName }}</div>
                  <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">{{ sub.farmersVisited }} farmers · {{ sub.tasks.length }} visits</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:16px;">
                <div style="display:flex;gap:6px;">
                  <span style="padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;background:#FADDF2;color:#C2389A;">{{ sub.gapCount }} GAP</span>
                  <span style="padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;background:#E0F2FE;color:#0284C7;">{{ sub.gepCount }} GEP</span>
                  <span style="padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;background:#EDE9FE;color:#7C3AED;">{{ sub.gspCount }} GSP</span>
                </div>
                <svg [style]="'transition:transform 0.3s;transform:rotate(' + (sub.isExpanded ? '180' : '0') + 'deg)'" width="16" height="16" viewBox="0 0 20 20" fill="#9CA3AF">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>

            @if (sub.isExpanded) {
              <div style="border-top:1px solid #E5E7EB;animation:expandDown 0.35s cubic-bezier(0.4,0,0.2,1);">
                <div style="overflow-x:auto;">
                  <table style="width:100%;border-collapse:collapse;">
                    <thead>
                      <tr style="background:#F8FAFC;">
                        <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Task</th>
                        <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Category</th>
                        <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Farmers</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Zone</th>
                        <th style="padding:12px 16px;text-align:center;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
                        <th style="padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (task of getFilteredTasks(sub); track task.id; let ti = $index) {
                        <tr class="visit-row" style="border-bottom:1px solid #F3F4F6;transition:background 0.15s;" [style.animation]="'rowSlideIn 0.3s ease ' + (ti*0.04) + 's both'">
                          <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#1A1A1A;">{{ task.title }}</td>
                          <td style="padding:12px 16px;text-align:center;">
                            <span [style]="catBadge(task.category)">{{ task.category }}</span>
                          </td>
                          <td style="padding:12px 16px;text-align:center;font-size:14px;font-weight:700;color:#D047AE;">{{ task.farmersVisited }}</td>
                          <td style="padding:12px 16px;font-size:13px;color:#6B7280;">{{ task.location }}</td>
                          <td style="padding:12px 16px;text-align:center;font-size:13px;color:#6B7280;">{{ task.completedDate }}</td>
                          <td style="padding:12px 16px;font-size:12px;color:#9CA3AF;">{{ task.notes ?? '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }

        @if ((summary()?.subordinates ?? []).length === 0) {
          <div style="padding:48px;text-align:center;color:#9CA3AF;background:white;border-radius:20px;">
            <p style="margin:0;font-size:14px;">No farm visit data available.</p>
          </div>
        }
      }
    </div>

    <style>
      @keyframes pageSlideIn { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes cardFloat3D { from { opacity:0; transform:translateY(24px) rotateX(6deg); } to { opacity:1; transform:translateY(0) rotateX(0); } }
      @keyframes expandDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:1000px; } }
      @keyframes rowSlideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
      @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
      .sub-card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.1) !important; }
      .sub-header:hover { background:#FAFAFA; }
      .visit-row:hover { background:#FDF2FB !important; }
      .fv-search:focus { border-color:#E068C4 !important; background:white !important; }
    </style>
  `
})
export class FarmVisitsComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  summary = signal<DashboardSummary | null>(null);
  searchQuery = signal('');
  filterZone = signal('');
  filterCategory = signal('');

  role = this.authService.currentRole;
  subordinateLabel = computed(() => {
    const r = this.role(); return r ? ROLE_SUBORDINATE[r] : '';
  });

  totalFarmers = computed(() => this.summary()?.totalFarmersVisited ?? 0);
  totalVisits = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    return subs.reduce((s, sub) => s + sub.tasks.length, 0);
  });
  uniqueZones = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    const set = new Set<string>();
    subs.forEach(sub => sub.tasks.forEach(t => set.add(t.location)));
    return set.size;
  });
  zones = computed(() => {
    const subs = this.summary()?.subordinates ?? [];
    const set = new Set<string>();
    subs.forEach(sub => sub.tasks.forEach(t => set.add(t.location)));
    return Array.from(set).sort();
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

  getFilteredTasks(sub: SubordinateReport): Task[] {
    const q = this.searchQuery().toLowerCase();
    const zone = this.filterZone();
    const cat = this.filterCategory();
    return sub.tasks.filter(t => {
      const matchQ = !q || t.title.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
      const matchZ = !zone || t.location === zone;
      const matchC = !cat || t.category === cat;
      return matchQ && matchZ && matchC;
    });
  }

  catBadge(cat: string): string {
    const m: Record<string, string> = {
      GAP: 'padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:#FADDF2;color:#C2389A;',
      GEP: 'padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:#E0F2FE;color:#0284C7;',
      GSP: 'padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;background:#EDE9FE;color:#7C3AED;',
    };
    return m[cat] ?? '';
  }
}
