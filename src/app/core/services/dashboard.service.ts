import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  DashboardSummary, SubordinateReport, ApprovalStatus,
  DownloadOptions, UserRole,
  DashboardApiData, DashboardApiReport, ApiResult
} from '../models';

const STATUS_MAP: Record<number, ApprovalStatus> = {
  0: 'pending',
  1: 'approved',
  2: 'rejected',
  3: 'flagged',
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  private mapStatus(status: number): ApprovalStatus {
    return STATUS_MAP[status] ?? 'pending';
  }

  private mapReport(r: DashboardApiReport): SubordinateReport {
    return {
      userId: r.reportId,
      fullName: r.userName,
      role: 'FO',
      farmersVisited: r.farmersVisited,
      gapCount: r.gapCount,
      gepCount: r.gepCount,
      gspCount: r.gspCount,
      status: this.mapStatus(r.status),
      auditLogs: [],
      tasks: [],
      trainingSessions: [],
      isExpanded: false,
    };
  }

  private mapToDashboardSummary(data: DashboardApiData): DashboardSummary {
    const subordinates = data.subordinateReports.map(r => this.mapReport(r));
    return {
      totalSubordinates: data.subordinateReports.length,
      totalFarmersVisited: data.totalFarmersVisited,
      totalGAP: data.gapTaskCount,
      totalGEP: data.gepTaskCount,
      totalGSP: data.gspTaskCount,
      pendingApprovals: data.pendingReportCount,
      approvedCount: data.approvedReportCount,
      canApprove: data.pendingReportCount === 0 && data.subordinateReports.length > 0,
      lastUpdated: new Date().toISOString(),
      subordinates,
    };
  }

  getDashboard(_role: UserRole): Observable<DashboardSummary> {
    return this.api.get<ApiResult<DashboardApiData>>('/api/Dashboard').pipe(
      map(response => this.mapToDashboardSummary(response.data))
    );
  }

  approve(role: UserRole, approverName: string): Observable<{ success: boolean; message: string }> {
    // TODO: Replace with real approve endpoint
    return of({ success: true, message: 'Report approved and promoted to next level.' }).pipe(delay(1200));
  }

  downloadReport(options: DownloadOptions, data: SubordinateReport[]): void {
    const headers = options.type === 'farm-visits'
      ? ['Full Name', 'Role', 'Farmers Visited', 'GAP', 'GEP', 'GSP', 'Status', 'Approval Date', 'Approved By']
      : ['Full Name', 'Role', 'Training Title', 'Category', 'Date', 'Participants', 'Location'];

    let csvContent = headers.join(',') + '\n';

    if (options.type === 'farm-visits') {
      data.forEach(s => {
        csvContent += [
          `"${s.fullName}"`, s.role, s.farmersVisited,
          s.gapCount, s.gepCount, s.gspCount,
          s.status, s.approvalDate ?? '', s.approvedBy ?? ''
        ].join(',') + '\n';
      });
    } else {
      data.forEach(s => {
        s.trainingSessions.forEach(ts => {
          csvContent += [
            `"${s.fullName}"`, s.role, `"${ts.title}"`,
            ts.category, ts.date, ts.participants, `"${ts.location}"`
          ].join(',') + '\n';
        });
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ofi_${options.type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}


