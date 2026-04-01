import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
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

      @if (details(); as record) {
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

        <!-- Tasks Section -->
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 24px;">
          <div style="background: linear-gradient(135deg, #FDF2FB, #FADDF2); padding: 20px 24px; border-bottom: 1px solid #F0B8E0;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #8B2D73; display: flex; align-items: center; gap: 10px;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/></svg>
              Tasks
            </h2>
          </div>
          @if (record.tasks && record.tasks.length > 0) {
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #F8FAFC;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Task</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Category</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Farmers</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Location</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Date</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (task of record.tasks; track task.id) {
                    <tr style="border-bottom: 1px solid #F3F4F6;">
                      <td style="padding: 12px 16px; font-weight: 600;">{{ task.title }}</td>
                      <td style="padding: 12px 16px; text-align: center;">
                        <span [style]="getCategoryStyle(task.category)">{{ task.category }}</span>
                      </td>
                      <td style="padding: 12px 16px; text-align: center; color: #D047AE; font-weight: 700;">{{ task.farmersVisited }}</td>
                      <td style="padding: 12px 16px; color: #6B7280;">{{ task.location }}</td>
                      <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">{{ task.completedDate | date:'MMM d, y' }}</td>
                      <td style="padding: 12px 16px; color: #9CA3AF; font-size: 12px;">{{ task.notes ?? '—' }}</td>
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

        <!-- Training Section -->
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #FDF2FB, #FADDF2); padding: 20px 24px; border-bottom: 1px solid #F0B8E0;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #8B2D73; display: flex; align-items: center; gap: 10px;">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#D047AE"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/></svg>
              Training Sessions
            </h2>
          </div>
          @if (record.trainingSessions && record.trainingSessions.length > 0) {
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="background: #F8FAFC;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Title</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Category</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Participants</th>
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Location</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase;">Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (training of record.trainingSessions; track training.id) {
                    <tr style="border-bottom: 1px solid #F3F4F6;">
                      <td style="padding: 12px 16px; font-weight: 600;">{{ training.title }}</td>
                      <td style="padding: 12px 16px; text-align: center;">
                        <span [style]="getCategoryStyle(training.category)">{{ training.category }}</span>
                      </td>
                      <td style="padding: 12px 16px; text-align: center; color: #D047AE; font-weight: 700;">{{ training.participants }}</td>
                      <td style="padding: 12px 16px; color: #6B7280;">{{ training.location }}</td>
                      <td style="padding: 12px 16px; text-align: center; color: #6B7280; font-size: 12px;">{{ training.date | date:'MMM d, y' }}</td>
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
      } @else {
        <div style="text-align: center; padding: 48px 24px; color: #9CA3AF;">
          <p style="margin: 0; font-size: 16px; font-weight: 600;">Loading details...</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDetailsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  details = signal<SubordinateReport | null>(null);

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (!userId) {
      this.goBack();
      return;
    }

    // Fetch reports for the current user's role
    const role = this.authService.currentRole();
    if (!role) {
      this.goBack();
      return;
    }

    this.dashboardService.getReports(role).subscribe(data => {
      const found = data.subordinates.find((s: SubordinateReport) => s.userId === userId);
      if (found) {
        this.details.set(found);
      } else {
        this.goBack();
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
