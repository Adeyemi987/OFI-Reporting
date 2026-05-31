import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, throwError } from 'rxjs';
import { map, delay, catchError, tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { ApiService } from './api.service';
import { API_BASE_URL } from '../tokens';
import {
  DashboardSummary, SubordinateReport, ApprovalStatus,
  DownloadOptions, UserRole,
  DashboardApiData, DashboardApiReport, ApiResult,
  ROLE_READY_MAPPED_STATUS, SubordinatesApiData, ROLE_HIERARCHY,
  ReportsTablePage
} from '../models';
import {
  reportUiFilterToApiStatus,
  ReportUiStatusFilter
} from '../utils/fo-report-status.util';

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
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private mapStatus(status: number | string): ApprovalStatus {
    if (typeof status === 'string') {
      // Try named enum first, then treat as numeric string
      return STATUS_MAP_STRING[status]
        ?? STATUS_MAP_NUMERIC[parseInt(status, 10)]
        ?? 'pending_fc';
    }
    return STATUS_MAP_NUMERIC[status] ?? 'pending_fc';
  }

  private mapReport(r: DashboardApiReport, subordinateRole: UserRole): SubordinateReport {
    return {
      userId: r.reportId,
      fullName: r.userName,
      role: subordinateRole,
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
    const idx = ROLE_HIERARCHY.indexOf(role);
    const subordinateRole: UserRole = idx > 0 ? ROLE_HIERARCHY[idx - 1] : 'FO';
    const subordinates = data.subordinateReports.map(r => this.mapReport(r, subordinateRole));
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
    // FO role uses the FO-specific Dashboard API
    if (role === 'FO') {
      return this.api.get<ApiResult<DashboardApiData>>('/api/Dashboard/fo').pipe(
        map(dashRes => this.mapToDashboardSummary(dashRes.data, role, 0))
      );
    }

    // Other roles fetch dashboard + subordinates count
    return forkJoin([
      this.api.get<ApiResult<DashboardApiData>>('/api/Dashboard'),
      this.api.get<ApiResult<SubordinatesApiData>>(
        '/api/Users/subordinates?PageNumber=1&PageSize=100'
      ).pipe(catchError(() => of({ success: true, message: '', data: { totalCount: 0, items: [] }, errors: null }))),
    ]).pipe(
      map(([dashRes, subsRes]) =>
        this.mapToDashboardSummary(dashRes.data, role, subsRes.data?.totalCount ?? 0)
      )
    );
  }

  getReportDetails(reportId: string): Observable<ApiResult<any>> {
    return this.api.get<ApiResult<any>>(`/api/Reports/${reportId}`).pipe(
      tap(response => console.log('[ReportDetails] Raw API response:', JSON.stringify(response, null, 2)))
    );
  }

  getReports(role: UserRole): Observable<DashboardSummary> {
    return this.getReportsPage(role, 1, 100, 'all').pipe(
      map(page => ({
        totalSubordinates: page.totalCount,
        reportSubmittedCount: page.subordinates.length,
        allSubmitted: page.subordinates.length >= page.totalCount && page.totalCount > 0,
        totalFarmersVisited: page.subordinates.reduce((sum, r) => sum + r.farmersVisited, 0),
        totalGAP: page.subordinates.reduce((sum, r) => sum + r.gapCount, 0),
        totalGEP: page.subordinates.reduce((sum, r) => sum + r.gepCount, 0),
        totalGSP: page.subordinates.reduce((sum, r) => sum + r.gspCount, 0),
        pendingApprovals: page.pendingApprovals,
        approvedCount: page.approvedCount,
        canApprove: false,
        isWeeklyReportSent: false,
        lastUpdated: new Date().toISOString(),
        subordinates: page.subordinates,
      } as DashboardSummary))
    );
  }

  getReportsPage(
    role: UserRole,
    pageNumber: number,
    pageSize: number,
    statusFilter: ReportUiStatusFilter = 'all'
  ): Observable<ReportsTablePage> {
    if (role === 'FO') {
      return this.getDashboard(role).pipe(
        map(summary => ({
          subordinates: summary.subordinates,
          totalCount: summary.subordinates.length,
          pageNumber: 1,
          pageSize,
          totalPages: 1,
          approvedCount: summary.approvedCount,
          pendingApprovals: summary.pendingApprovals,
        }))
      );
    }

    const apiStatus = reportUiFilterToApiStatus(statusFilter);
    const fetchPage = statusFilter === 'pending' ? 1 : pageNumber;
    const fetchSize = statusFilter === 'pending' ? 100 : pageSize;
    let url = `/api/Reports?PageNumber=${fetchPage}&PageSize=${fetchSize}`;
    if (apiStatus !== undefined) {
      url += `&status=${apiStatus}`;
    }

    return this.api.get<ApiResult<{ items: DashboardApiReport[]; totalCount: number }>>(url).pipe(
      map(res => {
        const items = res.data?.items ?? [];
        const idx = ROLE_HIERARCHY.indexOf(role);
        const subordinateRole: UserRole = idx > 0 ? ROLE_HIERARCHY[idx - 1] : 'FO';
        let subordinates = items.map(r => this.mapReport(r, subordinateRole));

        if (statusFilter === 'pending') {
          subordinates = subordinates.filter(
            s => s.status !== 'approved' && s.status !== 'rejected'
          );
        }

        const apiTotal = res.data?.totalCount ?? items.length;
        const totalCount = statusFilter === 'pending'
          ? subordinates.length
          : apiTotal;
        const totalPages = Math.min(10, Math.max(1, Math.ceil(totalCount / pageSize)));
        const approvedCount = subordinates.filter(s => s.status === 'approved').length;
        const pendingApprovals = subordinates.filter(
          s => s.status !== 'approved' && s.status !== 'rejected'
        ).length;

        return {
          subordinates,
          totalCount,
          pageNumber: statusFilter === 'pending' ? pageNumber : pageNumber,
          pageSize,
          totalPages,
          approvedCount,
          pendingApprovals,
        };
      }),
      catchError((error) => {
        console.error('Reports page error:', error);
        return of({
          subordinates: [],
          totalCount: 0,
          pageNumber: 1,
          pageSize,
          totalPages: 1,
          approvedCount: 0,
          pendingApprovals: 0,
        });
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

  rejectOne(reportId: string, reason: string): Observable<{ success: boolean; message: string }> {
    return this.http.post(
      `${this.baseUrl}/api/Reports/${reportId}/reject`,
      { reason },
      {
        headers: {
          Accept: 'text/plain, application/json',
          'Content-Type': 'application/json'
        },
        responseType: 'text'
      }
    ).pipe(
      map(response => this.parseActionResponse(response, 'Report rejected successfully.')),
      catchError(err => throwError(() => this.normalizeActionError(err, 'Rejection failed. Please try again.')))
    );
  }

  private parseActionResponse(response: string, fallbackMessage: string): { success: boolean; message: string } {
    const trimmed = (response ?? '').trim();
    if (!trimmed) {
      return { success: true, message: fallbackMessage };
    }

    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as ApiResult<unknown>;
        return {
          success: parsed.success ?? true,
          message: parsed.message ?? fallbackMessage
        };
      } catch {
        return { success: true, message: trimmed };
      }
    }

    return { success: true, message: trimmed };
  }

  private normalizeActionError(err: any, fallbackMessage: string): { error: { message: string } } {
    const message = typeof err?.error === 'string' && err.error.trim()
      ? err.error.trim()
      : err?.error?.message ?? fallbackMessage;
    return { error: { message } };
  }

  downloadReport(options: DownloadOptions, data: SubordinateReport[]): void {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `ofi_${options.type}_report_${dateStr}`;

    if (options.format === 'excel') {
      this.downloadExcel(options.type, data, filename);
    } else {
      this.downloadCsv(options.type, data, filename);
    }
  }

  private buildSummaryRows(data: SubordinateReport[]): unknown[][] {
    const header = ['Full Name', 'Role', 'Farmers Visited', 'GAP Tasks', 'GEP Tasks', 'GSP Tasks', 'Status', 'Approval Date', 'Approved By'];
    const rows = data.map(s => [
      s.fullName, s.role, s.farmersVisited,
      s.gapCount, s.gepCount, s.gspCount,
      s.status, s.approvalDate ?? '', s.approvedBy ?? '',
    ]);
    return [header, ...rows];
  }

  private buildFarmVisitRows(data: SubordinateReport[]): unknown[][] {
    const header = ['Full Name', 'Role', 'Task Title', 'Category', 'Farmers Visited', 'Location', 'Completed Date', 'Notes'];
    const rows: unknown[][] = [];
    data.forEach(s => {
      if (s.tasks.length === 0) {
        rows.push([s.fullName, s.role, '—', '', '', '', '', '']);
      } else {
        s.tasks.forEach(t => rows.push([
          s.fullName, s.role, t.title, t.category,
          t.farmersVisited, t.location, t.completedDate, t.notes ?? '',
        ]));
      }
    });
    return [header, ...rows];
  }

  private buildTrainingRows(data: SubordinateReport[]): unknown[][] {
    const header = ['Full Name', 'Role', 'Training Title', 'Category', 'Date', 'Participants', 'Community/Location'];
    const rows: unknown[][] = [];
    data.forEach(s => {
      if (s.trainingSessions.length === 0) {
        rows.push([s.fullName, s.role, '—', '', '', '', '']);
      } else {
        s.trainingSessions.forEach(ts => rows.push([
          s.fullName, s.role, ts.title, ts.category,
          ts.date, ts.participants, ts.location,
        ]));
      }
    });
    return [header, ...rows];
  }

  private downloadExcel(type: DownloadOptions['type'], data: SubordinateReport[], filename: string): void {
    const wb = XLSX.utils.book_new();

    if (type === 'summary' || type === 'farm-visits') {
      const summarySheet = XLSX.utils.aoa_to_sheet(this.buildSummaryRows(data));
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }
    if (type === 'summary' || type === 'farm-visits') {
      const fvSheet = XLSX.utils.aoa_to_sheet(this.buildFarmVisitRows(data));
      XLSX.utils.book_append_sheet(wb, fvSheet, 'Farm Visits');
    }
    if (type === 'summary' || type === 'training') {
      const trainSheet = XLSX.utils.aoa_to_sheet(this.buildTrainingRows(data));
      XLSX.utils.book_append_sheet(wb, trainSheet, 'Training Sessions');
    }

    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  private downloadCsv(type: DownloadOptions['type'], data: SubordinateReport[], filename: string): void {
    let rows: unknown[][];
    if (type === 'training') {
      rows = this.buildTrainingRows(data);
    } else {
      // 'farm-visits' or 'summary' → export summary overview for CSV
      rows = this.buildSummaryRows(data);
    }

    const csvContent = rows.map(row =>
      row.map(cell => {
        const s = String(cell ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}


