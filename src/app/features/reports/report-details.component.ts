import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { SubordinateReport } from '../../core/models';

@Component({
  selector: 'app-report-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1A1A1A; min-height: 100%; padding: 32px 24px;
    ">
      <!-- Back Button -->
      <button
        (click)="goBack()"
        style="
          display: inline-flex; align-items: center; gap: 6px;
          margin-bottom: 24px; padding: 10px 18px;
          background: #F0B8E0; color: #8B2D73; border: none; border-radius: 8px;
          font-weight: 600; cursor: pointer; font-size: 14px;
        "
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Back to Reports
      </button>

      <!-- Error State -->
      @if (error()) {
        <div style="
          background: #FEE2E2; border: 1px solid #FECACA;
          border-radius: 12px; padding: 16px; margin-bottom: 24px;
          color: #DC2626; font-size: 14px;
        ">
          {{ error() }}
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div style="
          background: white; border-radius: 20px; padding: 48px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;
        ">
          <svg style="animation: spin 1s linear infinite; display: inline-block; margin-bottom: 16px;" width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(208,71,174,0.25)" stroke-width="3"/>
            <path d="M12 2a10 10 0 0110 10" stroke="#D047AE" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #9CA3AF;">Loading report details...</p>
        </div>
      }

      @if (!loading() && details(); as record) {
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #8B2D73 0%, #D047AE 50%, #D960BA 100%);
          border-radius: 20px; padding: 28px 32px; margin-bottom: 28px;
          box-shadow: 0 8px 28px rgba(208,71,174,0.25);
          color: white;
        ">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="
              width: 56px; height: 56px; border-radius: 14px;
              background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
              display: flex; align-items: center; justify-content: center;
              font-size: 20px; font-weight: 800;
            ">
              {{ getInitials(record.fullName) }}
            </div>
            <div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">{{ record.fullName }}</h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">{{ record.role }}</p>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px;">
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">Farmers Visited</div>
            <div style="font-size: 28px; font-weight: 800; color: #D047AE;">{{ record.farmersVisited }}</div>
          </div>
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">GAP Tasks</div>
            <div style="font-size: 28px; font-weight: 800; color: #228A22;">{{ record.gapCount }}</div>
          </div>
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">GEP Tasks</div>
            <div style="font-size: 28px; font-weight: 800; color: #0EA5E9;">{{ record.gepCount }}</div>
          </div>
          <div style="background: white; border-radius: 14px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #F3F4F6;">
            <div style="font-size: 12px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; margin-bottom: 8px;">GSP Tasks</div>
            <div style="font-size: 28px; font-weight: 800; color: #8B5CF6;">{{ record.gspCount }}</div>
          </div>
        </div>

        <!-- Tabbed Interface -->
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 24px;">
          <!-- Tab Buttons -->
          <div style="
            display: flex; gap: 0; border-bottom: 2px solid #F3F4F6;
            background: #F8FAFC; padding: 0;
          ">
            <button
              (click)="activeTab.set('tasks')"
              [style.background]="activeTab() === 'tasks' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'tasks' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'tasks' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'tasks' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
              </svg>
              Tasks
            </button>
            <button
              (click)="activeTab.set('training')"
              [style.background]="activeTab() === 'training' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'training' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'training' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'training' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              Training Sessions
            </button>
            <button
              (click)="activeTab.set('farm-visits')"
              [style.background]="activeTab() === 'farm-visits' ? 'white' : 'transparent'"
              [style.border-bottom]="activeTab() === 'farm-visits' ? '3px solid #D047AE' : 'none'"
              [style.color]="activeTab() === 'farm-visits' ? '#8B2D73' : '#9CA3AF'"
              [style.font-weight]="activeTab() === 'farm-visits' ? '700' : '500'"
              style="
                padding: 16px 24px; cursor: pointer; border: none;
                transition: all 0.2s; font-size: 14px; white-space: nowrap;
              "
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="display: inline; margin-right: 8px; vertical-align: middle;">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              Farm Visits
            </button>
          </div>

          <!-- Tab Content: Tasks -->
          @if (activeTab() === 'tasks') {
            <div style="padding: 24px;">
              @if (record.taskRecords && record.taskRecords.length > 0) {
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Title</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Description</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Category</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Status</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Completed Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (task of record.taskRecords; track task.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px; font-weight: 600;">{{ task.title }}</td>
                          <td style="padding: 12px 16px; color: #6B7280; font-size: 12px;">{{ task.description ?? '—' }}</td>
                          <td style="padding: 12px 16px; text-align: center;">
                            <span [style]="getCategoryStyle(task.category)">{{ task.category }}</span>
                          </td>
                          <td style="padding: 12px 16px; text-align: center;">
                            @if (task.isCompleted) {
                              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #DCFCE7; color: #16A34A; border-radius: 6px; font-weight: 600; font-size: 11px;">
                                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                Completed
                              </span>
                            } @else {
                              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #FEF9C3; color: #B45309; border-radius: 6px; font-weight: 600; font-size: 11px;">
                                <span style="width: 4px; height: 4px; border-radius: 50%; background: currentColor; display: inline-block;"></span>
                                Pending
                              </span>
                            }
                          </td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ task.completedDate ? (task.completedDate | date:'MMM d, y') : '—' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No tasks recorded for this period.</p>
                </div>
              }
            </div>
          }

          <!-- Tab Content: Training Sessions -->
          @if (activeTab() === 'training') {
            <div style="padding: 24px;">
              @if (record.trainingSessions && record.trainingSessions.length > 0) {
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Title</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Location</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Session Date</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Attendees</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (training of record.trainingSessions; track training.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px; font-weight: 600;">{{ training.title }}</td>
                          <td style="padding: 12px 16px; color: #6B7280;">{{ training.location }}</td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ training.sessionDate ? (training.sessionDate | date:'MMM d, y') : '—' }}
                          </td>
                          <td style="padding: 12px 16px; text-align: center; color: #D047AE; font-weight: 700;">
                            {{ training.attendances ? training.attendances.length : 0 }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No training sessions recorded for this period.</p>
                </div>
              }
            </div>
          }

          <!-- Tab Content: Farm Visits -->
          @if (activeTab() === 'farm-visits') {
            <div style="padding: 24px;">
              @if (record.farmerVisits && record.farmerVisits.length > 0) {
                <div style="overflow-x: auto;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #F8FAFC;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Farmer Name</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Visit Date</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Location</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (visit of record.farmerVisits; track visit.id) {
                        <tr style="border-bottom: 1px solid #F3F4F6;">
                          <td style="padding: 12px 16px; font-weight: 600;">{{ visit.farmerName }}</td>
                          <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">
                            {{ visit.visitDate ? (visit.visitDate | date:'MMM d, y') : '—' }}
                          </td>
                          <td style="padding: 12px 16px; color: #6B7280;">{{ visit.location }}</td>
                          <td style="padding: 12px 16px; color: #9CA3AF; font-size: 12px;">{{ visit.notes ?? '—' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div style="padding: 32px; text-align: center; color: #9CA3AF;">
                  <p style="margin: 0; font-size: 14px;">No farm visits recorded for this period.</p>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (!loading() && !details()) {
        <div style="
          background: white; border-radius: 20px; padding: 48px 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center;
        ">
          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #9CA3AF;">No report details available.</p>
        </div>
      }

      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  details = signal<any>(null);
  activeTab = signal<'tasks' | 'training' | 'farm-visits'>('tasks');
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.goBack();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    
    this.dashboardService.getReportDetails(userId).subscribe({
      next: (response: any) => {
        console.log('[ReportDetails] Component received:', response);
        // Handle both { success, data } wrapper and direct data object
        const payload = response?.data ?? response;
        if (payload) {
          // Normalize field names (API may return PascalCase from .NET)
          const normalized = {
            fullName: payload.fullName ?? payload.FullName ?? payload.userName ?? payload.UserName,
            role: payload.role ?? payload.Role,
            farmersVisited: payload.totalFarmersVisited ?? payload.farmersVisited ?? payload.FarmersVisited ?? 0,
            gapCount: payload.gapTaskCount ?? payload.gapCount ?? payload.GapCount ?? 0,
            gepCount: payload.gepTaskCount ?? payload.gepCount ?? payload.GepCount ?? 0,
            gspCount: payload.gspTaskCount ?? payload.gspCount ?? payload.GspCount ?? 0,
            taskRecords: payload.taskRecords ?? payload.TaskRecords ?? payload.tasks ?? payload.Tasks ?? [],
            trainingSessions: payload.trainingSessions ?? payload.TrainingSessions ?? [],
            farmerVisits: payload.farmerVisits ?? payload.FarmerVisits ?? payload.farmVisits ?? payload.FarmVisits ?? [],
          };
          console.log('[ReportDetails] Normalized payload:', normalized);
          this.details.set(normalized);
          this.error.set(null);
        } else {
          this.error.set('Failed to load report details');
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading report details:', err);
        this.error.set('Error loading report details. Please try again.');
        this.loading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getCategoryStyle(category: string): Record<string, string> {
    const styles: Record<string, Record<string, string>> = {
      GAP: { 'background': '#DCFCE7', 'color': '#16A34A', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' },
      GEP: { 'background': '#E0F2FE', 'color': '#0284C7', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' },
      GSP: { 'background': '#EDE9FE', 'color': '#7C3AED', 'padding': '4px 10px', 'border-radius': '6px', 'font-weight': '600', 'font-size': '11px', 'display': 'inline-block' }
    };
    return styles[category] || styles['GAP'];
  }

  goBack(): void {
    this.router.navigate(['/dashboard/reports']);
  }
}
