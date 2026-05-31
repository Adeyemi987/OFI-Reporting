import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FODashboardService } from '../../../core/services/fo-dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { FODashboardData, FORecentReport } from '../../../core/models/fo-dashboard.models';
import {
  getFoReportStatusClass,
  getFoReportStatusLabel
} from '../../../core/utils/fo-report-status.util';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-fo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="fo-dashboard">
      <!-- Hero Header -->
      <div class="hero-header">
        <div class="hero-content">
          <div class="welcome-badge">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
            </svg>
            <span>Field Officer</span>
          </div>
          <h1>Welcome back, {{ userName() }}!</h1>
          <p>Track your weekly reports and field activities</p>
        </div>
        <div class="hero-actions">
          <a routerLink="/fo/create-report" class="btn-primary">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            Create Weekly Report
          </a>
          <a routerLink="/fo/my-reports" class="btn-secondary">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
            </svg>
            View My Reports
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <h3>Failed to load dashboard</h3>
          <p>{{ error() }}</p>
          <button (click)="loadDashboard()" class="btn-retry">Retry</button>
        </div>
      } @else {
        <!-- KPI Cards Grid -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-primary">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.totalReportsSubmitted || 0 }}</div>
              <div class="kpi-label">Total Reports Submitted</div>
            </div>
          </div>

          <div class="kpi-card kpi-warning">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.pendingApprovalCount || 0 }}</div>
              <div class="kpi-label">Pending Approval</div>
            </div>
          </div>

          <div class="kpi-card kpi-success">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.approvedCount || 0 }}</div>
              <div class="kpi-label">Approved Reports</div>
            </div>
          </div>

          <div class="kpi-card kpi-danger">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.rejectedCount || 0 }}</div>
              <div class="kpi-label">Rejected Reports</div>
            </div>
          </div>

          <div class="kpi-card kpi-info">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.totalFarmerVisitRecords || 0 }}</div>
              <div class="kpi-label">Total Farmer Visits</div>
            </div>
          </div>

          <div class="kpi-card kpi-teal">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.uniqueFarmersReached || 0 }}</div>
              <div class="kpi-label">Unique Farmers Reached</div>
            </div>
          </div>

          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ dashboard()?.totalTrainingSessions || 0 }}</div>
              <div class="kpi-label">Training Sessions</div>
              <div class="kpi-meta">{{ dashboard()?.totalTrainingAttendees || 0 }} attendees</div>
            </div>
          </div>
        </div>

        <!-- Recent Reports Section -->
        <div class="recent-reports-section">
          <div class="section-header">
            <div>
              <h2>Recent Reports</h2>
              <p class="section-subtitle">Latest 5 weekly reports — summary view</p>
            </div>
            <a routerLink="/fo/my-reports" class="view-all-link">
              View All
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
            </a>
          </div>

          @if (recentReports().length === 0) {
            <div class="empty-state">
              <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              <h3>No reports yet</h3>
              <p>Create your first weekly report to get started</p>
              <a routerLink="/fo/create-report" class="btn-primary">Create Report</a>
            </div>
          } @else {
            <div class="table-container">
              <table class="reports-table">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Farmers Visited</th>
                    <th>Training Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (report of recentReports(); track report.reportId) {
                    <tr>
                      <td><strong>Week {{ report.weekNumber }}, {{ report.year }}</strong></td>
                      <td>{{ formatDateRange(report.weekStartDate, report.weekEndDate) }}</td>
                      <td>
                        <span [class]="'status-badge status-' + getReportStatusClass(report.status)">
                          {{ getReportStatusLabel(report.status) }}
                        </span>
                      </td>
                      <td>{{ report.farmersVisited }}</td>
                      <td>{{ report.trainingSessions }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .fo-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .hero-header {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      margin-bottom: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    .hero-content {
      margin-bottom: 2rem;
    }

    .welcome-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .hero-content h1 {
      font-size: 2.5rem;
      font-weight: 900;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .hero-content p {
      font-size: 1.125rem;
      color: #718096;
      margin: 0;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.3s;
      font-size: 1rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
    }

    .btn-secondary {
      background: #f7fafc;
      color: #667eea;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #edf2f7;
      border-color: #667eea;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .kpi-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .kpi-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }

    .kpi-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-primary .kpi-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .kpi-warning .kpi-icon { background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); color: white; }
    .kpi-success .kpi-icon { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; }
    .kpi-danger .kpi-icon { background: linear-gradient(135deg, #fc8181 0%, #f56565 100%); color: white; }
    .kpi-info .kpi-icon { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; }
    .kpi-teal .kpi-icon { background: linear-gradient(135deg, #38b2ac 0%, #319795 100%); color: white; }
    .kpi-purple .kpi-icon { background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%); color: white; }

    .kpi-content {
      flex: 1;
    }

    .kpi-value {
      font-size: 2.5rem;
      font-weight: 900;
      color: #1a202c;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .kpi-label {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-meta {
      font-size: 0.75rem;
      color: #a0aec0;
      margin-top: 0.25rem;
    }

    .recent-reports-section {
      background: white;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0;
    }

    .section-subtitle {
      margin: 0.35rem 0 0;
      font-size: 0.875rem;
      color: #718096;
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #667eea;
      font-weight: 600;
      text-decoration: none;
      transition: gap 0.3s;
    }

    .view-all-link:hover {
      gap: 0.75rem;
    }

    .table-container {
      background: #f7fafc;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .reports-table {
      width: 100%;
      border-collapse: collapse;
    }

    .reports-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .reports-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 700;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reports-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background 0.2s;
      background: white;
    }

    .reports-table tbody tr:last-child {
      border-bottom: none;
    }

    .reports-table tbody tr:hover {
      background: #f7fafc;
    }

    .reports-table td {
      padding: 1rem;
      color: #2d3748;
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-unknown { background: #f3f4f6; color: #4b5563; }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state svg {
      color: #cbd5e0;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #718096;
      margin: 0 0 2rem 0;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state svg {
      color: #fc8181;
      margin-bottom: 1rem;
    }

    .error-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 0.5rem 0;
    }

    .error-state p {
      color: #718096;
      margin: 0 0 2rem 0;
    }

    .btn-retry {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .btn-retry:hover {
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .fo-dashboard {
        padding: 1rem;
      }

      .hero-header {
        padding: 2rem;
      }

      .hero-content h1 {
        font-size: 1.75rem;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .table-container {
        overflow-x: auto;
      }

      .reports-table {
        font-size: 0.75rem;
      }

      .reports-table th,
      .reports-table td {
        padding: 0.75rem 0.5rem;
      }

      .hero-actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FODashboardComponent implements OnInit {
  private foDashboardService = inject(FODashboardService);
  private authService = inject(AuthService);

  dashboard = signal<FODashboardData | null>(null);
  recentReports = signal<FORecentReport[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  userName = computed(() => this.authService.currentUser()?.fullName || 'Field Officer');

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      dashboard: this.foDashboardService.getFODashboard(),
      recent: this.foDashboardService.getDashboardRecentReports()
    }).subscribe({
      next: ({ dashboard, recent }) => {
        this.dashboard.set(dashboard);
        this.recentReports.set(recent.items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard load error:', err);
        this.error.set('Unable to load FO dashboard data');
        this.dashboard.set({
          totalReportsSubmitted: 0,
          pendingApprovalCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalFarmerVisitRecords: 0,
          uniqueFarmersReached: 0,
          totalTrainingSessions: 0,
          totalTrainingAttendees: 0,
          recentReports: []
        });
        this.recentReports.set([]);
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  }

  formatDateRange(start: string | undefined, end: string | undefined): string {
    if (!start || !end) return 'N/A';
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  getReportStatusLabel(status: string | number | null | undefined): string {
    return getFoReportStatusLabel(status);
  }

  getReportStatusClass(status: string | number | null | undefined): string {
    return getFoReportStatusClass(status);
  }
}
