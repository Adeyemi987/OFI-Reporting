import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { OfflineReportSyncService } from '../../../core/services/offline-report-sync.service';
import { QueuedReportStatus } from '../../../core/models/offline-report.models';

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
      <a routerLink="/fo/fo-dashboard" class="btn-back">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"/>
        </svg>
        Back to Dashboard
      </a>

      <div class="reports-header">
        <div>
          <h1>My Reports</h1>
          <p>Track and manage your weekly reports</p>
        </div>
        <div class="header-actions">
          @if (pendingReports().length > 0) {
            <button
              type="button"
              class="btn-sync"
              (click)="syncNow()"
              [disabled]="!offlineSync.isOnline() || offlineSync.isSyncing()"
            >
              @if (offlineSync.isSyncing()) {
                Syncing...
              } @else {
                Sync Now ({{ pendingReports().length }})
              }
            </button>
          }
          <a routerLink="/fo/create-report" class="btn-create">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
            </svg>
            Create New Report
          </a>
        </div>
      </div>

      @if (!offlineSync.isOnline()) {
        <div class="offline-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span>You're offline. Saved reports on this device will sync when internet returns.</span>
        </div>
      }

      @if (pendingReports().length > 0) {
        <div class="pending-section">
          <div class="pending-header">
            <h2>Waiting to Sync</h2>
            <p>{{ pendingReports().length }} report(s) saved on this device</p>
          </div>
          <div class="pending-list">
            @for (queued of pendingReports(); track queued.id) {
              <div class="pending-card">
                <div class="pending-info">
                  <strong>Week {{ queued.weekNumber }}, {{ queued.year }}</strong>
                  <span class="pending-period">{{ formatDateRange(queued.weekStartDate, queued.weekEndDate) }}</span>
                  <span [class]="'queued-badge queued-' + queued.status">{{ getQueuedStatusLabel(queued.status) }}</span>
                  @if (queued.lastError) {
                    <span class="pending-error">{{ queued.lastError }}</span>
                  }
                </div>
                <div class="pending-actions">
                  <button
                    type="button"
                    class="btn-retry"
                    (click)="retryQueued(queued.id)"
                    [disabled]="!offlineSync.isOnline() || offlineSync.isSyncing()"
                  >
                    Retry
                  </button>
                  <button type="button" class="btn-delete-queued" (click)="deleteQueued(queued.id)">Remove</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

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
      } @else if (reports().length === 0 && pendingReports().length === 0) {
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
          </svg>
          <h3>No reports yet</h3>
          <p>Create your first weekly report to get started</p>
          <a routerLink="/fo/create-report" class="btn-create">Create Report</a>
        </div>
      } @else if (reports().length === 0 && pendingReports().length > 0) {
        <div class="empty-state empty-state-muted">
          <p>Submitted reports will appear here after they sync to the server.</p>
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

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: white;
      color: #2d3748;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn-back:hover {
      background: #f7fafc;
      transform: translateX(-5px);
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

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-sync {
      padding: 1rem 1.5rem;
      background: #fef3c7;
      color: #92400e;
      border: 2px solid #fbbf24;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-sync:hover:not(:disabled) {
      background: #fde68a;
      transform: translateY(-2px);
    }

    .btn-sync:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .offline-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fef3c7;
      border: 2px solid #fbbf24;
      color: #92400e;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .pending-section {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .pending-header h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
      color: #1a202c;
    }

    .pending-header p {
      margin: 0 0 1rem 0;
      color: #718096;
      font-size: 0.875rem;
    }

    .pending-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pending-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: #f7fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .pending-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .pending-period {
      font-size: 0.8125rem;
      color: #718096;
    }

    .queued-badge {
      display: inline-block;
      width: fit-content;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .queued-pending { background: #fef3c7; color: #92400e; }
    .queued-syncing { background: #dbeafe; color: #1e40af; }
    .queued-failed { background: #fee2e2; color: #991b1b; }

    .pending-error {
      font-size: 0.75rem;
      color: #c53030;
    }

    .pending-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .btn-retry {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .btn-retry:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-delete-queued {
      padding: 0.5rem 1rem;
      background: #fed7d7;
      color: #c53030;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    .empty-state-muted {
      padding: 2rem;
    }

    .empty-state-muted p {
      margin: 0;
      color: #718096;
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
  readonly offlineSync = inject(OfflineReportSyncService);

  reports = signal<Report[]>([]);
  displayedReports = signal<Report[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  pendingReports = computed(() => this.offlineSync.pendingReports());

  ngOnInit(): void {
    this.loadReports();
  }

  syncNow(): void {
    void this.offlineSync.trySyncAll().then(() => this.loadReports());
  }

  retryQueued(id: string): void {
    void this.offlineSync.retryReport(id).then(() => this.loadReports());
  }

  deleteQueued(id: string): void {
    if (!confirm('Remove this saved report from this device? It will not be submitted.')) {
      return;
    }
    void this.offlineSync.deleteQueuedReport(id);
  }

  getQueuedStatusLabel(status: QueuedReportStatus): string {
    const labels: Record<QueuedReportStatus, string> = {
      pending: 'Pending Sync',
      syncing: 'Syncing',
      failed: 'Sync Failed'
    };
    return labels[status];
  }

  loadReports(): void {
    if (!navigator.onLine) {
      this.loading.set(false);
      this.error.set(null);
      return;
    }

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
