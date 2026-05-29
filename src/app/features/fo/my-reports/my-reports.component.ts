import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Report {
  reportId: string;
  userName: string;
  status: number;
  hierarchyLevel: number;
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  farmersVisited: number;
  trainingSessions: number;
  trainingAttendees: number;
  gapCount: number;
  gepCount: number;
  gspCount: number;
  rejectionReason?: string;
}

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-reports-container">
      <div class="reports-header">
        <div>
          <h1>My Reports</h1>
          <p>Track and manage your weekly reports</p>
        </div>
        <a routerLink="/fo/create-report" class="btn-create">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Create New Report
        </a>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading reports...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <h3>Failed to load reports</h3>
          <p>{{ error() }}</p>
          <button (click)="loadReports()" class="btn-retry">Retry</button>
        </div>
      } @else if (reports().length === 0) {
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
          </svg>
          <h3>No reports yet</h3>
          <p>Create your first weekly report to get started</p>
          <a routerLink="/fo/create-report" class="btn-create">Create Report</a>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (report of displayedReports(); track report.reportId) {
                <tr>
                  <td><strong>Week {{ report.weekNumber }}, {{ report.year }}</strong></td>
                  <td>{{ formatDateRange(report.weekStartDate, report.weekEndDate) }}</td>
                  <td><span [class]="'status-badge status-' + getStatusClass(report.status)">{{ getStatusText(report.status) }}</span></td>
                  <td>{{ report.farmersVisited }}</td>
                  <td>{{ report.trainingSessions }}</td>
                  <td>
                    <a [routerLink]="['/fo/report-details', report.reportId]" class="btn-view">View More</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .my-reports-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .reports-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .reports-header p {
      color: #718096;
      margin: 0;
    }

    .btn-create {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.3s;
    }

    .btn-create:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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

    .status-0 { background: #fb923c; color: #7c2d12; }
    .status-1 { background: #60a5fa; color: #1e3a8a; }
    .status-2 { background: #4ade80; color: #14532d; }
    .status-3 { background: #f87171; color: #7f1d1d; }

    .btn-view {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: transform 0.2s;
    }

    .btn-view:hover {
      transform: translateY(-2px);
    }



    .loading-state, .error-state, .empty-state {
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

    .error-state svg, .empty-state svg {
      color: #cbd5e0;
      margin-bottom: 1rem;
    }

    .error-state h3, .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 0.5rem 0;
    }

    .error-state p, .empty-state p {
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
      .my-reports-container {
        padding: 1rem;
      }

      .reports-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .btn-create {
        width: 100%;
        justify-content: center;
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
    }
  `]
})
export class MyReportsComponent implements OnInit {
  private http = inject(HttpClient);

  reports = signal<Report[]>([]);
  displayedReports = signal<Report[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`${environment.apiUrl}/api/Reports?PageNumber=1&PageSize=50`).subscribe({
      next: (response) => {
        const reports = response?.data?.items || response?.items || [];
        const sortedReports = reports.sort((a: Report, b: Report) => b.weekNumber - a.weekNumber);
        this.reports.set(sortedReports);
        this.displayedReports.set(sortedReports.slice(0, 5));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load reports');
        this.loading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  }

  formatDateRange(start: string, end: string): string {
    return `${this.formatDate(start)} - ${this.formatDate(end)}`;
  }

  getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: 'Pending',
      1: 'Under Review',
      2: 'Approved',
      3: 'Rejected'
    };
    return statusMap[status] || 'Unknown';
  }

  getStatusClass(status: number): string {
    return `status-${status}`;
  }
}
