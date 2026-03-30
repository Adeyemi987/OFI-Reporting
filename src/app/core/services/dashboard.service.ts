import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, delay, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  DashboardSummary, SubordinateReport, ApprovalStatus,
  DownloadOptions, UserRole,
  DashboardApiData, DashboardApiReport, ApiResult,
  ROLE_READY_MAPPED_STATUS, SubordinatesApiData
} from '../models';

// Handles numeric enum values (default .NET serialization)
const STATUS_MAP_NUMERIC: Record<number, ApprovalStatus> = {
  0: 'pending_fc',
  1: 'pending_pc',
  2: 'pending_gl',
  3: 'pending_csh',
  4: 'pending_sh',
  5: 'pending_ch',
  6: 'approved',
  7: 'rejected',
};

// Handles string enum name values (when JsonStringEnumConverter is used)
const STATUS_MAP_STRING: Record<string, ApprovalStatus> = {
  'PendingFCApproval':  'pending_fc',
  'PendingPCApproval':  'pending_pc',
  'PendingGLApproval':  'pending_gl',
  'PendingCSHApproval': 'pending_csh',
  'PendingSHApproval':  'pending_sh',
  'PendingCHApproval':  'pending_ch',
  'Approved':           'approved',
  'Rejected':           'rejected',
};

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  private mapStatus(status: number | string): ApprovalStatus {
    if (typeof status === 'string') {
      // Try named enum first, then treat as numeric string
      return STATUS_MAP_STRING[status]
        ?? STATUS_MAP_NUMERIC[parseInt(status, 10)]
        ?? 'pending_fc';
    }
    return STATUS_MAP_NUMERIC[status] ?? 'pending_fc';
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

  private mapToDashboardSummary(
    data: DashboardApiData,
    role: UserRole,
    totalSubordinates: number
  ): DashboardSummary {
    const subordinates = data.subordinateReports.map(r => this.mapReport(r));
    const reportSubmittedCount = (data.pendingReportCount ?? 0) + (data.approvedReportCount ?? 0);
    const allSubmitted = totalSubordinates > 0 && reportSubmittedCount >= totalSubordinates;
    const readyStatus = ROLE_READY_MAPPED_STATUS[role];
    const canApprove =
      allSubmitted &&
      readyStatus !== undefined &&
      subordinates.length > 0 &&
      subordinates.every(s => s.status === readyStatus);
    const approvedCount = subordinates.filter(s => s.status === 'approved').length;
    const pendingApprovals = subordinates.filter(s => s.status !== 'approved' && s.status !== 'rejected').length;
    return {
      totalSubordinates,
      reportSubmittedCount,
      allSubmitted,
      totalFarmersVisited: data.totalFarmersVisited,
      totalGAP: data.gapTaskCount,
      totalGEP: data.gepTaskCount,
      totalGSP: data.gspTaskCount,
      pendingApprovals,
      approvedCount,
      canApprove,
      isWeeklyReportSent: data.isWeeklyReportSent ?? false,
      lastUpdated: new Date().toISOString(),
      subordinates,
    };
  }

  getDashboard(role: UserRole): Observable<DashboardSummary> {
    return forkJoin([
      this.api.get<ApiResult<DashboardApiData>>('/api/Dashboard'),
      this.api.get<ApiResult<SubordinatesApiData>>(
        '/api/Users/subordinates?PageNumber=3230&PageSize=3230'
      ).pipe(catchError(() => of({ success: true, message: '', data: { totalCount: 0, items: [] }, errors: null }))),
    ]).pipe(
      map(([dashRes, subsRes]) =>
        this.mapToDashboardSummary(dashRes.data, role, subsRes.data?.totalCount ?? 0)
      )
    );
  }

  getReports(): Observable<DashboardSummary> {
    return this.api.get<ApiResult<{ items: DashboardApiReport[]; totalCount: number }>>(
      '/api/Reports?PageNumber=1&PageSize=100'
    ).pipe(
      map(res => {
        const items = res.data?.items ?? [];
        const subordinates = items.map(r => this.mapReport(r));
        const approvedCount = subordinates.filter(s => s.status === 'approved').length;
        const pendingApprovals = subordinates.filter(s => s.status !== 'approved' && s.status !== 'rejected').length;
        const totalCount = res.data?.totalCount ?? items.length;
        return {
          totalSubordinates: totalCount,
          reportSubmittedCount: items.length,
          allSubmitted: items.length >= totalCount && totalCount > 0,
          totalFarmersVisited: items.reduce((sum, r) => sum + r.farmersVisited, 0),
          totalGAP: items.reduce((sum, r) => sum + r.gapCount, 0),
          totalGEP: items.reduce((sum, r) => sum + r.gepCount, 0),
          totalGSP: items.reduce((sum, r) => sum + r.gspCount, 0),
          pendingApprovals,
          approvedCount,
          canApprove: false,
          isWeeklyReportSent: false,
          lastUpdated: new Date().toISOString(),
          subordinates,
        } as DashboardSummary;
      })
    );
  }

  approve(role: UserRole, approverName: string): Observable<{ success: boolean; message: string }> {
    // TODO: Replace with real approve endpoint
    return of({ success: true, message: 'Report approved and promoted to next level.' }).pipe(delay(1200));
  }

  approveOne(reportId: string, approverName: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<ApiResult<unknown>>(`/api/Reports/${reportId}/approve`, { approverName }).pipe(
      map(r => ({ success: r.success, message: r.message ?? 'Report approved successfully.' }))
    );
  }

  rejectOne(reportId: string, reason: string, approverName: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<ApiResult<unknown>>(`/api/Dashboard/reject/${reportId}`, { reason, approverName }).pipe(
      map(r => ({ success: r.success, message: r.message ?? 'Rejected.' }))
    );
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


